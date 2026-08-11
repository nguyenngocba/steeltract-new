import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { expect, test, type Page } from '@playwright/test'

const execFileAsync = promisify(execFile)
const username = process.env.RUNTIME_ADMIN_USERNAME
const password = process.env.RUNTIME_ADMIN_PASSWORD
const apiUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100'
const evidenceFile = '/tmp/system-e2e2-playwright-business-evidence.json'
const resultDir = '../../test-results/e2e2'

const stages = [
  ['dashboard', '/'],
  ['procurement', '/procurement'],
  ['receipt', '/inventory/inbound'],
  ['transfer', '/inventory/transfer'],
  ['inventory-count', '/inventory/stock-take'],
  ['supplier-return', '/inventory/returns'],
  ['project', '/projects/list'],
  ['requirement', '/components/list'],
  ['bom', '/production/boms'],
  ['production-order', '/production/orders'],
  ['execution', '/production/execution'],
  ['qc', '/qc/final'],
  ['finished-goods', '/components/stock'],
  ['yard', '/yard/components'],
  ['dispatch', '/logistics/dispatch'],
  ['delivery', '/logistics/deliveries'],
  ['installation', '/projects/components'],
  ['reverse', '/logistics/history'],
] as const

test.describe('SYSTEM.E2E.2 canonical enterprise workflow certification', () => {
  test.skip(!username || !password, 'Runtime credential environment is required')
  test.setTimeout(600_000)

  test('certifies real REST workflow and resulting browser workspaces', async ({ page, request }) => {
    const pageErrors: string[] = []
    const failedRequests: string[] = []
    const timings: Array<{ stage: string; route: string; durationMs: number; fixtureVisible: boolean }> = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
        pageErrors.push(message.text())
      }
    })
    page.on('requestfailed', (failed) => {
      const errorText = failed.failure()?.errorText ?? ''
      if (errorText !== 'net::ERR_ABORTED') {
        failedRequests.push(`${failed.method()} ${failed.url()} ${errorText}`)
      }
    })

    for (const probe of ['live', 'ready', 'startup']) {
      expect((await request.get(`${apiUrl}/health/${probe}`)).status(), `${probe} probe`).toBe(200)
    }

    await execFileAsync(process.execPath, ['../../scripts/runtime1-business-certification.mjs'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUNTIME_API_URL: apiUrl,
        RUNTIME_RUN_PREFIX: 'SYSTEM-E2E2-BROWSER',
        RUNTIME_USE_PROCUREMENT: 'true',
        RUNTIME_INCLUDE_REVERSE: 'true',
        RUNTIME_EVIDENCE_FILE: evidenceFile,
      },
      timeout: 360_000,
      maxBuffer: 1024 * 1024,
    })
    const evidence = JSON.parse(await readFile(evidenceFile, 'utf8')) as {
      runId: string
      summary: {
        stepCount: number
        assertionCount: number
        failedAssertions: number
        dashboardChanged: Record<string, boolean>
        labels: Record<string, string | undefined>
      }
    }
    expect(evidence.summary.failedAssertions).toBe(0)
    expect(Object.values(evidence.summary.dashboardChanged).every(Boolean)).toBe(true)

    await page.goto('/login')
    await page.getByLabel('Tài khoản').fill(username!)
    await page.getByLabel('Mật khẩu').fill(password!)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expectWorkspace(page)

    await mkdir(resultDir, { recursive: true })
    for (const [stage, route] of stages) {
      const startedAt = performance.now()
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(route)}(?:\\?|$)`))
      await expectWorkspace(page)

      const search = page.locator(
        'input[type="search"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="Tìm"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="tìm"]:not([placeholder="Tìm kiếm nhanh..."])',
      ).first()
      if (await search.count()) {
        await search.fill(searchTerm(stage, evidence.summary.labels, evidence.runId))
        await page.waitForTimeout(400)
      }
      const fixtureVisible = await page.locator('body').getByText(
        new RegExp(escapeRegExp(evidence.runId), 'i'),
      ).count() > 0
      timings.push({
        stage,
        route,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        fixtureVisible,
      })
      await page.screenshot({ path: `${resultDir}/${stage}.png`, fullPage: true })
    }

    const authoritative = new Set(['project', 'requirement', 'production-order', 'execution', 'delivery'])
    expect(timings.filter((row) => authoritative.has(row.stage) && !row.fixtureVisible)).toEqual([])
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    expect(failedRequests, failedRequests.join('\n')).toEqual([])

    await page.locator('button:has(svg.lucide-chevron-down)').last().click()
    await page.getByText('Đăng xuất', { exact: true }).first().click()
    await expect(page).toHaveURL(/\/login$/)

    await writeFile(`${resultDir}/browser-evidence.json`, JSON.stringify({
      runId: evidence.runId,
      generatedAt: new Date().toISOString(),
      businessSteps: evidence.summary.stepCount,
      businessAssertions: evidence.summary.assertionCount,
      stages: timings,
      pageErrors,
      failedRequests,
    }, null, 2))
  })
})

async function expectWorkspace(page: Page) {
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('body')).not.toContainText('Invalid credentials')
  await expect(page.locator('body')).not.toContainText('Không thể tải module')
  await expect(page).not.toHaveURL(/\/login$/)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function searchTerm(stage: string, labels: Record<string, string | undefined>, fallback: string) {
  if (['receipt', 'transfer', 'inventory-count', 'supplier-return', 'bom'].includes(stage)) return labels.materialCode ?? fallback
  if (stage === 'project') return labels.projectCode ?? fallback
  if (stage === 'requirement') return labels.componentName ?? fallback
  if (stage === 'production-order' || stage === 'execution') return labels.productionOrderNo ?? fallback
  if (stage === 'qc') return labels.inspectionNo ?? fallback
  if (stage === 'dispatch' || stage === 'delivery' || stage === 'reverse') return labels.dispatchOrderNo ?? fallback
  return labels.componentInstanceNo ?? fallback
}
