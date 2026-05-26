import {
  cockpitIcons,
  type CockpitConfig,
  type CockpitMetric,
  type CockpitTab,
} from './OperationalCockpitPage'

const {
  Activity,
  Boxes,
  Cpu,
  DatabaseBackup,
  Factory,
  Gauge,
  LockKeyhole,
  Map,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} = cockpitIcons

const materials = [
  ['STH-HEA-300', 'Thép hình HEA 300', 'Steel Beam', 'm', 'KHO-A-01', 'A-01-03', '12.560', '2.320', 'L2506-001', 'HN-SS400-01', 'Cty Thép Miền Nam', 'Bình thường'],
  ['STT-PL-20', 'Thép tấm 20mm', 'Plate', 'tấm', 'KHO-B-01', 'B-02-07', '4.230', '2.000', 'L2506-002', 'HN-PL20-08', 'Hòa Phát', 'Sắp hết'],
  ['STP-PIPE-114', 'Thép ống Ø114x4.5', 'Pipe', 'm', 'YARD-A', 'E-07-L2', '2.150', '340', 'L2506-003', 'HN-P114-03', 'Pomina', 'QC hold'],
  ['BULONG-M20', 'Bu lông M20 x 60', 'Bolt', 'cái', 'KHO-D-01', 'D-04-11', '12.500', '3.390', 'L2506-004', 'HN-BL-M20', 'NCC Phụ kiện XYZ', 'Reserved'],
]

const transactions = [
  ['NK-2506-031', 'Nhập kho', 'STH-HEA-300', 'KHO-A-01', '12.560 m', 'Trần Văn An', 'Đã hoàn thành', '29/06 09:42'],
  ['XK-2506-021', 'Xuất kho', 'STT-PL-20', 'Nhà xưởng A', '8.450 tấm', 'Nguyễn Văn Bình', 'Chờ duyệt', '29/06 08:15'],
  ['DC-2506-028', 'Điều chuyển', 'STP-PIPE-114', 'Yard A -> KHO-B', '2.150 m', 'Lê Minh Đức', 'Đang vận chuyển', '28/06 16:30'],
  ['RT-2506-007', 'Trả vật tư', 'BULONG-M20', 'Cầu trục 02', '1.200 cái', 'Phạm Quốc Huy', 'Chờ QC', '28/06 14:20'],
]

const components = [
  ['C-2506-B01', 'Cột thép', 'D-12 REV.02', 'ASM-A01', 'Nhà xưởng A', '1.256 kg', 'SS400', 'Cắt - Hàn', '68%', 'Đạt', 'Yard A-03-05', 'Cao'],
  ['B-2506-D12', 'Dầm chính', 'D-18 REV.01', 'ASM-B12', 'Nhà xưởng A', '458 kg', 'SS400', 'Chờ QC', '42%', 'Chờ kiểm', 'QC Bay', 'Cao'],
  ['BR-2506-V01', 'Giằng mái', 'BR-02 REV.03', 'ASM-G01', 'Cầu trục 01', '186 kg', 'SS400', 'Sơn', '83%', 'Đạt', 'Yard B-01-04', 'Thường'],
  ['PL-2506-P05', 'Bản mã', 'PL-20 REV.01', 'ASM-P05', 'Nhà xưởng B', '62 kg', 'SS400', 'Khoan', '55%', 'Rework', 'Xưởng khoan', 'Khẩn'],
]

const projects = [
  ['DA-2506-01', 'Nhà máy kết cấu thép Thăng Long', 'Cty CP Thăng Long', 'Hải Dương', '72%', '68%', '41%', '23%', 'Cao', 'Nguyễn Minh'],
  ['DA-2505-02', 'Nhà xưởng sản xuất Hòa Phát 2', 'Tập đoàn Hòa Phát', 'Đà Nẵng', '45%', '52%', '30%', '12%', 'Trung bình', 'Trần An'],
  ['DA-2504-03', 'Trung tâm thương mại Green Mall', 'Green Mall', 'Bắc Ninh', '15%', '18%', '0%', '0%', 'Cao', 'Lê Bình'],
  ['DA-2503-04', 'Kho logistics Bắc Ninh', 'Logistics BN', 'Bắc Ninh', '90%', '100%', '78%', '46%', 'Thấp', 'Phạm Huy'],
]

