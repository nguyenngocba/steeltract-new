import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { Archive, FileText, Layers, Package, PackagePlus, PencilRuler, Rocket, Sigma, Eye } from "lucide-react";

import { EnterpriseModulePage } from "@/shared/runtime-tabs/EnterpriseModulePage";
import {
  ModuleDataGrid,
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../../../shared/ui/modules";
import {
  CockpitKpiCard,
  EnterpriseKpiCard,
} from "../../../../shared/ui/cockpit";
import { useProjects } from "../../../inventory/hooks/useProjects";
import {
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
import { EnterpriseModalForm } from "@/shared/forms";
import {
  ComponentDefinitionRequirementForm,
  type ComponentDefinitionFormState,
} from "../../components/ComponentDefinitionRequirementForm";
import {
  ComponentsDonut,
  ComponentsMiniBars,
  ComponentsSelect,
  componentsMutedButton,
  componentsPrimaryButton,
} from "./ComponentsCockpitShared";

type ComponentRow = ComponentWorkspaceRow;

const inventoryFilterControl =
  "h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65";

type ComponentsListRouteState = {
  componentId?: string;
} | null;

function componentStatusBadgeClass(status: string) {
  const normalized = String(status ?? "").toUpperCase();
  if (["ĐÃ PHÁT HÀNH SẢN XUẤT", "ACTIVE"].includes(normalized)) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }
  if (["SẴN SÀNG PHÁT HÀNH", "VALIDATED"].includes(normalized)) {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
  }
  if (["NHÁP", "DRAFT", "ĐANG HOÀN THIỆN KỸ THUẬT"].includes(normalized)) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  }
  if (["NGỪNG SỬ DỤNG", "DEPRECATED", "ĐÃ LƯU TRỮ", "ARCHIVED"].includes(normalized)) {
    return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
  return "border-slate-400/20 bg-slate-400/10 text-slate-300";
}

function componentStatusLabel(status: string) {
  return status || "Legacy - chưa chuẩn hóa";
}

function InventoryMetricCard({
  title,
  value,
  note,
  tone,
  delta,
  chartHeightClass = "h-[42px]",
  children,
}: {
  title: string;
  value: string;
  note?: string;
  tone?: string;
  delta?: string;
  chartHeightClass?: string;
  children?: React.ReactNode;
}) {
  const toneColorClass =
    tone === "cyan"
      ? "text-cyan-300"
      : tone === "amber"
      ? "text-amber-300"
      : tone === "emerald"
      ? "text-emerald-300"
      : tone === "red"
      ? "text-red-300"
      : "text-blue-300";

  const deltaColorClass =
    delta && delta.startsWith("+")
      ? "text-emerald-400"
      : delta && delta.startsWith("-")
      ? "text-red-400"
      : "text-slate-400";

  return (
    <InventoryChartCard title={title} note={note}>
      <div className="flex items-baseline justify-between gap-1 mb-1">
        <div className={`text-xl font-bold font-mono tracking-tight ${toneColorClass}`}>
          {value}
        </div>
        {delta !== undefined ? <div className={`text-[10px] ${deltaColorClass}`}>{delta}</div> : null}
      </div>
      <div className={chartHeightClass}>{children}</div>
    </InventoryChartCard>
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
  const [query, setQuery] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [expandedModalOpen, setExpandedModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 14;

  function applySearch() {
    setQuery(searchDraft);
    setPage(1);
  }

  function resetFilters() {
    setSearchDraft("");
    setQuery("");
    setProject("");
    setStatus("");
    setType("");
    setPage(1);
  }

  const { data: workspace, isLoading } = useComponentsWorkspace({
    page,
    limit: PAGE_SIZE,
    search: query || undefined,
    project: project || undefined,
    status: status || undefined,
    type: type || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [project, status, type, query]);

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

  const [createForm, setCreateForm] = useState<ComponentDefinitionFormState>({
    name: "",
    type: "",
    profile: "",
    projectId: "",
    qty: "1",
    requiredBy: "",
    note: "",
  });
  function closeCreateModal() {
    setCreateOpen(false);
    setCreateForm({
      name: "",
      type: "",
      profile: "",
      projectId: "",
      qty: "1",
      requiredBy: "",
      note: "",
    });
  }

  function closeProductionModal() {
    setProductionOpen(false);
    setProductionComponentId("");
  }

  const rows = workspace?.data ?? [];
  const paginatedRows = rows;
  const componentTypeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.type).filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [rows],
  );
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
    const requiredQuantity = Number(createForm.qty || 0);
    if (!createForm.name.trim()) {
      toast.error("Nhập tên cấu kiện");
      return;
    }
    if (!createForm.projectId) {
      toast.error("Chọn công trình / dự án");
      return;
    }
    if (!createForm.type.trim()) {
      toast.error("Chọn loại cấu kiện");
      return;
    }
    if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
      toast.error("Số lượng yêu cầu phải lớn hơn 0");
      return;
    }

    try {
      const result = await createComponent.mutateAsync({
        name: createForm.name.trim(),
        componentType: createForm.type.trim(),
        profile: createForm.profile.trim() || undefined,
        projectId: createForm.projectId,
        requiredQuantity,
        requiredBy: createForm.requiredBy
          ? new Date(createForm.requiredBy).toISOString()
          : undefined,
        note: createForm.note.trim() || undefined,
      });
      toast.success(
        `Đã tạo hồ sơ ${result.component.code} · Draft · yêu cầu ${requiredQuantity} cấu kiện`,
      );
    } catch {
      toast.error("Không thể tạo hồ sơ cấu kiện");
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
      title: "Tổng hồ sơ",
      value: formatQuantity(cockpitKpis.total, 0),
      note: "Component definitions",
      tone: "text-cyan-300",
    },
    {
      title: "Hồ sơ nháp",
      value: formatQuantity(cockpitKpis.draft ?? cockpitKpis.running, 0),
      note: "Engineering Draft",
      tone: "text-blue-300",
    },
    {
      title: "Đã phát hành",
      value: formatQuantity(cockpitKpis.released ?? cockpitKpis.completed, 0),
      note: "Released for Production",
      tone: "text-emerald-300",
    },
    {
      title: "Tổng nhu cầu",
      value: formatQuantity(cockpitKpis.totalDemand ?? 0, 0),
      note: "Project requirements",
      tone: "text-amber-300",
    },
    {
      title: "Chưa có BOM",
      value: formatQuantity(cockpitKpis.missingBom ?? 0, 0),
      note: "Cần hoàn thiện kỹ thuật",
      tone: "text-red-300",
    },
  ];

  return (
    <EnterpriseModulePage>
      <div className="space-y-1 -mt-2">
        {/* Phase 1: KPI Cards matching EnterpriseKpiCard */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
          <EnterpriseKpiCard
            title="Tổng hồ sơ cấu kiện"
            value={formatQuantity(cockpitKpis.total, 0)}
            tone="blue"
            icon={<Layers size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Hồ sơ nháp"
            value={formatQuantity(cockpitKpis.draft ?? cockpitKpis.running, 0)}
            tone="purple"
            icon={<PencilRuler size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đã phát hành sản xuất"
            value={formatQuantity(cockpitKpis.released ?? cockpitKpis.completed, 0)}
            tone="emerald"
            icon={<Rocket size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Tổng nhu cầu cấu kiện"
            value={formatQuantity(cockpitKpis.totalDemand ?? 0, 0)}
            tone="amber"
            icon={<Sigma size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Chưa có BOM"
            value={formatQuantity(cockpitKpis.missingBom ?? 0, 0)}
            tone="red"
            icon={<FileText size={15} />}
            isLoading={isLoading}
          />
        </div>

        {/* Phase 2: Search & Filter Toolbar Immediately Below KPI Strip (Golden Reference Match) */}
        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <ComponentsSelect value={project} onChange={(v) => { setProject(v); setPage(1); }} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]">
              <option value="">Tất cả dự án</option>
              {projects.map((item) => (
                <option key={item.id} value={item.code ?? item.name}>{item.code ?? item.name}</option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]">
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="ACTIVE">Đã phát hành sản xuất</option>
              <option value="DEPRECATED">Ngừng sử dụng</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </ComponentsSelect>
            <ComponentsSelect value={type} onChange={(v) => { setType(v); setPage(1); }} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]">
              <option value="">Tất cả loại</option>
              {componentTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </ComponentsSelect>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Tìm theo mã, tên, profile, dự án..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <button
              type="button"
              onClick={applySearch}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        {/* Phase 3: Hero Table "Danh sách cấu kiện" */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1 items-start">
          <InventoryPanel className="xl:col-span-9">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Hồ sơ cấu kiện</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                  {workspace?.meta.total ?? rows.length} hồ sơ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(true)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
              >
                Xem tất cả
              </button>
            </div>
            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
              <table className="w-full min-w-[1050px] text-sm table-fixed">
                <colgroup>
                  <col className="w-[120px]" />
                  <col className="w-[170px]" />
                  <col className="w-[170px]" />
                  <col className="w-[115px]" />
                  <col className="w-[130px]" />
                  <col className="w-[110px]" />
                  <col className="w-[100px]" />
                  <col className="w-[120px]" />
                  <col className="w-[160px]" />
                  <col className="w-[100px]" />
                  <col className="w-[70px]" />
                </colgroup>
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10`}
                  style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                >
                  <tr>
                    {[
                      "Mã hồ sơ",
                      "Tên cấu kiện",
                      "Công trình / Yêu cầu",
                      "Loại",
                      "Profile",
                      "Revision",
                      "BOM",
                      "SL yêu cầu",
                      "Trạng thái kỹ thuật",
                      "Cập nhật",
                      "Thao tác",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className="px-1.5 py-1 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-300"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-6">
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
                          className="truncate px-1.5 py-0.5 font-mono text-cyan-300"
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
                          title={row.requirements?.map((item) => `${item.projectCode} · ${item.requirementNo}`).join(", ") || row.project}
                        >
                          {row.requirementCount && row.requirementCount > 1
                            ? `${row.requirementCount} yêu cầu`
                            : row.project}
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-slate-300"
                          title={row.type}
                        >
                          {row.type}
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 text-slate-300"
                          title={row.profile}
                        >
                          {row.profile}
                        </td>
                        <td className="truncate px-1.5 py-0.5 text-slate-300">
                          {row.revisionNo ?? "-"}
                        </td>
                        <td className="px-1.5 py-0.5">
                          <span
                            className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${
                              row.hasBom
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                            }`}
                          >
                            {row.bomState ?? (row.hasBom ? "Có BOM" : "Chờ BOM")}
                          </span>
                        </td>
                        <td
                          className="truncate px-1.5 py-0.5 font-mono tabular-nums text-cyan-300"
                          title={`${formatQuantity(row.requiredQuantity ?? row.qty, 0)} cấu kiện yêu cầu`}
                        >
                          {formatQuantity(row.requiredQuantity ?? row.qty, 0)}
                        </td>
                        <td className="px-1.5 py-0.5">
                          <span
                            className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${componentStatusBadgeClass(row.engineeringStatus ?? row.status)}`}
                          >
                            {componentStatusLabel(row.engineeringStatus ?? row.status)}
                          </span>
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
                      <td colSpan={11} className="h-9 px-1.5 py-0.5">
                        <div className="h-px w-full bg-white/[0.035]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Phase 4: EXPANDED TABLE MODAL ("Xem tất cả" interaction matching Inventory Golden Reference) */}
      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ hồ sơ cấu kiện</h2>
                <p className="text-xs text-slate-400">Tổng cộng {workspace?.meta.total ?? rows.length} hồ sơ kỹ thuật trong hệ thống</p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Đóng
              </button>
            </div>

            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1200px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                >
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold w-[130px]">Mã hồ sơ</th>
                    <th className="px-3 py-2 text-left font-semibold w-[180px]">Tên cấu kiện</th>
                    <th className="px-3 py-2 text-left font-semibold w-[160px]">Công trình / Yêu cầu</th>
                    <th className="px-3 py-2 text-left font-semibold w-[140px]">Profile/Kích thước</th>
                    <th className="px-3 py-2 text-left font-semibold w-[120px]">Loại</th>
                    <th className="px-3 py-2 text-left font-semibold w-[100px]">Revision</th>
                    <th className="px-3 py-2 text-left font-semibold w-[100px]">BOM</th>
                    <th className="px-3 py-2 text-left font-semibold w-[120px]">SL yêu cầu</th>
                    <th className="px-3 py-2 text-center font-semibold w-[150px]">Trạng thái kỹ thuật</th>
                    <th className="px-3 py-2 text-center font-semibold w-[100px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelected(row);
                        setDetailOpen(true);
                      }}
                      className={`${inventoryTableRow} cursor-pointer`}
                    >
                      <td className="truncate px-3 py-2 text-cyan-300 font-mono font-medium">{row.code}</td>
                      <td className="truncate px-3 py-2 text-white font-medium">{row.name}</td>
                      <td className="truncate px-3 py-2 text-slate-300">
                        {row.requirementCount && row.requirementCount > 1 ? `${row.requirementCount} yêu cầu` : row.project || "Chưa gán"}
                      </td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.profile || "N/A"}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.type || "Dầm"}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.revisionNo ?? "-"}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.bomState ?? (row.hasBom ? "Có BOM" : "Chờ BOM")}</td>
                      <td className="truncate px-3 py-2 font-mono text-cyan-300">{formatQuantity(row.requiredQuantity ?? row.qty, 0)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${componentStatusBadgeClass(row.engineeringStatus ?? row.status)}`}>
                          {componentStatusLabel(row.engineeringStatus ?? row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(row);
                            setDetailOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"
                        >
                          <Eye size={12} />
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InventoryPagination
              page={page}
              pageCount={Math.max(1, Math.ceil((workspace?.meta.total ?? 0) / PAGE_SIZE))}
              total={workspace?.meta.total ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              containerClassName="border-t-0"
            />
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <EnterpriseModalForm
          open
          title="Tạo hồ sơ cấu kiện"
          description="Tạo Component Definition ở trạng thái Draft và nhu cầu cấu kiện cho công trình."
          onClose={closeCreateModal}
          onSubmit={(event) => { event.preventDefault(); void submitCreate(); }}
          submitLabel="Tạo hồ sơ"
          pendingLabel="Đang tạo hồ sơ..."
          pending={createComponent.isPending}
          maxWidthClass="max-w-5xl"
        >
          <ComponentDefinitionRequirementForm
            form={createForm}
            projects={projects as Array<{ id: string; code?: string; name: string }>}
            components={rows}
            onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
          />
        </EnterpriseModalForm>
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
                BOM
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
                  {selected.engineeringStatus ?? selected.status}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Số lượng yêu cầu</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {formatQuantity(selected.requiredQuantity ?? selected.qty, 0)} kiện
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-400">Nhu cầu còn lại</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {formatQuantity(selected.remainingRequirementQuantity ?? 0, 0)} kiện
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 text-sm font-semibold text-white">
                Thông tin hồ sơ
              </div>
              <div
                className="grid grid-cols-2 xl:grid-cols-6"
                style={{ gap: "0.75rem" }}
              >
                <CostMetric title="Code" value={selected.code} />
                <CostMetric title="Name" value={selected.name} />
                <CostMetric title="Type" value={selected.type} />
                <CostMetric title="Project" value={selected.project} />
                <CostMetric title="Revision" value={selected.revisionNo ?? "-"} />
                <CostMetric title="BOM" value={selected.bomState ?? (selected.hasBom ? "Có BOM" : "Chưa có BOM")} />
                <CostMetric
                  title="Nhu cầu"
                  value={`${formatQuantity(selected.requiredQuantity ?? selected.qty, 0)} kiện`}
                />
                <CostMetric title="Lifecycle" value={selected.lifecycleState ?? "LEGACY"} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 text-sm font-semibold text-white">
                Công trình / nhu cầu
              </div>
              <RequirementTable rows={selected.requirements ?? []} />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div
                className="mb-3 flex items-center justify-between"
                style={{ gap: "0.75rem" }}
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    BOM / Revision liên kết
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Canonical Engineering BOM đi theo Component Revision. Màn hình Production BOM hiện hữu được giữ như compatibility và cần tách tiếp ở P1.
                  </div>
                </div>
                <button
                  onClick={() => openBomFor(selected)}
                  className={componentsMutedButton}
                >
                  BOM hiện có
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

function RequirementTable({
  rows,
}: {
  rows: NonNullable<ComponentWorkspaceRow["requirements"]>;
}) {
  if (!rows.length) {
    return (
      <ModuleEmptyState
        icon={<Package size={18} />}
        title="Chưa có yêu cầu cấu kiện"
        description="Hồ sơ này chưa có ProjectComponentRequirement được liên kết."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-xs">
        <thead className={inventoryTableHead}>
          <tr>
            <th className="px-3 py-2 text-left">Yêu cầu</th>
            <th className="px-3 py-2 text-left">Công trình</th>
            <th className="px-3 py-2 text-right">SL yêu cầu</th>
            <th className="px-3 py-2 text-right">Đã phân bổ PO</th>
            <th className="px-3 py-2 text-right">Còn lại</th>
            <th className="px-3 py-2 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const remaining = Math.max(
              0,
              row.requiredQuantity - row.allocatedProductionQuantity,
            );
            return (
              <tr key={row.id} className={inventoryTableRow}>
                <td className="px-3 py-2 font-mono text-cyan-300">
                  {row.requirementNo}
                </td>
                <td className="px-3 py-2 text-slate-200">
                  {row.projectCode} · {row.projectName}
                </td>
                <td className="px-3 py-2 text-right font-mono text-white">
                  {formatQuantity(row.requiredQuantity, 0)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-emerald-300">
                  {formatQuantity(row.allocatedProductionQuantity, 0)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-amber-300">
                  {formatQuantity(remaining, 0)}
                </td>
                <td className="px-3 py-2 text-slate-300">{row.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
