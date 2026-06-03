export const yardTabs = [
  ['overview', 'Tổng quan bãi'],
  ['map-2d', 'Sơ đồ 2D'],
  ['map-3d', 'Sơ đồ 3D'],
  ['inbound', 'Nhập bãi'],
  ['outbound', 'Xuất bãi'],
  ['transfer', 'Chuyển nội bộ'],
  ['qc', 'QC nội bộ'],
  ['history', 'Lịch sử bãi'],
] as const

export type YardTab = typeof yardTabs[number][0]
