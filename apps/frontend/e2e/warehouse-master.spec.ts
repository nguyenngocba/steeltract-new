import { mkdir, readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

const credentialFile = '/tmp/system-rbac2-credentials.json'
const screenshotDir = '/tmp/system-warehouse1-playwright'

type RuntimeCredentials = {
  credentials: Record<string, string>
}

test('administrator manages Warehouse Master and assigns a storage location', async ({ page }) => {
  const runtime = JSON.parse(await readFile(credentialFile, 'utf8')) as RuntimeCredentials
  const password = runtime.credentials.admin_demo
  const suffix = Date.now().toString().slice(-8)
  const warehouseCode = `WH-${suffix}`
  const warehouseName = `Kho chứng nhận ${suffix}`
  const updatedName = `${warehouseName} cập nhật`
  const locationCode = `Z-${suffix}`

  await mkdir(screenshotDir, { recursive: true })
  await page.goto('/login')
  await page.getByLabel('Tài khoản').fill('admin_demo')
  await page.getByLabel('Mật khẩu').fill(password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/settings?tab=master&workspace=warehouses')
  const workspace = page.getByRole('dialog', { name: 'Warehouse' })
  await expect(workspace).toBeVisible()
  await page.screenshot({ path: `${screenshotDir}/warehouse-unified-workspace.png`, fullPage: true })

  await workspace.getByRole('button', { name: /Thêm kho/ }).click()
  let detailDrawer = page.getByRole('dialog', { name: 'Thêm kho' })
  await detailDrawer.getByLabel('Mã kho *').fill(warehouseCode)
  await detailDrawer.getByLabel('Tên kho *').fill(warehouseName)
  const warehouseTypeSelect = detailDrawer.getByLabel('Loại kho *')
  const customWarehouseTypeId = await warehouseTypeSelect.locator('option').filter({ hasText: /^CUSTOM\b/ }).getAttribute('value')
  expect(customWarehouseTypeId).toBeTruthy()
  await warehouseTypeSelect.selectOption(customWarehouseTypeId!)
  await detailDrawer.getByText('Cho phép nhập kho').click()
  await detailDrawer.getByText('Cho phép xuất kho').click()
  await detailDrawer.getByRole('button', { name: 'Tạo Kho' }).click()

  let row = workspace.getByRole('row').filter({ hasText: warehouseCode })
  await expect(row).toContainText(warehouseName)
  await row.getByTitle('Sửa kho').click()
  detailDrawer = page.getByRole('dialog', { name: new RegExp(warehouseCode) })
  await detailDrawer.getByLabel('Tên kho *').fill(updatedName)
  await detailDrawer.getByRole('button', { name: 'Lưu thay đổi' }).click()
  row = workspace.getByRole('row').filter({ hasText: warehouseCode })
  await expect(row).toContainText(updatedName)

  await row.getByTitle('Kiểm tra phụ thuộc').click()
  detailDrawer = page.getByRole('dialog', { name: new RegExp(warehouseCode) })
  await expect(detailDrawer).toContainText('có thể ngưng sử dụng')
  await page.screenshot({ path: `${screenshotDir}/warehouse-dependency-drawer.png`, fullPage: true })
  await detailDrawer.getByRole('button', { name: 'Ngưng sử dụng' }).click()
  await expect(row).toContainText('Ngưng dùng')
  await detailDrawer.getByRole('button', { name: 'Đóng' }).click()
  await expect(detailDrawer).toBeHidden()
  await row.getByTitle('Kích hoạt').click()
  await expect(row).toContainText('Hoạt động')

  await page.goto('/inventory/locations')
  await page.getByRole('button', { name: 'Thêm vị trí' }).click()
  const locationDialog = page.getByRole('dialog', { name: 'Thêm vị trí kho' })
  await locationDialog.getByPlaceholder('Mã vị trí, ví dụ A01').fill(locationCode)
  await locationDialog.getByPlaceholder('Tên vị trí').fill(`Vị trí ${suffix}`)
  await locationDialog.locator('select').selectOption({ label: `${updatedName} (${warehouseCode})` })
  await locationDialog.getByPlaceholder('Hàng (Row), ví dụ A').fill('A')
  await locationDialog.getByPlaceholder('Cột (Slot), ví dụ 01').fill('01')
  await locationDialog.getByPlaceholder('Tầng (Level), ví dụ L1').fill('L1')
  await locationDialog.getByRole('button', { name: 'Lưu vị trí' }).click()
  await expect(page.getByText(locationCode, { exact: true })).toBeVisible()

  await page.screenshot({
    path: `${screenshotDir}/warehouse-location-runtime.png`,
    fullPage: true,
  })

  await page.goto('/yard/locations')
  await expect(page.getByText('Danh sách vị trí Slot bãi tập kết')).toBeVisible()
  await page.screenshot({ path: `${screenshotDir}/yard-unified-workspace.png`, fullPage: true })
})