const suppliers = [
  ['NCC-001', 'Cty TNHH Thép Miền Nam', 'Steel Supplier', 'TP.HCM', '12', '4.2%', '98%', 'Tốt', 'Thấp'],
  ['NCC-002', 'Tập đoàn Hòa Phát', 'Steel Supplier', 'Đà Nẵng', '8', '6.5%', '96%', 'Tốt', 'Thấp'],
  ['NCC-003', 'Sơn công nghiệp ABC', 'Paint Supplier', 'Bình Dương', '5', '12.0%', '91%', 'Theo dõi', 'Trung bình'],
  ['NCC-004', 'Logistics Bắc Nam', 'Logistics', 'Hà Nội', '4', '18.0%', '88%', 'Giữ thanh toán', 'Cao'],
]

const users = [
  ['USR-001', 'Admin System', 'admin@steeltrack.vn', 'Ban lãnh đạo', 'Quản trị viên', 'Đang hoạt động', '06/06/2025 08:45'],
  ['USR-002', 'Nguyễn Văn Nam', 'nam.nguyen@steeltrack.vn', 'Dự án', 'Quản lý dự án', 'Đang hoạt động', '06/06/2025 07:30'],
  ['USR-003', 'Trần Thị Thu Hằng', 'hang.tran@steeltrack.vn', 'Kế hoạch', 'Nhân viên', 'Đang hoạt động', '05/06/2025 16:20'],
  ['USR-004', 'Đỗ Duy Mạnh', 'manh.do@steeltrack.vn', 'Kho vật tư', 'Thủ kho', 'Đang hoạt động', '05/06/2025 09:40'],
]

function metrics(
  labels: string[],
): CockpitMetric[] {
  const values = [
    '2.568',
    '468',
    '215',
    '1.653',
    '128',
    '104',
    '68.7%',
    '99.2%',
  ]
  const tones: CockpitMetric['tone'][] = [
    'blue',
    'amber',
    'purple',
    'green',
    'cyan',
    'red',
    'green',
    'blue',
  ]

  return labels.map((label, index) => ({
    label,
    value: values[index % values.length],
    sub:
      index % 3 === 0
        ? '+8.6% so với tuần trước'
        : index % 3 === 1
          ? 'đang vận hành'
          : 'cần theo dõi',
    tone: tones[index % tones.length],
  }))
}

function tab(
  id: string,
  label: string,
  purpose: string,
  rows: string[][],
  columns: string[],
  chartLabels: string[] = ['A', 'B', 'C', 'D', 'E', 'F'],
): CockpitTab {
  return {
    id,
    label,
    purpose,
    kpis: metrics([
      'Tổng',
      'Đang xử lý',
      'Chờ duyệt',
      'Hoàn thành',
      'Cảnh báo',
      'SLA',
      'Hiệu suất',
      'Realtime',
    ]),
    tableTitle: `${label} - operational registry`,
    tableColumns: columns,
    rows,
    charts: [
      {
        title: `${label} trend`,
        type: 'line',
        values: [42, 58, 51, 72, 68, 89, 96],
        labels: ['01/06', '06/06', '11/06', '16/06', '21/06', '26/06', '29/06'],
      },
      {
        title: `${label} distribution`,
        type: 'donut',
        values: [46, 28, 16, 8, 6],
        labels: chartLabels,
      },
      {
        title: `${label} pressure`,
        type: 'bars',
        values: [92, 78, 65, 54, 38],
        labels: chartLabels.slice(0, 5),
      },
      {
        title: `${label} heatmap`,
        type: id.includes('map') || id.includes('location') ? 'map' : 'heatmap',
        values: [24, 48, 64, 78, 91],
      },
    ],
    alerts: [
      {
        title: 'Cảnh báo ưu tiên',
        detail: 'Có hạng mục vượt ngưỡng vận hành cần xử lý.',
        tone: 'danger',
      },
      {
        title: 'Tắc nghẽn quy trình',
        detail: 'Một số lane đang tích tụ công việc trong ca hiện tại.',
        tone: 'warning',
      },
      {
        title: 'Dữ liệu mẫu đã sẵn sàng',
        detail: 'Có thể review nhanh trước khi nối API thật.',
        tone: 'success',
      },
    ],
  }
}

