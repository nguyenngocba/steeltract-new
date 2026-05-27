export const alerts = [
  {
    id: 1,
    type: 'warning',
    title: 'Tồn kho thấp',
    description: 'Beam H400 dưới mức tối thiểu',
    module: 'Inventory',
    time: '2 phút trước',
  },
  {
    id: 2,
    type: 'danger',
    title: 'Máy quá nhiệt',
    description: 'MC-02 vượt ngưỡng nhiệt độ',
    module: 'Components',
    time: '5 phút trước',
  },
  {
    id: 3,
    type: 'info',
    title: 'Di chuyển bãi',
    description: 'Zone A1 → C3 hoàn thành',
    module: 'Yard',
    time: '10 phút trước',
  },
  {
    id: 4,
    type: 'success',
    title: 'QC hoàn thành',
    description: 'Lô CK-220 đã đạt QC',
    module: 'Production',
    time: '14 phút trước',
  },
]
