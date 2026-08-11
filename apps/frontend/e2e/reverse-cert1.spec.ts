import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { expect, test, type Page } from '@playwright/test'

const username = process.env.RUNTIME_ADMIN_USERNAME
const password = process.env.RUNTIME_ADMIN_PASSWORD
const apiUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100'
const evidenceFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-reverse-cert1-runtime-evidence.json'
const resultDir = '../../test-results/reverse-cert1'

test.describe('SYSTEM.REVERSE.CERT.1 runtime browser certification', () => {
  test.skip(!username || !password, 'Runtime credential environment is required')
  test.setTimeout(240_000)

  test('renders authoritative reverse workflow rows without runtime errors', async ({ page, request }) => {
    const evidence = JSON.parse(await readFile(evidenceFile, 'utf8')) as {
      runId: string
      summary: {
        ids: Record<'pass' | 'rework' | 'scrap', { componentInstanceId: string; productionOrderId: string; dispatchOrderId: string }>
        labels: Record<'pass' | 'rework' | 'scrap', { componentInstanceNo: string; dispatchOrderNo: string; projectCode: string }>
      }
    }
    const pageErrors: string[] = []
    const failedRequests: string[] = []
    const screenshots: string[] = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) pageErrors.push(message.text())
    })
    page.on('requestfailed', (failed) => {
      if (failed.failure()?.errorText !== 'net::ERR_ABORTED') failedRequests.push(`${failed.method()} ${failed.url()} ${failed.failure()?.errorText ?? ''}`)
    })

    const loginResponse = await request.post(`${apiUrl}/auth/login`, { data: { username, password } })
    expect(loginResponse.status()).toBe(201)
    const login = await loginResponse.json() as { accessToken: string }
    const headers = { Authorization: `Bearer ${login.accessToken}` }

    const expectedStates = { pass: 'IN_YARD', rework: 'IN_YARD', scrap: 'SCRAPPED' }
    for (const scenario of ['pass', 'rework', 'scrap'] as const) {
      const response = await request.get(`${apiUrl}/components/foundation/instances?productionOrderId=${evidence.summary.ids[scenario].productionOrderId}&limit=100`, { headers })
      expect(response.status()).toBe(200)
      const payload = await response.json() as { data: Array<{ id: string; state: string }> }
      expect(payload.data.find((row) => row.id === evidence.summary.ids[scenario].componentInstanceId)?.state).toBe(expectedStates[scenario])
    }

    await page.goto('/login')
    await page.getByLabel('Tài khoản').fill(username!)
    await page.getByLabel('Mật khẩu').fill(password!)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/$/)
    await mkdir(resultDir, { recursive: true })

    const routes = [
      { name: 'qc-returned', path: '/qc/final', search: evidence.runId, required: true },
      { name: 'yard-returned-pass', path: '/yard/components', search: evidence.summary.labels.pass.componentInstanceNo, required: true },
      { name: 'yard-returned-rework', path: '/yard/components', search: evidence.summary.labels.rework.componentInstanceNo, required: true },
      { name: 'logistics-return', path: '/logistics/deliveries', search: evidence.summary.labels.pass.dispatchOrderNo ?? evidence.runId, required: true },
      { name: 'project-lineage', path: '/projects/components', search: evidence.summary.labels.pass.projectCode, required: false },
    ]

    const visibility: Array<{ name: string; fixtureVisible: boolean }> = []
    for (const route of routes) {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(route.path)}(?:\\?|$)`))
      await expectWorkspace(page)
      const search = page.locator('input[type="search"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="Tìm"]:not([placeholder="Tìm kiếm nhanh..."]), input[placeholder*="tìm"]:not([placeholder="Tìm kiếm nhanh..."])').first()
      if (await search.count()) {
        await search.fill(route.search)
        await page.waitForTimeout(700)
      }
      const fixtureVisible = (await page.locator('body').getByText(new RegExp(escapeRegExp(route.search), 'i')).count()) > 0
      visibility.push({ name: route.name, fixtureVisible })
      if (route.required) expect(fixtureVisible, `${route.name} must expose the runtime fixture`).toBe(true)
      const screenshot = `${resultDir}/${route.name}.png`
      await page.screenshot({ path: screenshot, fullPage: true })
      screenshots.push(screenshot)
    }

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    expect(failedRequests, failedRequests.join('\n')).toEqual([])
    await writeFile(`${resultDir}/browser-evidence.json`, JSON.stringify({ runId: evidence.runId, generatedAt: new Date().toISOString(), expectedStates, visibility, screenshots, pageErrors, failedRequests }, null, 2))
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