export const productionCockpitConfig: CockpitConfig = {
  title: 'Sản xuất',
  description:
    'Manufacturing execution cockpit: lệnh sản xuất, work centers, máy móc, nhân công và AI bottleneck.',
  primaryAction: 'Tạo lệnh sản xuất',
  tabs: [
    tab('overview', 'Tổng quan sản xuất', 'Production KPIs, OEE, machine utilization, delays, bottlenecks and active jobs.', components, ['Mã lệnh', 'Dự án', 'Cấu kiện', 'Workcenter', 'Sản lượng', 'Tiến độ', 'Trạng thái', 'Ưu tiên']),
    tab('orders', 'Lệnh sản xuất', 'Production orders, priority, due dates, consumed materials and assigned team.', components, ['Production Order', 'Project', 'Priority', 'Due Date', 'Progress', 'Workcenter', 'Material', 'Supervisor']),
    tab('workcenters', 'Work Centers', 'Cutting, welding, drilling, painting and assembly utilization.', components, ['Workcenter', 'Active Jobs', 'Queue', 'Operators', 'Utilization', 'ETA', 'Downtime', 'Status']),
    tab('progress', 'Tiến độ', 'Gantt chart, timelines, stage completion and delay heatmap.', components, ['Stage', 'Order', 'Start', 'Finish', 'Dependency', 'Progress', 'Delay', 'Owner']),
    tab('machines', 'Theo dõi máy móc', 'Machine state, downtime, maintenance alerts and runtime telemetry.', components, ['Machine', 'Type', 'Workcenter', 'Current Job', 'Runtime', 'Temperature', 'Vibration', 'Health']),
    tab('workers', 'Nhân công', 'Workers, shifts, assignments, attendance and productivity.', users, ['Worker', 'Email', 'Department', 'Role', 'Task', 'Attendance', 'Productivity']),
    tab('ai', 'AI Bottleneck', 'Predicted delays, congestion alerts, material shortages and recommendations.', components, ['Risk', 'Impact', 'Confidence', 'Suggested Action', 'Priority', 'Owner', 'ETA', 'Status']),
    tab('logs', 'Nhật ký sản xuất', 'Production events, machine events, downtime and operator actions.', transactions, ['Event No', 'Type', 'Object', 'Location', 'Quantity', 'Operator', 'Status', 'Time']),
  ],
}

