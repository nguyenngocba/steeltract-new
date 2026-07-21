import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { Package } from "lucide-react";

import { EnterpriseModulePage } from "@/shared/runtime-tabs/EnterpriseModulePage";
import {
  ModuleDataGrid,
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../../../shared/ui/modules";
import {
  CockpitKpiCard,
} from "../../../../shared/ui/cockpit";
import { nextLocalCode } from "@/shared/utils/code-format";
import { useProjects } from "../../../inventory/hooks/useProjects";
import {
  inventoryInput,
  InventoryChartCard,
  InventoryPanel,
  InventoryPagination,
  inventoryTableHead,
  inventoryTableRow,
} from "../../../inventory/components/InventoryVisuals";
import { ManufacturingOrderModal } from "../../../production/components/ManufacturingOrderModal";
import { ProductionBomModal } from "../../../production/components/ProductionBomModal";
import type { ComponentCostingWarning } from "../../api/contracts/components.contract";
import type { ComponentWorkspaceRow } from "../../api/contracts/components.contract";
import {
  useComponentsWorkspace,
  useComponents,
  useComponentProductionBoms,
  useComponentCostingBreakdown,
  useComponentCosting,
  useCreateComponent,
  useDeleteComponent,
  useProductionOrders,
  useRecalculateComponentCosting,
} from "../../hooks/queries/useComponents";
import {
  formatCurrencyVnd,
  formatQuantity,
} from "@/shared/utils/number-format";
import {
  ComponentsDonut,
  ComponentsMiniBars,
  ComponentsSelect,
  componentsMutedButton,
  componentsPrimaryButton,
} from "./ComponentsCockpitShared";

type ComponentRow = ComponentWorkspaceRow;

type ComponentMetadata = {
  type?: string;
  profile?: string;
  quantity?: number;
  qcQuantity?: number;
};

const inventoryFilterControl =
  "h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65";

type ComponentsListRouteState = {
  componentId?: string;
} | null;

function componentStatusBadgeClass(status: string) {
  const normalized = String(status ?? "").toUpperCase();
  if (
    ["READY", "COMPLETED", "DONE", "FINISHED", "INSTALLED"].includes(normalized)
  ) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }
  if (
    [
      "CUTTING",
      "WELDING",
      "PAINTING",
      "IN_PROGRESS",
      "RUNNING",
      "ACTIVE",
    ].includes(normalized)
  ) {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
  }
  if (["SHIPPED", "DELIVERED"].includes(normalized)) {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }
  if (["FAILED", "REJECTED", "NCR"].includes(normalized)) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }
  return "border-amber-400/30 bg-amber-400/10 text-amber-300";
}

function InventoryMetricCard({
  title,
  value,
  note,
  tone = "blue",
  trend,
  onClick,
}: {
  title: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  tone?:
    | "blue"
    | "emerald"
    | "cyan"
    | "amber"
    | "red"
    | "purple"
    | "indigo"
    | "violet"
    | "orange";
  trend?: number[];
  onClick?: () => void;
}) {
  return (
    <CockpitKpiCard
      title={title}
      value={value}
      note={note}
      tone={tone}
      state="normal"
      trendData={trend}
      onClick={onClick}
      className="!h-[92px] !p-3"
    />
  );
}

function ChartCard({
  title,
  value,
  delta,
  deltaColorClass = "text-slate-400",
  action,
  children,
  className = "h-[260px]",
  chartHeightClass = "h-[150px]",
}: {
  title: string;
  value?: React.ReactNode;
  delta?: React.ReactNode;
  deltaColorClass?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  chartHeightClass?: string;
}) {
  return (
    <InventoryChartCard
      title={title}
      action={action}
      className={className}
    >
      <div className="mb-2 flex items-end justify-between gap-2">
        {value !== undefined ? <div className="text-lg font-bold text-white">{value}</div> : <span />}
        {delta !== undefined ? <div className={`text-[10px] ${deltaColorClass}`}>{delta}</div> : null}
      </div>
      <div className={chartHeightClass}>{children}</div>
    </InventoryChartCard>
  );
}

