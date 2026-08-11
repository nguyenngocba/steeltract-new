import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { expect, test, type Page } from '@playwright/test'

const username = process.env.RUNTIME_ADMIN_USERNAME
const password = process.env.RUNTIME_ADMIN_PASSWORD
const apiUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100'
const evidenceFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-qc-cert1-runtime-evidence.json'
const resultDir = '../../test-results/qc-cert1'

test.describe('SYSTEM.QC.CERT.1 physical QC browser certification', () => {
  test.skip(!username || !password, 'Runtime administrator credentials are required')
  test.setTimeout(180_000)

  test('renders canonical QC, Finished Goods, and Yard workspaces from the runtime fixture', async ({ page, request }) => {
    const evidence = JSON.parse(await readFile(evidenceFile, 'utf8')) as {
      runId: string
      summary: {
        ids: {
          productionOrderId: string
          instanceIds: Record<'pass' | 'fail' | 'rework' | 'useAsIs' | 'scrap', string>
        }
        labels: { instanceNos: Record<string, string> }
      }
    }
    const pageErrors: string[] = []
    const failedRequests: string[] = []
    const screenshots: string[] = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
        pageErrors.push(message.text())
      }
    })
    page.on('requestfailed', (failed) => {
      if (failed.failure()?.errorText !== 'net::ERR_ABORTED') {
        failedRequests.push(`${failed.method()} ${failed.url()} ${failed.failure()?.errorText ?? ''}`)
      }
    })

    const loginResponse = await request.post(`${apiUrl}/auth/login`, {
      data: { username, password },
    })
    expect(loginResponse.status()).toBe(201)
    const login = await loginResponse.json() as { accessToken: string }
    const headers = { Authorization: `Bearer ${login.accessToken}` }
    const instancesResponse = await request.get(
      `${apiUrl}/components/foundation/instances?productionOrderId=${evidence.summary.ids.productionOrderId}&limit=100`,
      { headers },
    )
    expect(instancesResponse.status()).toBe(200)
    const instancesPayload = await instancesResponse.json() as { data: Array<{ id: string; state: string }> }
    const states = Object.fromEntries(instancesPayload.data.map((row) => [row.id, row.state]))
    expect(states[evidence.summary.ids.instanceIds.pass]).toBe('IN_YARD')
    expect(states[evidence.summary.ids.instanceIds.fail]).toBe('QC_FAILED')
    expect(states[evidence.summary.ids.instanceIds.rework]).toBe('IN_YARD')
    expect(states[evidence.summary.ids.instanceIds.useAsIs]).toBe('IN_YARD')
    expect(states[evidence.summary.ids.instanceIds.scrap]).toBe('SCRAPPED')

    await page.goto('/login')
    await page.getByLabel('Tài khoản').fill(username!)
    await page.getByLabel('Mật khẩu').fill(password!)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/$/)

    await mkdir(resultDir, { recursive: true })
    const routes = [
      { name: 'qc-final', path: '/qc/final', search: evidence.runId, fixtureExpected: true },
      { name: 'components-qc', path: '/components/qc', search: evidence.runId, fixtureExpected: true },
      { name: 'finished-goods', path: '/components/stock', search: evidence.runId, fixtureExpected: false },
      {
        name: 'yard-components',
        path: '/yard/components',
        search: evidence.summary.labels.instanceNos[evidence.summary.ids.instanceIds.pass],
        fixtureExpected: true,
      },
    ]

    for (const route of routes) {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(route.path)}(?:\\?|$)`))
      await expectWorkspace(page)
      const search = page.locator(
        'input[type="search"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="Tìm"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="tìm"]:not([placeholder="Tìm kiếm nhanh..."])',
      ).first()
      if (await search.count()) {
        await search.fill(route.search)
        await page.waitForTimeout(500)
      }
      if (route.fixtureExpected) {
        await expect(page.locator('body')).toContainText(route.search)
      }
      const screenshot = `${resultDir}/${route.name}.png`
      await page.screenshot({ path: screenshot, fullPage: true })
      screenshots.push(screenshot)
    }

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    expect(failedRequests, failedRequests.join('\n')).toEqual([])
    await writeFile(`${resultDir}/browser-evidence.json`, JSON.stringify({
      runId: evidence.runId,
      generatedAt: new Date().toISOString(),
      states,
      screenshots,
      pageErrors,
      failedRequests,
    }, null, 2))
  })
})

async function expectWorkspace(page: Page) {
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('body')).not.toContainText('Không thể tải module')
  await expect(page.locator('body')).not.toContainText('Internal server error')
  await expect(page).not.toHaveURL(/\/login$/)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