export const planningCockpitConfig: CockpitConfig = {
  title: 'Kế hoạch',
  description:
    'Industrial planning command center: sản xuất, vật tư, công trình, capacity, forecast và điều phối nguồn lực.',
  primaryAction: 'Tạo kế hoạch mới',
  tabs: [
    tab('overview', 'Tổng quan kế hoạch', 'Active projects, production plans, overdue tasks, capacity usage and risks.', projects, ['Mã KH', 'Dự án', 'Loại', 'Start', 'Finish', 'Progress', 'Risk', 'Owner']),
    tab('production', 'Kế hoạch sản xuất', 'Weekly/monthly plans, line balancing and production order dependencies.', projects, ['PO', 'Project', 'Start', 'Finish', 'Progress', 'Workcenter', 'Capacity', 'Material']),
    tab('materials', 'Kế hoạch vật tư', 'Shortages, reorder forecast, inbound forecast and supplier delivery risk.', materials, ['Material', 'Current', 'Reserved', 'Required', 'Shortage', 'Incoming', 'Supplier', 'ETA']),
    tab('project', 'Kế hoạch công trình', 'Project milestones, shipment schedules and erection schedules.', projects, ['Project', 'Progress', 'Shipment', 'Fabrication', 'Material', 'Erection', 'Risk', 'Priority']),
    tab('capacity', 'Capacity Planning', 'Machine, labor, yard and warehouse capacity balancing.', projects, ['Resource', 'Current Usage', 'Planned Usage', 'Available', 'Overload Risk', 'Adjustment', 'Owner', 'Status']),
    tab('forecast', 'Forecast & AI', 'AI forecasts, demand prediction, delay prediction and failure risk.', projects, ['Issue', 'Predicted Impact', 'Confidence', 'Suggested Action', 'Priority', 'Owner', 'ETA', 'Status']),
    tab('resources', 'Điều phối nguồn lực', 'Workers, cranes, forklifts, machines, trucks and staging zones.', users, ['Resource', 'Current Assignment', 'Planned Assignment', 'Availability', 'Utilization', 'Conflict', 'Owner']),
    tab('logs', 'Nhật ký kế hoạch', 'Planning changes, reschedules, delay adjustments and AI recommendations.', transactions, ['Event', 'Type', 'Object', 'Area', 'Quantity', 'User', 'Status', 'Time']),
  ],
}

export const projectsCockpitConfig: CockpitConfig = {
  title: 'Dự án',
  description:
    'Project execution operations: tiến độ, shipment, lắp dựng, tài liệu, RFI và nhật ký công trình.',
  primaryAction: 'Tạo dự án',
  tabs: [
    tab('overview', 'Tổng quan công trình', 'Active projects, status, completion, budget usage and critical risks.', projects, ['Project Code', 'Customer', 'Location', 'Progress', 'Fabrication', 'Shipment', 'Erection', 'Risk', 'PM']),
    tab('list', 'Danh sách công trình', 'Customer, location, timeline and shipment progress.', projects, ['Project Code', 'Customer', 'Location', 'Start', 'Due Date', 'Progress', 'Delay Risk', 'PM']),
    tab('progress', 'Tiến độ công trình', 'Gantt, milestones, erection stages and critical path.', projects, ['Milestone', 'Project', 'Start', 'Finish', 'Progress', 'Dependency', 'Risk', 'Owner']),
    tab('shipment', 'Shipment & Delivery', 'Shipped components, pending shipments and onsite delivery.', transactions, ['Shipment No', 'Truck', 'Driver', 'Project', 'Components', 'Weight', 'ETA', 'POD']),
    tab('erection', 'Erection / Lắp dựng', 'Erection zones, installed components, crane assignments and sequence.', components, ['Zone', 'Structure', 'Installed', 'Pending', 'Crew', 'Crane', 'Delay', 'Safety']),
    tab('docs', 'Tài liệu & Bản vẽ', 'Drawings, contracts, revisions and approvals.', projects, ['Document', 'Revision', 'Type', 'Uploaded By', 'Approval', 'Components', 'Milestone', 'Status']),
    tab('issues', 'RFI / Issue Tracking', 'RFIs, issues, delays and corrective actions.', projects, ['Issue', 'Severity', 'Assigned To', 'Project', 'Component', 'Due Date', 'Status', 'Escalation']),
    tab('logs', 'Nhật ký công trình', 'Project events, shipment logs, erection updates and approvals.', transactions, ['Event', 'Type', 'Object', 'Area', 'Qty', 'User', 'Status', 'Time']),
  ],
}

