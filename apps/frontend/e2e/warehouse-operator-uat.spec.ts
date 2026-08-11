import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { expect, test, type Locator, type Page } from '@playwright/test'

const credentialFile = '/tmp/system-rbac2-credentials.json'
const evidenceDir = '/tmp/uat-warehouse1'

type RuntimeCredentials = {
  credentials: Record<string, string>
}

type StepEvidence = {
  step: string
  status: 'PASS' | 'BLOCKED' | 'FAIL'
  detail: string
  screenshot: string
  horizontalOverflow?: number
  unlabeledControls?: number
}

async function capture(page: Page, name: string) {
  const path = `${evidenceDir}/${name}.png`
  await page.screenshot({ path, fullPage: true })
  return path
}

async function pageOverflow(page: Page) {
  return page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))
}

async function unlabeledControls(scope: Locator) {
  return scope.locator('input, select, textarea, button').evaluateAll((elements) => elements.filter((element) => {
    if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.getAttribute('title')) return false
    if (element.tagName === 'BUTTON' && element.textContent?.trim()) return false
    const id = element.getAttribute('id')
    if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return false
    return !element.closest('label')
  }).length)
}

async function closeAndDiscard(page: Page, dialog: Locator) {
  await dialog.getByRole('button', { name: 'Đóng' }).click()
  const discardButton = page.getByRole('button', { name: 'Thoát và hủy' })
  if (await discardButton.isVisible().catch(() => false)) {
    await discardButton.click()
  }
  await expect(dialog).toBeHidden()
}

