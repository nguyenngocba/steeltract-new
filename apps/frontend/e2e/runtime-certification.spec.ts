import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { expect, test, type Page } from '@playwright/test'

const execFileAsync = promisify(execFile)
const username = process.env.RUNTIME_ADMIN_USERNAME
const password = process.env.RUNTIME_ADMIN_PASSWORD
const apiUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3000'
const evidenceFile = '/tmp/system-runtime2-business-evidence.json'
const resultDir = '../../test-results/runtime2'

const businessStages = [
  ['receipt', '/inventory/inbound'],
  ['transfer', '/inventory/transfer'],
  ['project', '/projects/list'],
  ['requirement', '/components/list'],
  ['bom', '/production/boms'],
  ['production-order', '/production/orders'],
  ['execution', '/production/execution'],
  ['qc-pass', '/qc/final'],
  ['finished-goods', '/components/stock'],
  ['yard', '/yard/components'],
  ['dispatch', '/logistics/dispatch'],
  ['delivery', '/logistics/deliveries'],
  ['installation', '/projects/components'],
] as const

test.describe('SYSTEM.RUNTIME.2 production runtime closure', () => {
  test.skip(!username || !password, 'Runtime credential environment is required')
  test.setTimeout(600_000)

  test('certifies health, REST workflow, browser workspaces and logout', async ({
    page,
    request,
  }) => {
    const runtimeErrors: string[] = []
    const failedRequests: string[] = []
    const browserTimings: Array<{
      stage: string
      route: string
      durationMs: number
      fixtureVisible: boolean
    }> = []

    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !message.text().startsWith('Failed to load resource:')
      ) {
        runtimeErrors.push(message.text())
      }
    })
    page.on('requestfailed', (failed) => {
      failedRequests.push(
        `${failed.method()} ${failed.url()} ${failed.failure()?.errorText ?? ''}`,
      )
    })
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`)
      }
    })

    for (const probe of ['live', 'ready', 'startup']) {
      const response = await request.get(`${apiUrl}/health/${probe}`)
      expect(response.status(), `${probe} probe`).toBe(200)
    }

    await execFileAsync(process.execPath, ['../../scripts/runtime1-business-certification.mjs'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUNTIME_API_URL: apiUrl,
        RUNTIME_RUN_PREFIX: 'SYSTEM-RUNTIME2',
        RUNTIME_INCLUDE_REVERSE: 'false',
        RUNTIME_EVIDENCE_FILE: evidenceFile,
      },
      timeout: 360_000,
      maxBuffer: 1024 * 1024,
    })
    const businessEvidence = JSON.parse(await readFile(evidenceFile, 'utf8')) as {
      runId: string
      summary: {
        stepCount: number
        assertionCount: number
        failedAssertions: number
        labels: Record<string, string | undefined>
      }
    }
    expect(businessEvidence.summary.failedAssertions).toBe(0)

    await page.goto('/login')
    await page.getByLabel('Tài khoản').fill(username!)
    await page.getByLabel('Mật khẩu').fill(password!)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expectAuthenticatedWorkspace(page)

    await mkdir(resultDir, { recursive: true })
    for (const [stage, route] of businessStages) {
      const startedAt = performance.now()
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(route)}(?:\\?|$)`))
      await expectAuthenticatedWorkspace(page)

      const search = page.locator(
        'input[type="search"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="Tìm"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="tìm"]:not([placeholder="Tìm kiếm nhanh..."])',
      ).first()
      if (await search.count()) {
        await search.fill(searchTerm(stage, businessEvidence.summary.labels, businessEvidence.runId))
        await page.waitForTimeout(500)
      }
      const fixtureVisible = await page.locator('body').getByText(
        new RegExp(escapeRegExp(businessEvidence.runId), 'i'),
      ).count() > 0

      browserTimings.push({
        stage,
        route,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        fixtureVisible,
      })
      await page.screenshot({
        path: `${resultDir}/${stage}.png`,
        fullPage: true,
      })
    }

    const authoritativeStages = new Set([
      'project',
      'requirement',
      'production-order',
      'execution',
      'delivery',
    ])
    const missingAuthoritativeRows = browserTimings.filter(
      (row) => authoritativeStages.has(row.stage) && !row.fixtureVisible,
    )
    expect(
      missingAuthoritativeRows,
      `Fixture was not visible in authoritative workspaces: ${JSON.stringify(missingAuthoritativeRows)}`,
    ).toEqual([])
    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
    expect(failedRequests, failedRequests.join('\n')).toEqual([])

    await page.locator('button:has(svg.lucide-chevron-down)').last().click()
    const logout = page.getByText('Đăng xuất', { exact: true })
    await expect(logout.first()).toBeVisible()
    await logout.first().click()
    await expect(page).toHaveURL(/\/login$/)

    await writeFile(
      `${resultDir}/browser-timings.json`,
      JSON.stringify({
        runId: businessEvidence.runId,
        generatedAt: new Date().toISOString(),
        businessSteps: businessEvidence.summary.stepCount,
        businessAssertions: businessEvidence.summary.assertionCount,
        stages: browserTimings,
      }, null, 2),
    )
  })
})

async function expectAuthenticatedWorkspace(page: Page) {
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('Invalid credentials')
  await expect(page.locator('body')).not.toContainText('Không thể tải module')
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page).not.toHaveURL(/\/login$/)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function searchTerm(
  stage: string,
  labels: Record<string, string | undefined>,
  fallback: string,
) {
  if (stage === 'receipt' || stage === 'transfer' || stage === 'bom') {
    return labels.materialCode ?? fallback
  }
  if (stage === 'project') return labels.projectCode ?? fallback
  if (stage === 'requirement') return labels.componentName ?? fallback
  if (stage === 'production-order' || stage === 'execution') {
    return labels.productionOrderNo ?? fallback
  }
  if (stage === 'qc-pass') return labels.inspectionNo ?? fallback
  if (stage === 'dispatch' || stage === 'delivery') {
    return labels.dispatchOrderNo ?? fallback
  }
  return labels.componentInstanceNo ?? fallback
}