export const suppliersCockpitConfig: CockpitConfig = {
  title: 'Nhà cung cấp',
  description:
    'Supplier command center: hiệu suất giao hàng, PO, CO/CQ, chất lượng, tranh chấp và inbound readiness.',
  primaryAction: 'Tạo nhà cung cấp',
  tabs: [
    tab('overview', 'Tổng quan NCC', 'Active suppliers, delivery performance, defect rates and inbound critical materials.', suppliers, ['Supplier', 'Category', 'Region', 'Active PO', 'Delay %', 'QC Pass %', 'Credit', 'Risk']),
    tab('list', 'Danh sách NCC', 'Categories, contacts, status and scorecards.', suppliers, ['Supplier', 'Category', 'Contact', 'Region', 'Active PO', 'Delay %', 'QC Pass %', 'Risk']),
    tab('po', 'Đơn mua (PO)', 'Purchase orders, delivery ETA and pending receipts.', transactions, ['PO', 'Supplier', 'Material', 'Warehouse', 'Qty', 'Buyer', 'Status', 'ETA']),
    tab('delivery', 'Theo dõi giao hàng', 'Inbound trucks, ETA, unloading zones and receiving queue.', transactions, ['Delivery', 'Truck', 'Supplier', 'Dock', 'Qty', 'Receiver', 'Status', 'ETA']),
    tab('score', 'Đánh giá NCC', 'Quality, delays, performance charts and supplier ranking.', suppliers, ['Supplier', 'Quality', 'Delivery', 'Pricing', 'Response', 'Score', 'Trend', 'Risk']),
    tab('docs', 'Chứng từ & CO/CQ', 'Certificates, inspection docs and expiration alerts.', suppliers, ['Document', 'Supplier', 'Material', 'Batch', 'Expiry', 'Approval', 'Owner', 'Status']),
    tab('claims', 'Tranh chấp & Khiếu nại', 'Defective material disputes, claims and corrective actions.', suppliers, ['Claim', 'Supplier', 'Type', 'Material', 'Value', 'Owner', 'Status', 'Due']),
    tab('logs', 'Nhật ký giao dịch', 'PO created, deliveries, QC failures, returns and payment issues.', transactions, ['Event', 'Type', 'Object', 'Area', 'Qty', 'User', 'Status', 'Time']),
  ],
}

export const qcCockpitConfig: CockpitConfig = {
  title: 'Chất lượng (QC)',
  description:
    'Quality command center: inbound QC, component QC, NCR, CAPA, defect analytics and inspection records.',
  primaryAction: 'Tạo phiếu kiểm tra',
  tabs: [
    tab('overview', 'Tổng quan QC', 'Pass rate, failures, active inspections and supplier failure rate.', components, ['QC No', 'Project', 'Object', 'Type', 'Result', 'Inspector', 'Status', 'Time']),
    tab('material', 'QC vật tư đầu vào', 'Inbound QC, certificates, rejected materials and quarantine stock.', materials, ['Material', 'Supplier', 'Batch', 'Heat No', 'Result', 'Inspector', 'Disposition', 'Status']),
    tab('component', 'QC cấu kiện', 'Weld inspection, dimension check, coating check and repair tracking.', components, ['Component', 'Inspection Type', 'Inspector', 'Result', 'Severity', 'Defect', 'Rework', 'Approval']),
    tab('ncr', 'NCR Management', 'Non-conformance reports, severity, corrective actions and escalation.', components, ['NCR', 'Component', 'Severity', 'Root Cause', 'Owner', 'Corrective Action', 'Due', 'Status']),
    tab('capa', 'CAPA', 'Corrective actions, preventive actions, assignments and due dates.', components, ['CAPA', 'Type', 'Issue', 'Owner', 'Due Date', 'Effectiveness', 'Approval', 'Status']),
    tab('analytics', 'QC Analytics', 'Defect trends, supplier quality and root cause charts.', suppliers, ['Category', 'Supplier', 'Defect Rate', 'Trend', 'Root Cause', 'Impact', 'Action', 'Status']),
    tab('records', 'Hồ sơ kiểm tra', 'Inspection documents, approvals, certificates and attachments.', components, ['Document', 'Object', 'Revision', 'Uploaded By', 'Approval', 'Linked NCR', 'Status', 'Date']),
    tab('logs', 'Nhật ký QC', 'Inspections, failures, approvals and rework logs.', transactions, ['Event', 'Type', 'Object', 'Area', 'Qty', 'User', 'Status', 'Time']),
  ],
}

