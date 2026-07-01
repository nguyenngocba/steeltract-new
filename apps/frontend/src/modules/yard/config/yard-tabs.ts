export const yardTabs = [
  ['overview', 'Tổng quan', '/yard'],
  ['map-2d', 'Bản đồ 2D', '/yard/map-2d'],
  ['map-3d', 'Bản đồ 3D', '/yard/map-3d'],
  ['locations', 'Vị trí bãi', '/yard/locations'],
  ['components', 'Cấu kiện', '/yard/components'],
  ['dispatch', 'Điều phối', '/yard/dispatch'],
  ['tracking', 'Live Tracking', '/yard/tracking'],
  ['heatmap', 'Heatmap', '/yard/heatmap'],
  ['timeline', 'Timeline', '/yard/timeline'],
  ['history', 'Lịch sử', '/yard/history'],
] as const

export type YardTab = typeof yardTabs[number][0]
