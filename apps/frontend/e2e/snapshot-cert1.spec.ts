import { mkdir, writeFile } from 'node:fs/promises'

import { expect, test, type Page } from '@playwright/test'

const username = process.env.RUNTIME_ADMIN_USERNAME
const password = process.env.RUNTIME_ADMIN_PASSWORD
const apiUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100'
const resultDir = '../../test-results/snapshot-cert1'

test.describe('SYSTEM.SNAPSHOT.1 dashboard browser certification', () => {
  test.skip(!username || !password, 'Runtime credential environment is required')
  test.setTimeout(300_000)

  test('renders live and historical dashboard workspaces without browser crashes', async ({ page, request }) => {
    const pageErrors: string[] = []
    const failedRequests: string[] = []
    const routes: Array<{ name: string; path: string }> = [
      { name: 'dashboard', path: '/' },
      { name: 'inventory', path: '/inventory' },
      { name: 'production', path: '/production' },
      { name: 'qc', path: '/qc/dashboard' },
      { name: 'projects', path: '/projects' },
      { name: 'yard', path: '/yard' },
      { name: 'logistics', path: '/logistics' },
      { name: 'history', path: '/history' },
    ]

    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
        pageErrors.push(message.text())
      }
    })
    page.on('requestfailed', (requestFailure) => {
      if (requestFailure.failure()?.errorText !== 'net::ERR_ABORTED') {
        failedRequests.push(`${requestFailure.method()} ${requestFailure.url()} ${requestFailure.failure()?.errorText ?? ''}`)
      }
    })

    const loginResponse = await request.post(`${apiUrl}/auth/login`, {
      data: { username, password },
    })
    expect(loginResponse.status()).toBe(201)

    await page.goto('/login')
    await page.getByLabel('Tài khoản').fill(username!)
    await page.getByLabel('Mật khẩu').fill(password!)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/$/)
    await mkdir(resultDir, { recursive: true })

    const pages: Array<{ name: string; path: string; title: string; text: string }> = []
    for (const route of routes) {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(route.path)}(?:\\?|$)`))
      await expectWorkspace(page)
      await page.waitForTimeout(800)
      const screenshot = `${resultDir}/${route.name}.png`
      await page.screenshot({ path: screenshot, fullPage: true })
      pages.push({
        ...route,
        title: await page.title(),
        text: (await page.locator('body').innerText()).slice(0, 2_000),
      })
    }

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    expect(failedRequests, failedRequests.join('\n')).toEqual([])
    await writeFile(
      `${resultDir}/browser-evidence.json`,
      JSON.stringify({ checkedAt: new Date().toISOString(), pages, pageErrors, failedRequests }, null, 2),
    )
  })
})

async function expectWorkspace(page: Page) {
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('body')).not.toContainText('Internal server error')
  await expect(page).not.toHaveURL(/\/login$/)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