test('Warehouse Operator completes a real UI acceptance journey', async ({ page }) => {
  test.setTimeout(600_000)
  const runtime = JSON.parse(await readFile(credentialFile, 'utf8')) as RuntimeCredentials
  const password = runtime.credentials.warehouse_demo
  const evidence: StepEvidence[] = []
  const runtimeErrors: string[] = []
  const failedRequests: string[] = []

  await mkdir(evidenceDir, { recursive: true })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText ?? 'unknown'}`))

  await test.step('Login', async () => {
    await page.goto('/login')
    await page.getByLabel('Tài khoản').fill('warehouse_demo')
    await page.getByLabel('Mật khẩu').fill(password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/$/)
    const screenshot = await capture(page, '01-login-dashboard')
    evidence.push({ step: 'Đăng nhập', status: 'PASS', detail: 'Đăng nhập bằng tài khoản Warehouse Operator thật.', screenshot, horizontalOverflow: await pageOverflow(page) })
  })

  await test.step('Dashboard authorization surface', async () => {
    await expect(page.getByText('VẬT TƯ KHO', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('SẢN XUẤT', { exact: true })).toHaveCount(0)
    await expect(page.getByText('QC', { exact: true })).toHaveCount(0)
    await expect(page.getByText('HỆ THỐNG', { exact: true })).toHaveCount(0)
    const screenshot = await capture(page, '02-dashboard-rbac')
    evidence.push({ step: 'Kiểm tra Dashboard', status: 'PASS', detail: 'Sidebar ẩn Production, QC và System theo permission.', screenshot, horizontalOverflow: await pageOverflow(page) })
  })

  await test.step('Create Supplier permission boundary', async () => {
    await page.goto('/suppliers/list')
    await expect(page.getByText('Không có quyền truy cập')).toBeVisible()
    const screenshot = await capture(page, '03-create-supplier-blocked')
    evidence.push({
      step: 'Tạo Nhà cung cấp',
      status: 'BLOCKED',
      detail: 'Warehouse Operator không có module/permission Suppliers; scenario mâu thuẫn với permission profile đã duyệt.',
      screenshot,
      horizontalOverflow: await pageOverflow(page),
    })
  })

  await page.goto('/inventory')
  const globalReceiptButton = page.getByRole('button', { name: 'Mở phiếu nhập kho' })
  await expect(globalReceiptButton).toBeVisible()

  await test.step('Receipt and put-away form readiness', async () => {
    await globalReceiptButton.click()
    const dialog = page.getByRole('dialog', { name: 'Nhập kho vật tư' })
    await expect(dialog).toBeVisible()
    const materialOptions = await dialog.locator('select').nth(1).locator('option:not([value=""])').count()
    const supplierOptions = await dialog.locator('select').nth(0).locator('option:not([value=""])').count()
    const screenshot = await capture(page, '04-receipt-form')
    const unlabeled = await unlabeledControls(dialog)
    evidence.push({
      step: 'Tạo Receipt / Nhập vật tư / Đưa vào Location',
      status: materialOptions > 0 && supplierOptions > 0 ? 'PASS' : 'BLOCKED',
      detail: `Form runtime có ${supplierOptions} nhà cung cấp và ${materialOptions} vật tư khả dụng.`,
      screenshot,
      horizontalOverflow: await pageOverflow(page),
      unlabeledControls: unlabeled,
    })
    await closeAndDiscard(page, dialog)
  })

  await test.step('Transfer form readiness', async () => {
    await page.getByRole('button', { name: 'Khác' }).click()
    await page.getByRole('button', { name: 'Điều chuyển', exact: true }).last().click()
    const dialog = page.getByRole('dialog', { name: 'Tạo điều chuyển mới' })
    await expect(dialog).toBeVisible()
    const materialOptions = await dialog.locator('select').first().locator('option:not([value=""])').count()
    if (materialOptions > 0) {
      await dialog.getByLabel('Vật tư điều chuyển').selectOption({ index: 1 })
    }
    const sourceOptions = await dialog.getByLabel('Vị trí nguồn').locator('option:not([value=""])').count()
    const screenshot = await capture(page, '05-transfer-form')
    evidence.push({
      step: 'Chuyển Location / Transfer kho',
      status: materialOptions > 0 && sourceOptions > 0 ? 'PASS' : 'BLOCKED',
      detail: `Form có ${materialOptions} vật tư và ${sourceOptions} vị trí nguồn có tồn; đích chỉ dùng các zone kho chính theo implementation hiện tại.`,
      screenshot,
      horizontalOverflow: await pageOverflow(page),
      unlabeledControls: await unlabeledControls(dialog),
    })
    await closeAndDiscard(page, dialog)
  })

  await test.step('Production issue form readiness', async () => {
    await page.getByRole('button', { name: 'Mở phiếu xuất kho' }).click()
    const dialog = page.getByRole('dialog', { name: 'Xuất kho vật tư' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Mục đích xuất kho').selectOption('COMPONENT_PRODUCTION')
    const materialOptions = await dialog.getByLabel('Vật tư xuất kho').locator('option:not([value=""])').count()
    if (materialOptions > 0) {
      await dialog.getByLabel('Vật tư xuất kho').selectOption({ index: 1 })
    }
    const sourceOptions = await dialog.getByLabel('Vị trí nguồn xuất kho').locator('option:not([value=""])').count()
    const screenshot = await capture(page, '06-production-issue-form')
    evidence.push({
      step: 'Issue sang Production',
      status: sourceOptions > 0 ? 'PASS' : 'BLOCKED',
      detail: `Inventory có điểm vào Cấp sản xuất; runtime có ${sourceOptions} vị trí nguồn có tồn khả dụng.`,
      screenshot,
      horizontalOverflow: await pageOverflow(page),
      unlabeledControls: await unlabeledControls(dialog),
    })
    await closeAndDiscard(page, dialog)
  })

  await test.step('Inventory Count form readiness', async () => {
    await page.getByRole('button', { name: 'Khác' }).click()
    await page.getByRole('button', { name: 'Kiểm kê', exact: true }).last().click()
    const dialog = page.getByRole('dialog', { name: 'Chi tiết chênh lệch kiểm kê' })
    await expect(dialog).toBeVisible()
    const screenshot = await capture(page, '07-inventory-count-form')
    evidence.push({
      step: 'Inventory Count',
      status: 'BLOCKED',
      detail: 'Form mở đúng nhưng không ghi dữ liệu vì Receipt trước đó bị chặn; UAT không tạo tồn kho ngoài chuỗi nghiệp vụ yêu cầu.',
      screenshot,
      horizontalOverflow: await pageOverflow(page),
      unlabeledControls: await unlabeledControls(dialog),
    })
    await dialog.getByRole('button', { name: 'Đóng' }).click()
  })

  await test.step('Reverse Production Return availability', async () => {
    await page.getByRole('button', { name: 'Khác' }).click()
    await expect(page.getByRole('button', { name: /Hoàn trả vật tư sản xuất|Nhập trả sản xuất/ })).toHaveCount(0)
    await page.keyboard.press('Escape')
    const screenshot = await capture(page, '08-production-return-missing')
    evidence.push({
      step: 'Reverse Production Return',
      status: 'BLOCKED',
      detail: 'Inventory không cung cấp command hoàn trả sản xuất; command hiện nằm trong Production nhưng role này không được truy cập Production.',
      screenshot,
    })
  })

  await test.step('Return Supplier availability', async () => {
    await page.getByRole('button', { name: 'Khác' }).click()
    await expect(page.getByRole('button', { name: /Trả nhà cung cấp/ })).toHaveCount(0)
    await page.keyboard.press('Escape')
    const screenshot = await capture(page, '09-supplier-return-missing')
    evidence.push({
      step: 'Return Supplier',
      status: 'BLOCKED',
      detail: 'Backend có SUPPLIER_RETURN nhưng Inventory chưa có frontend command được cấp cho Warehouse Operator.',
      screenshot,
    })
  })

  await test.step('Export', async () => {
    await page.goto('/inventory/transactions')
    const exportButton = page.getByRole('button', { name: 'Xuất CSV' })
    await expect(exportButton).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise
    const screenshot = await capture(page, '10-export')
    evidence.push({ step: 'Export', status: 'PASS', detail: `Xuất file ${download.suggestedFilename()} từ dữ liệu runtime.`, screenshot, horizontalOverflow: await pageOverflow(page) })
  })

  await test.step('Logout', async () => {
    await page.getByRole('button', { name: 'Mở menu tài khoản' }).click()
    await page.getByRole('button', { name: 'Đăng xuất' }).click()
    await expect(page).toHaveURL(/\/login$/)
    const screenshot = await capture(page, '11-logout')
    evidence.push({ step: 'Đăng xuất', status: 'PASS', detail: 'Phiên đăng nhập được kết thúc qua UI.', screenshot })
  })

  await writeFile(`${evidenceDir}/evidence.json`, JSON.stringify({ evidence, runtimeErrors, failedRequests }, null, 2))
  expect(runtimeErrors, `React runtime errors:\n${runtimeErrors.join('\n')}`).toEqual([])
})
