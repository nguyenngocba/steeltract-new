import { mkdir, readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

const credentialFile = '/tmp/system-rbac2-credentials.json'
const screenshotDir = '/tmp/system-rbac2-playwright'

type RuntimeCredentials = {
  credentials: Record<string, string>
}

const profiles = [
  {
    username: 'warehouse_demo',
    visible: ['VẬT TƯ KHO'],
    hidden: ['SẢN XUẤT', 'QC', 'HỆ THỐNG'],
    allowedPath: '/inventory',
    forbiddenPath: '/production',
    action: 'Nhập kho',
  },
  {
    username: 'planner_demo',
    visible: ['CẤU KIỆN', 'SẢN XUẤT', 'KẾ HOẠCH', 'CÔNG TRÌNH'],
    hidden: ['VẬT TƯ KHO', 'QC', 'HỆ THỐNG'],
    allowedPath: '/production',
    forbiddenPath: '/qc',
    action: '+ Lệnh SX',
  },
  {
    username: 'qc_demo',
    visible: ['CẤU KIỆN', 'QC'],
    hidden: ['VẬT TƯ KHO', 'CÔNG TRÌNH', 'HỆ THỐNG'],
    allowedPath: '/qc',
    forbiddenPath: '/inventory',
    action: 'Tạo phiếu kiểm tra cấu kiện',
  },
  {
    username: 'logistics_demo',
    visible: ['CẤU KIỆN', 'BÃI TẬP KẾT', 'CÔNG TRÌNH', 'VẬN CHUYỂN'],
    hidden: ['VẬT TƯ KHO', 'QC', 'HỆ THỐNG'],
    allowedPath: '/logistics',
    forbiddenPath: '/inventory',
    action: 'Tạo điều xe',
  },
  {
    username: 'pm_demo',
    visible: ['CẤU KIỆN', 'SẢN XUẤT', 'CÔNG TRÌNH'],
    hidden: ['VẬT TƯ KHO', 'QC', 'HỆ THỐNG'],
    allowedPath: '/projects',
    forbiddenPath: '/qc',
    action: 'Thêm công trình',
  },
  {
    username: 'executive_demo',
    visible: ['VẬT TƯ KHO', 'CẤU KIỆN', 'SẢN XUẤT', 'QC', 'CÔNG TRÌNH'],
    hidden: ['HỆ THỐNG'],
    allowedPath: '/',
    forbiddenPath: '/users',
    hiddenActionPaths: [
      ['/production', '+ Lệnh SX'],
      ['/qc', 'Tạo phiếu kiểm tra cấu kiện'],
      ['/logistics', 'Tạo điều xe'],
      ['/projects', 'Thêm công trình'],
    ],
  },
  {
    username: 'admin_demo',
    visible: ['VẬT TƯ KHO', 'CẤU KIỆN', 'SẢN XUẤT', 'QC', 'CÔNG TRÌNH', 'HỆ THỐNG'],
    hidden: [],
    allowedPath: '/roles',
    forbiddenPath: '',
    action: 'Thêm vai trò',
  },
] as const

test.describe('SYSTEM.RBAC.2 browser authorization matrix', () => {
  test.setTimeout(300_000)

  for (const profile of profiles) {
    test(`${profile.username} receives the correct navigation, route and action surface`, async ({ page }) => {
      const runtime = JSON.parse(await readFile(credentialFile, 'utf8')) as RuntimeCredentials
      await mkdir(screenshotDir, { recursive: true })

      await page.goto('/login')
      await page.getByLabel('Tài khoản').fill(profile.username)
      await page.getByLabel('Mật khẩu').fill(runtime.credentials[profile.username])
      await page.getByRole('button', { name: 'Đăng nhập' }).click()
      await expect(page).toHaveURL(/\/$/)

      for (const label of profile.visible) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
      }
      for (const label of profile.hidden) {
        await expect(page.getByText(label, { exact: true })).toHaveCount(0)
      }

      await page.goto(profile.allowedPath)
      await expect(page.getByText('Không có quyền truy cập')).toHaveCount(0)
      if ('action' in profile && profile.action) {
        await expect(page.getByRole('button', { name: profile.action, exact: false }).first()).toBeVisible()
      }
      await page.screenshot({
        path: `${screenshotDir}/${profile.username}.png`,
        fullPage: true,
      })

      if ('hiddenActionPaths' in profile && profile.hiddenActionPaths) {
        for (const [path, action] of profile.hiddenActionPaths) {
          await page.goto(path)
          await expect(page.getByRole('button', { name: action, exact: false })).toHaveCount(0)
        }
      }

      if (profile.forbiddenPath) {
        await page.goto(profile.forbiddenPath)
        await expect(page.getByText('Không có quyền truy cập')).toBeVisible()
        await expect(page).toHaveURL(/\/unauthorized$/)
      }
    })
  }
})