export const logisticsCockpitConfig: CockpitConfig = {
  title: 'Vận chuyển',
  description:
    'Logistics command center: shipment planning, loading bay, route tracking, POD, fleet và packing.',
  primaryAction: 'Tạo lệnh vận chuyển',
  tabs: [
    tab('overview', 'Tổng quan vận chuyển', 'Active trucks, shipment load, delivery status and fleet utilization.', transactions, ['VC No', 'Project', 'From', 'To', 'Truck', 'Driver', 'Status', 'Weight']),
    tab('planning', 'Shipment Planning', 'Grouped loads, truck assignments and loading sequence.', components, ['Shipment', 'Truck', 'Project', 'Components', 'Weight', 'Loading Status', 'ETA', 'Driver']),
    tab('bay', 'Loading Bay', 'Loading queue, truck status and crane allocation.', transactions, ['Lane', 'Truck', 'Shipment', 'Crane', 'Progress', 'Queue', 'Delay', 'Status']),
    tab('route', 'Route Tracking', 'GPS, estimated arrival and route maps.', transactions, ['Truck', 'Driver', 'Route', 'ETA', 'Speed', 'Deviation', 'Status', 'POD']),
    tab('pod', 'POD / Delivery', 'Delivery confirmation, signed POD, issues and photos.', transactions, ['POD', 'Shipment', 'Project', 'Receiver', 'Arrival', 'Photos', 'Issue', 'Status']),
    tab('fleet', 'Fleet Management', 'Trucks, maintenance, drivers and fuel logs.', transactions, ['Truck', 'Driver', 'Runtime', 'Fuel', 'Maintenance', 'Utilization', 'Status', 'Next Service']),
    tab('packing', 'Container & Packing', 'Packing groups, containers, optimization and readiness.', components, ['Container', 'Shipment', 'Components', 'Weight', 'Sequence', 'Readiness', 'Owner', 'Status']),
    tab('logs', 'Nhật ký vận chuyển', 'Departures, arrivals, delays, incidents and POD events.', transactions, ['Event', 'Type', 'Object', 'Area', 'Qty', 'User', 'Status', 'Time']),
  ],
}

export const adminCockpitConfig: CockpitConfig = {
  title: 'Quản trị hệ thống',
  description:
    'Enterprise governance center: người dùng, vai trò, audit logs, cài đặt, UOM và sao lưu dữ liệu.',
  primaryAction: 'Thêm cấu hình',
  tabs: [
    tab('users', 'Người dùng', 'Active users, online users, departments, sessions and activity monitoring.', users, ['User', 'Email', 'Department', 'Role', 'Status', 'Last Login', 'Device']),
    tab('roles', 'Vai trò & Phân quyền', 'Role matrix, permission templates, module access and audit visibility.', users, ['Role', 'Module', 'View', 'Create', 'Edit', 'Delete', 'Export', 'Operational Right']),
    tab('audit', 'Nhật ký hệ thống', 'Who changed what, login attempts, operational events and API logs.', transactions, ['Time', 'User', 'Action', 'Object', 'Detail', 'IP', 'Module', 'Status']),
    tab('settings', 'Cài đặt', 'Company settings, workflow settings, notifications, AI thresholds and localization.', suppliers, ['Setting', 'Group', 'Current Value', 'Owner', 'Approval', 'Updated', 'Risk', 'Status']),
    tab('uom', 'Đơn vị tính', 'UOM registry, conversion matrix and usage analytics.', materials, ['Code', 'Name', 'Category', 'Base Unit', 'Conversion', 'Precision', 'Used In', 'Status']),
    tab('backup', 'Sao lưu dữ liệu', 'Backup overview, jobs, restore center and disaster recovery.', transactions, ['Job', 'Destination', 'Size', 'Retention', 'Last Run', 'Next Run', 'Health', 'Status']),
  ],
  sampleNote:
    'Đã gắn mẫu UOM/category/material/supplier/project/transaction vào các tab để review hiển thị trước khi nối dữ liệu thật.',
}

export const inventoryExpandedTabs = [
  'Trả vật tư',
  'Reservation / Allocation',
  'Warehouse Map',
  'Analytics',
]