export function ComponentsListPage() {
  const routeLocation = useLocation();
  const routeComponentId = (routeLocation.state as ComponentsListRouteState)
    ?.componentId;
  const openedRouteComponentIdRef = useRef<string | null>(null);
  const { data: projects = [] } = useProjects();
  const createComponent = useCreateComponent();
  const deleteComponent = useDeleteComponent();
  const recalculateCosting = useRecalculateComponentCosting();
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 14;
  const { data: workspace, isLoading } = useComponentsWorkspace({
    page,
    limit: PAGE_SIZE,
    search: query || undefined,
    project: project || undefined,
    status: status || undefined,
    type: type || undefined,
    location: location || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [project, status, type, location, query]);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [productionComponentId, setProductionComponentId] = useState("");
  const [bomOpen, setBomOpen] = useState(false);
  const [bomComponentId, setBomComponentId] = useState("");
  const [selected, setSelected] = useState<ComponentRow | null>(null);
  const loadProductionDependencies = detailOpen || productionOpen || bomOpen;
  const { data: productionOrders = [] } = useProductionOrders(
    loadProductionDependencies,
  );
  const { data: productionBoms = [] } = useComponentProductionBoms(
    loadProductionDependencies,
  );
  const { data: componentLookup = [] } = useComponents(
    productionOpen || bomOpen,
  );
  const [costingView, setCostingView] = useState<"summary" | "breakdown">(
    "summary",
  );
  const { data: selectedCosting, error: costingError } = useComponentCosting(
    selected?.id,
  );
  const { data: selectedCostingBreakdown, error: costingBreakdownError } =
    useComponentCostingBreakdown(selected?.id);

  const [createForm, setCreateForm] = useState({
    name: "",
    type: "Dầm (Beam)",
    profile: "",
    projectId: "",
    qty: "1",
    location: "Kho cấu kiện",
  });
  function closeCreateModal() {
    setCreateOpen(false);
    setCreateForm({
      name: "",
      type: "Dầm (Beam)",
      profile: "",
      projectId: "",
      qty: "1",
      location: "Kho cấu kiện",
    });
  }

  function closeProductionModal() {
    setProductionOpen(false);
    setProductionComponentId("");
  }

  const rows = workspace?.data ?? [];
  const paginatedRows = rows;
  const componentTableEmptyRows = Array.from({
    length: Math.max(0, PAGE_SIZE - paginatedRows.length),
  });

  useEffect(() => {
    if (
      !routeComponentId ||
      openedRouteComponentIdRef.current === routeComponentId
    ) {
      return;
    }

    const row = rows.find((item) => item.id === routeComponentId);
    if (!row) {
      return;
    }

    openedRouteComponentIdRef.current = routeComponentId;
    setSelected(row);
    setDetailOpen(true);
  }, [routeComponentId, rows]);

  const cockpitKpis = workspace?.summary ?? {
    total: 0,
    running: 0,
    completed: 0,
    waitingMaterial: 0,
    delayed: 0,
    weight: 0,
  };
  const componentAnalytics = workspace?.analytics ?? {
    topWeight: [],
    delayedRows: [],
    materialShortage: [],
    structure: [],
    newestComponents: [],
    activitySeries: [],
    projectDistribution: [],
  };
  const projectDistribution = componentAnalytics.projectDistribution.map(
    ({ projectName, count }) => ({
      id: projectName,
      title: projectName,
      value: `${formatQuantity(count, 0)} cấu kiện`,
    }),
  );

  function openDetail(row: ComponentRow) {
    setSelected(row);
    setDetailOpen(true);
  }

  function openProductionFor(row?: ComponentRow) {
    const target = row ?? selected;
    setDetailOpen(false);
    setProductionComponentId(target?.id ?? "");
    setProductionOpen(true);
  }

  function openBomFor(row?: ComponentRow) {
    const target = row ?? selected;
    setDetailOpen(false);
    setBomComponentId(target?.id ?? "");
    setBomOpen(true);
  }

  async function submitCreate() {
    const code = nextLocalCode("CPL");
    const metadata: ComponentMetadata = {
      type: createForm.type,
      profile: createForm.profile || "N/A",
      quantity: Number(createForm.qty || 0),
      qcQuantity: 0,
    };

    try {
      await createComponent.mutateAsync({
        code,
        name: createForm.name || "COMPONENT",
        description: JSON.stringify(metadata),
        status: "STOCK",
        projectId: createForm.projectId || undefined,
        floor: "Kho cấu kiện",
      });
      toast.success(`Đã tạo cấu kiện ${code}`);
    } catch {
      toast.error("Không thể tạo cấu kiện");
      return;
    }

    closeCreateModal();
  }

  async function handleDelete(row: ComponentRow) {
    if (!window.confirm(`Xóa cấu kiện ${row.code}?`)) return;

    try {
      await deleteComponent.mutateAsync(row.id);
      toast.success(`Đã xóa cấu kiện ${row.code}`);
      if (selected?.id === row.id) {
        setSelected(null);
        setDetailOpen(false);
      }
    } catch {
      toast.error("Không thể xóa cấu kiện");
    }
  }

  async function recalculateSelectedCosting() {
    if (!selected) return;

    try {
      await recalculateCosting.mutateAsync(selected.id);
      toast.success("Đã tính lại chi phí cấu kiện");
    } catch (error) {
      const raw = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      toast.error(
        Array.isArray(raw)
          ? raw.join(", ")
          : raw || "Không thể tính chi phí cấu kiện",
      );
    }
  }

  const productionComponents = componentLookup.map((record) => ({
    id: record.id,
    code: record.code,
    name: record.name,
    projectId: record.projectId,
    project: record.project,
  }));
  const selectedOrders = selected
    ? productionOrders.filter((order) => order.componentId === selected.id)
    : [];
  const selectedBoms = selected
    ? productionBoms.filter(
        (bom) =>
          bom.status !== "ARCHIVED" &&
          (bom.productCode === selected.code ||
            selectedOrders.some((order) => order.bomId === bom.id)),
      )
    : [];
  const selectedRequiredQty = selected?.requiredQty ?? 0;
  const selectedIssuedQty = selected?.issuedQty ?? 0;
  const selectedRemainingQty = selected?.remainingQty ?? 0;
  const quickStats = [
    {
      title: "Tổng cấu kiện",
      value: formatQuantity(cockpitKpis.total, 0),
      note: "Theo lifecycle",
      tone: "text-cyan-300",
    },
    {
      title: "Đang gia công",
      value: formatQuantity(cockpitKpis.running, 0),
      note: "Cut/Weld/Paint",
      tone: "text-blue-300",
    },
    {
      title: "Ready",
      value: formatQuantity(cockpitKpis.completed, 0),
      note: "QC đạt",
      tone: "text-emerald-300",
    },
    {
      title: "Chờ vật tư",
      value: formatQuantity(cockpitKpis.waitingMaterial, 0),
      note: "Cần cấp phát",
      tone: "text-amber-300",
    },
    {
      title: "Trễ tiến độ",
      value: formatQuantity(cockpitKpis.delayed, 0),
      note: "Cần xử lý",
      tone: "text-red-300",
    },
  ];

  return (
    <EnterpriseModulePage>
      <div className="space-y-1 -mt-2">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
          <InventoryMetricCard
            title="Tổng cấu kiện"
            value={formatQuantity(cockpitKpis.total, 0)}
            note="Theo lifecycle"
            tone="blue"
          />
          <InventoryMetricCard
            title="Đang gia công"
            value={formatQuantity(cockpitKpis.running, 0)}
            note="Cut / Weld / Paint"
            tone="cyan"
          />
          <InventoryMetricCard
            title="Ready to ship"
            value={formatQuantity(cockpitKpis.completed, 0)}
            note="QC đạt / sẵn sàng"
            tone="emerald"
          />
          <InventoryMetricCard
            title="Chờ vật tư"
            value={formatQuantity(cockpitKpis.waitingMaterial, 0)}
            note="Cấp phát chưa đủ"
            tone="amber"
          />
          <InventoryMetricCard
            title="Trễ tiến độ"
            value={formatQuantity(cockpitKpis.delayed, 0)}
            note="Cần xử lý"
            tone="red"
          />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px_120px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã, tên, profile, dự án, vị trí..."
              className={`${inventoryFilterControl} xl:col-span-2`}
            />
            <ComponentsSelect
              value={project}
              onChange={setProject}
              className={inventoryFilterControl}
            >
              <option value="">Dự án</option>
              {projects.map((item) => (
                <option key={item.id} value={item.code ?? item.name}>
                  {item.code ?? item.name}
                </option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect
              value={status}
              onChange={setStatus}
              className={inventoryFilterControl}
            >
              <option value="">Trạng thái</option>
              <option value="Tồn kho">Tồn kho</option>
              <option value="Đang SX">Đang SX</option>
              <option value="Đã QC">Đã QC</option>
              <option value="READY">READY</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="INSTALLED">INSTALLED</option>
              <option value="Chờ QC">Chờ QC</option>
              <option value="Không đạt">Không đạt</option>
            </ComponentsSelect>
            <ComponentsSelect
              value={type}
              onChange={setType}
              className={inventoryFilterControl}
            >
              <option value="">Loại cấu kiện</option>
              <option value="Dầm (Beam)">Dầm (Beam)</option>
              <option value="Cột (Column)">Cột (Column)</option>
              <option value="Bản mã (Plate)">Bản mã (Plate)</option>
            </ComponentsSelect>
            <ComponentsSelect
              value={location}
              onChange={setLocation}
              className={inventoryFilterControl}
            >
              <option value="">Vị trí</option>
              <option value="Kho cấu kiện">Kho cấu kiện</option>
              <option value="Workshop A">Workshop A</option>
              <option value="QC nội bộ">QC nội bộ</option>
            </ComponentsSelect>
            <button
              onClick={() => setCreateOpen(true)}
              className={componentsPrimaryButton}
            >
              + Cấu kiện
            </button>
            <button
              onClick={() => openProductionFor()}
              className="h-9 rounded-lg border border-emerald-400/30 bg-emerald-600 px-3 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
            >
              + Lệnh SX
            </button>
            <button
              onClick={() => openBomFor()}
              className={componentsMutedButton}
            >
              + BOM
            </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1 items-start">
          <InventoryPanel className="xl:col-span-9">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                Danh sách cấu kiện
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{workspace?.meta.total ?? 0} cấu kiện</span>
                <span className="hidden text-cyan-300 md:inline">Read model</span>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="h-[clamp(400px,60vh,520px)] min-h-[400px] overflow-auto">
              <table className="w-full min-w-[1050px] text-sm table-fixed">
                <colgroup>
                  <col className="w-[110px]" />
                  <col className="w-[150px]" />
                  <col className="w-[130px]" />
                  <col className="w-[110px]" />
                  <col className="w-[130px]" />
                  <col className="w-[115px]" />
                  <col className="w-[130px]" />
                  <col className="w-[130px]" />
                  <col className="w-[140px]" />
                  <col className="w-[105px]" />
                  <col className="w-[110px]" />
                  <col className="w-[95px]" />
                  <col className="w-[70px]" />
                </colgroup>
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10`}
                  style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                >
                  <tr>
                    {[
                      "Mã cấu kiện",
                      "Tên cấu kiện",
                      "Profile/Kích thước",
                      "Loại",
                      "Dự án",
                      "Work Order",
                      "Progress",
                      "Material Ready",
                      "Vị trí hiện tại",
                      "Trạng thái",
                      "Khối lượng",
                      "Ngày tạo",
                      "Thao tác",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-1.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 ${i === 10 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-6">
                        <ModuleLoadingState label="Đang tải dữ liệu cấu kiện..." />
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr
                        key={row.code}
                        onClick={() => openDetail(row)}
                        className={`cursor-pointer ${inventoryTableRow}`}
                      >
                        <td
                          className="truncate px-1.5 py-0.5 text-cyan-300 font-mono"
                          title={row.code}
                        >
                          {row.code}
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-white"
                          title={row.name}
                        >
                          {row.name}
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-slate-300"
                          title={row.profile}
                        >
                          {row.profile}
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-slate-300"
                          title={row.type}
                        >
                          {row.type}
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-slate-300"
                          title={row.project}
                        >
                          {row.project}
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-cyan-300 font-mono"
                          title={row.workOrder}
                        >
                          {row.workOrder}
                        </td>
                        <td className="px-1.5 py-0.5">
                          <ProgressMeter value={row.progress} />
                        </td>
                        <td className="px-1.5 py-0.5">
                          <ProgressMeter
                            value={row.materialReady}
                            tone={row.materialReady < 100 ? "amber" : "emerald"}
                          />
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-slate-300"
                          title={row.location}
                        >
                          {row.location}
                        </td>
                        <td className="px-1.5 py-0.5">
                          <span
                            className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${componentStatusBadgeClass(row.rawStatus)}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 font-mono tabular-nums text-right text-cyan-300"
                          title={`${formatQuantity(row.weight, 3)} kg`}
                        >
                          {formatQuantity(row.weight, 3)} kg
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-slate-300"
                          title={row.createdAt}
                        >
                          {new Date(row.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td
                          className="px-1.5 py-0.5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            onClick={() => void handleDelete(row)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/20"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {!isLoading && componentTableEmptyRows.map((_, index) => (
                    <tr key={`component-list-empty-${index}`} aria-hidden="true" className="border-b border-white/[0.04]">
                      <td colSpan={13} className="h-9 px-1.5 py-0.5">
                        <div className="h-px w-full bg-white/[0.035]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
            {!isLoading && !rows.length ? (
              <div className="p-3">
                <ModuleEmptyState
                  icon={<Package size={18} />}
                  title="Không tìm thấy cấu kiện"
                  description="Thử đổi từ khóa hoặc bộ lọc trạng thái/dự án."
                />
              </div>
            ) : null}
            <InventoryPagination
              page={page}
              pageCount={Math.max(1, Math.ceil((workspace?.meta.total ?? 0) / PAGE_SIZE))}
              total={workspace?.meta.total ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              containerClassName="grid grid-cols-1 items-center gap-2 px-4 py-1 text-xs text-slate-400 md:grid-cols-3 border-t-0"
            />
          </InventoryPanel>

          <div className="space-y-1 xl:col-span-3">
            <ChartCard
              title="Phân loại"
              value={formatQuantity(rows.length, 0)}
              delta="Beam / Column / Brace / Plate / Assembly"
              className="h-[220px]"
              chartHeightClass="h-[120px] overflow-y-auto scrollbar-none"
            >
              <ComponentsDonut
                centerValue={formatQuantity(rows.length, 0)}
                centerLabel="cấu kiện"
                segments={componentAnalytics.structure}
              />
            </ChartCard>
            <ChartCard
              title="Tiến độ sản xuất"
              value={formatQuantity(cockpitKpis.running, 0)}
              delta="Xu hướng 12 kỳ gần nhất"
              className="h-[188px]"
              chartHeightClass="h-[82px] overflow-y-auto scrollbar-none"
            >
              <ComponentsMiniBars values={componentAnalytics.activitySeries} />
            </ChartCard>
            <ChartCard
              title="Theo dự án"
              value={`${projectDistribution.length} dự án`}
              delta="Top dự án theo số cấu kiện"
              className="h-[200px]"
              chartHeightClass="h-[140px] overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-width-none"
            >
              <RankList
                rows={projectDistribution}
                emptyTitle="Chưa có dự án"
                emptyDescription="Chưa có cấu kiện nào được gán vào dự án."
              />
            </ChartCard>
          </div>
        </div>

        <InventoryChartCard title="Thống kê nhanh" className="min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 divide-white/10">
            {quickStats.map((item, idx) => (
              <div
                key={item.title}
                className={`flex items-center justify-between px-3 py-1.5 ${
                  idx < quickStats.length - 1 ? "sm:border-r border-white/10" : ""
                }`}
              >
                <span className="text-xs text-slate-400">{item.title}</span>
                <div className="text-right">
                  <div className={`text-sm font-bold ${item.tone}`}>{item.value}</div>
                  <div className="text-[10px] text-slate-500">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </InventoryChartCard>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
          <div
            className="w-full rounded-2xl border border-white/10 bg-[#08111f]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] flex flex-col justify-between"
            style={{ maxWidth: "48rem" }}
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                Tạo cấu kiện mới
              </h3>
              <button
                onClick={closeCreateModal}
                className="rounded border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:text-white transition"
              >
                Đóng
              </button>
            </div>
            <div
              className="grid grid-cols-1 xl:grid-cols-2"
              style={{ gap: "0.75rem" }}
            >
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Tên cấu kiện"
                className={`${inventoryInput} xl:col-span-2`}
              />
              <select
                value={createForm.type}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, type: e.target.value }))
                }
                className={inventoryInput}
              >
                <option>Dầm (Beam)</option>
                <option>Cột (Column)</option>
                <option>Bản mã (Plate)</option>
              </select>
              <input
                value={createForm.profile}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, profile: e.target.value }))
                }
                placeholder="Profile/Kích thước"
                className={inventoryInput}
              />
              <select
                value={createForm.projectId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, projectId: e.target.value }))
                }
                className={inventoryInput}
              >
                <option value="">Chọn dự án</option>
                {projects.map(
                  (item: { id: string; code?: string; name: string }) => (
                    <option key={item.id} value={item.id}>
                      {item.code ?? item.name} - {item.name}
                    </option>
                  ),
                )}
              </select>
              <input
                value={createForm.qty}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, qty: e.target.value }))
                }
                placeholder="Số lượng"
                className={inventoryInput}
              />
            </div>
            <div className="mt-4 rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 text-xs text-cyan-100">
              Vật tư không khai báo tại đây. Sau khi tạo cấu kiện, tạo
              Production BOM riêng để quản lý định mức và routing sản xuất.
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-3">
              <button
                onClick={closeCreateModal}
                className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 transition"
              >
                Hủy
              </button>
              <button
                onClick={submitCreate}
                className="rounded bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
              >
                Lưu cấu kiện
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {productionOpen ? (
        <ManufacturingOrderModal
          components={productionComponents}
          boms={productionBoms}
          initialComponentId={productionComponentId}
          onClose={closeProductionModal}
        />
      ) : null}
      {bomOpen ? (
        <ProductionBomModal
          components={productionComponents}
          initialComponentId={bomComponentId}
          onClose={() => {
            setBomOpen(false);
            setBomComponentId("");
          }}
        />
      ) : null}

      <ModuleDetailDrawer
        open={detailOpen && Boolean(selected)}
        title={selected?.name ?? ""}
        subtitle={
          selected
            ? `${selected.code} · ${selected.profile} · ${selected.project}`
            : undefined
        }
        onClose={() => setDetailOpen(false)}
        actions={
          selected ? (
            <>
              <button
                onClick={() => openBomFor(selected)}
                className={componentsMutedButton}
              >
                Tạo BOM
              </button>
              <button
                onClick={() => openProductionFor(selected)}
                className="rounded-xl border border-emerald-400/30 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Sản xuất
              </button>
              <button
                onClick={() => void handleDelete(selected)}
                className="rounded-lg border border-red-800 px-3 py-2 text-sm text-red-300"
              >
                Xóa
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <>
            <div
              className="grid grid-cols-1 xl:grid-cols-3"
              style={{ gap: "1rem" }}
            >
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Trạng thái</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {selected.status}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Số lượng hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {formatQuantity(selected.qty, 0)} kiện
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Vị trí hiện tại</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {selected.location}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 text-sm font-semibold text-white">
                Thông tin cấu kiện
              </div>
              <div
                className="grid grid-cols-2 xl:grid-cols-6"
                style={{ gap: "0.75rem" }}
              >
                <CostMetric title="Code" value={selected.code} />
                <CostMetric title="Name" value={selected.name} />
                <CostMetric title="Type" value={selected.type} />
                <CostMetric title="Project" value={selected.project} />
                <CostMetric
                  title="Weight"
                  value={`${formatQuantity(selected.weight, 3)} kg`}
                />
                <CostMetric title="Status" value={selected.rawStatus} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-white">
                  Vị trí lắp đặt
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Thông tin được ghi khi xác nhận lắp đặt tại công trình.
                </div>
              </div>
              <div
                className="grid grid-cols-2 xl:grid-cols-4"
                style={{ gap: "0.75rem" }}
              >
                <CostMetric
                  title="Khu vực"
                  value={selected.installZone ?? "-"}
                />
                <CostMetric title="Trục" value={selected.installAxis ?? "-"} />
                <CostMetric title="Tầng" value={selected.installLevel ?? "-"} />
                <CostMetric
                  title="Vị trí"
                  value={selected.installPosition ?? "-"}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div
                className="mb-3 flex items-center justify-between"
                style={{ gap: "0.75rem" }}
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    Production BOM liên kết
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Định mức vật tư và routing dùng khi phát hành lệnh sản xuất.
                  </div>
                </div>
                <button
                  onClick={() => openBomFor(selected)}
                  className={componentsMutedButton}
                >
                  + Tạo BOM
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-2 py-2 text-left">Mã BOM</th>
                    <th className="px-2 py-2 text-left">Phiên bản</th>
                    <th className="px-2 py-2 text-left">Vật tư</th>
                    <th className="px-2 py-2 text-left">Routing</th>
                    <th className="px-2 py-2 text-left">KL ước tính</th>
                    <th className="px-2 py-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBoms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-5 text-center text-slate-500"
                      >
                        Chưa có Production BOM. Tạo BOM trước khi phát hành lệnh
                        sản xuất.
                      </td>
                    </tr>
                  ) : (
                    selectedBoms.map((bom) => (
                      <tr
                        key={bom.id}
                        className="border-t border-slate-800 text-slate-200"
                      >
                        <td className="px-2 py-2 text-cyan-300">{bom.bomNo}</td>
                        <td className="px-2 py-2">{bom.version}</td>
                        <td className="px-2 py-2">{bom.items.length}</td>
                        <td className="px-2 py-2">
                          {bom.routingSteps.length} bước
                        </td>
                        <td className="px-2 py-2">
                          {formatQuantity(bom.estimatedWeight, 0)} kg
                        </td>
                        <td className="px-2 py-2">
                          <span className="rounded bg-emerald-950 px-2 py-1 text-xs text-emerald-300">
                            {bom.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid xl:grid-cols-2" style={{ gap: "1rem" }}>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-white">Vật tư</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Tính theo BOM required và Production Material Issue đã cấp
                    phát.
                  </div>
                </div>
                <div className="grid grid-cols-3" style={{ gap: "0.75rem" }}>
                  <CostMetric
                    title="Required"
                    value={quantity(selectedRequiredQty)}
                  />
                  <CostMetric
                    title="Issued"
                    value={quantity(selectedIssuedQty)}
                    tone="text-emerald-300"
                  />
                  <CostMetric
                    title="Remaining"
                    value={quantity(selectedRemainingQty)}
                    tone={
                      selectedRemainingQty > 0
                        ? "text-amber-300"
                        : "text-cyan-300"
                    }
                  />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-3 text-sm font-semibold text-white">
                  Tiến độ
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {[
                    "Planning",
                    "Cutting",
                    "Assembly",
                    "Welding",
                    "Painting",
                    "Finished",
                  ].map((step, index) => {
                    const active =
                      selected.progress >= [0, 25, 35, 50, 75, 100][index];
                    return (
                      <div
                        key={step}
                        className={`rounded-xl border px-3 py-2 text-xs ${active ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.035] text-slate-500"}`}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 text-sm font-semibold text-white">
                Work Orders
              </div>
              <ModuleDataGrid>
                <table className="w-full text-sm">
                  <thead className={inventoryTableHead}>
                    <tr>
                      {["MO", "Title", "Status", "Qty", "Start", "Due"].map(
                        (head) => (
                          <th key={head} className="px-3 py-2 text-left">
                            {head}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrders.length ? (
                      selectedOrders.map((order) => (
                        <tr key={order.id} className={inventoryTableRow}>
                          <td className="px-3 py-2 text-cyan-300">
                            {order.orderNo}
                          </td>
                          <td className="px-3 py-2">{order.title}</td>
                          <td className="px-3 py-2">{order.status}</td>
                          <td className="px-3 py-2">
                            {formatQuantity(order.quantity, 3)}
                          </td>
                          <td className="px-3 py-2">
                            {order.plannedStartAt
                              ? new Date(
                                  order.plannedStartAt,
                                ).toLocaleDateString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-3 py-2">
                            {order.plannedEndAt
                              ? new Date(order.plannedEndAt).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-5 text-center text-slate-500"
                        >
                          Chưa có work order liên quan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ModuleDataGrid>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div
                className="mb-3 flex items-center justify-between"
                style={{ gap: "0.75rem" }}
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    Costing cấu kiện
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Chi phí thực tế tính từ production consumption và giá vốn
                    bình quân vật tư.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-1 text-xs">
                    <button
                      onClick={() => setCostingView("summary")}
                      className={`rounded-lg px-3 py-1.5 ${costingView === "summary" ? "bg-cyan-600 text-white" : "text-slate-400"}`}
                    >
                      Costing
                    </button>
                    <button
                      onClick={() => setCostingView("breakdown")}
                      className={`rounded-lg px-3 py-1.5 ${costingView === "breakdown" ? "bg-cyan-600 text-white" : "text-slate-400"}`}
                    >
                      Cost Breakdown
                    </button>
                  </div>
                  <button
                    onClick={() => void recalculateSelectedCosting()}
                    disabled={recalculateCosting.isPending}
                    className={componentsMutedButton}
                  >
                    Tính lại costing
                  </button>
                </div>
              </div>
              {costingView === "summary" && costingError ? (
                <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">
                  Chưa đủ dữ liệu costing. Cấu kiện cần có lệnh sản xuất và
                  consumption records.
                </div>
              ) : costingView === "summary" ? (
                <div
                  className="grid grid-cols-2 xl:grid-cols-4"
                  style={{ gap: "0.75rem" }}
                >
                  <CostMetric
                    title="Estimated Cost"
                    value={money(selectedCosting?.estimatedCost)}
                  />
                  <CostMetric
                    title="Actual Cost"
                    value={money(selectedCosting?.actualCost)}
                    tone="text-emerald-300"
                  />
                  <CostMetric
                    title="Variance"
                    value={money(selectedCosting?.varianceCost)}
                    tone={
                      (selectedCosting?.varianceCost ?? 0) > 0
                        ? "text-red-300"
                        : "text-cyan-300"
                    }
                  />
                  <CostMetric
                    title="Material Cost"
                    value={money(selectedCosting?.actualMaterialCost)}
                    tone="text-cyan-300"
                  />
                  <CostMetric
                    title="Labor Cost"
                    value={money(selectedCosting?.laborCost)}
                  />
                  <CostMetric
                    title="Machine Cost"
                    value={money(selectedCosting?.machineCost)}
                  />
                  <CostMetric
                    title="Overhead Cost"
                    value={money(selectedCosting?.overheadCost)}
                  />
                  <CostMetric
                    title="MO"
                    value={selectedCosting?.productionOrder?.orderNo ?? "-"}
                  />
                </div>
              ) : costingBreakdownError ? (
                <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">
                  Chưa đủ dữ liệu breakdown. Cấu kiện cần có BOM, lệnh sản xuất
                  và dữ liệu consumption.
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: "1rem" }}>
                  <div
                    className="grid grid-cols-1 md:grid-cols-3"
                    style={{ gap: "0.75rem" }}
                  >
                    <CostMetric
                      title="Estimated Material Cost"
                      value={money(
                        selectedCostingBreakdown?.summary.estimatedMaterialCost,
                      )}
                    />
                    <CostMetric
                      title="Actual Material Cost"
                      value={money(
                        selectedCostingBreakdown?.summary.actualMaterialCost,
                      )}
                      tone="text-emerald-300"
                    />
                    <CostMetric
                      title="Variance"
                      value={money(
                        selectedCostingBreakdown?.summary.varianceCost,
                      )}
                      tone={
                        (selectedCostingBreakdown?.summary.varianceCost ?? 0) >
                        0
                          ? "text-red-300"
                          : "text-cyan-300"
                      }
                    />
                  </div>
                  <CostBreakdownTable
                    title="Estimated Materials"
                    rows={(
                      selectedCostingBreakdown?.estimatedMaterials ?? []
                    ).map((row) => ({
                      id: row.materialId,
                      material: `${row.materialCode} · ${row.materialName}`,
                      qty: row.requiredQty,
                      unitCost: row.averageCost,
                      amount: row.estimatedAmount,
                    }))}
                  />
                  <CostBreakdownTable
                    title="Actual Materials"
                    rows={(selectedCostingBreakdown?.actualMaterials ?? []).map(
                      (row) => ({
                        id: row.materialId,
                        material: `${row.materialCode} · ${row.materialName}`,
                        qty: row.actualQty,
                        unitCost: row.averageCost,
                        amount: row.actualAmount,
                      }),
                    )}
                  />
                  <CostWarnings
                    warnings={selectedCostingBreakdown?.warnings ?? []}
                  />
                </div>
              )}
            </div>
          </>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  );
}

function money(value?: number | null) {
  return formatCurrencyVnd(value);
}

function ProgressMeter({
  value,
  tone = "cyan",
}: {
  value: number;
  tone?: "cyan" | "emerald" | "amber" | "red";
}) {
  const color =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "red"
          ? "bg-red-500"
          : "bg-cyan-500";
  return (
    <div className="min-w-[120px]">
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-slate-500">
        {formatQuantity(value, 0)}%
      </div>
    </div>
  );
}

function RankList({
  rows,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Dữ liệu sẽ hiển thị khi có phát sinh trong hệ thống.",
}: {
  rows: Array<{ id: string; title: string; subtitle?: string; value: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!rows.length) {
    return (
      <ModuleEmptyState
        icon={<Package size={18} />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[1fr_auto] items-center rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs"
          style={{ gap: "0.75rem" }}
        >
          <div className="min-w-0">
            <div className="truncate font-semibold text-cyan-300">
              {row.title}
            </div>
            {row.subtitle ? (
              <div className="mt-0.5 truncate text-slate-500">
                {row.subtitle}
              </div>
            ) : null}
          </div>
          <div className="font-mono tabular-nums text-slate-200">
            {row.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function CostMetric({
  title,
  value,
  tone = "text-white",
}: {
  title: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
      <div className="text-[11px] text-slate-500">{title}</div>
      <div className={`mt-1 text-base font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function CostBreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    id: string;
    material: string;
    qty: number;
    unitCost: number;
    amount: number;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/45">
      <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
        {title}
      </div>
      <table className="w-full text-xs">
        <thead className="bg-white/[0.03] text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Material</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Unit Cost</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                Không có dữ liệu vật tư.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-white/10 text-slate-200"
              >
                <td className="px-3 py-2 text-cyan-200">{row.material}</td>
                <td className="px-3 py-2 text-right">{quantity(row.qty)}</td>
                <td className="px-3 py-2 text-right">{money(row.unitCost)}</td>
                <td className="px-3 py-2 text-right font-semibold text-white">
                  {money(row.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CostWarnings({ warnings }: { warnings: ComponentCostingWarning[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
        Warnings
      </div>
      {warnings.length === 0 ? (
        <div className="text-xs text-slate-500">Không có cảnh báo costing.</div>
      ) : (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div
              key={`${warning.type}-${warning.materialId}`}
              className="rounded-lg border border-amber-800/70 bg-amber-950/25 p-2 text-xs text-amber-100"
            >
              <div className="font-semibold">{warning.type}</div>
              <div className="mt-1 text-amber-100/80">
                {warning.materialCode} · {warning.materialName}
              </div>
              <div className="mt-1 text-slate-300">{warning.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function quantity(value?: number | null) {
  return formatQuantity(value, 3);
}
