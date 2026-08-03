import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Archive, Clock, FileText, Layers, Package, PackagePlus, PencilRuler, Rocket, Sigma, Eye, Trash2 } from "lucide-react";

import { EnterpriseModulePage } from "@/shared/runtime-tabs/EnterpriseModulePage";
import {
  ModuleDataGrid,
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleLoadingState,
  ModuleTabs,
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
  const [deletingRow, setDeletingRow] = useState<ComponentRow | null>(null);
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
  const [activeDetailTab, setActiveDetailTab] = useState<
    "overview" | "bom" | "requirements" | "production" | "instances" | "history"
  >("overview");
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

  async function confirmDeleteComponent() {
    if (!deletingRow) return;

    try {
      await deleteComponent.mutateAsync(deletingRow.id);
      toast.success(`Đã xóa hồ sơ cấu kiện ${deletingRow.code}`);
      if (selected?.id === deletingRow.id) {
        setSelected(null);
        setDetailOpen(false);
      }
      setDeletingRow(null);
    } catch (error) {
      const msg = (error as any)?.response?.data?.message || (error as any)?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || `Không thể xóa cấu kiện ${deletingRow.code} do có ràng buộc dữ liệu (BOM / Lệnh Sản Xuất / Yêu cầu).`
      );
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

        {/* Phase 3: Hero Table "Danh sách cấu kiện" (Level 1 Operational Table) */}
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
            <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10 bg-[#08111f]/60">
              <table className="w-full min-w-[940px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                >
                  <tr>
                    <th className="w-[240px] px-3 py-2.5 text-left font-semibold text-slate-300">Cấu kiện (Mã & Tên)</th>
                    <th className="w-[150px] px-2.5 py-2.5 text-left font-semibold text-slate-300">Công trình</th>
                    <th className="w-[160px] px-2.5 py-2.5 text-left font-semibold text-slate-300">Loại / Quy cách</th>
                    <th className="w-[85px] px-2 py-2.5 text-right font-semibold text-slate-300">Nhu cầu</th>
                    <th className="w-[85px] px-2 py-2.5 text-right font-semibold text-slate-300">Còn lại</th>
                    <th className="w-[110px] px-2 py-2.5 text-center font-semibold text-slate-300">Rev / BOM</th>
                    <th className="w-[130px] px-2.5 py-2.5 text-center font-semibold text-slate-300">Trạng thái kỹ thuật</th>
                    <th className="w-[70px] px-2 py-2.5 text-center font-semibold text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center">
                        <ModuleLoadingState label="Đang tải dữ liệu cấu kiện..." />
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => {
                      const reqSummary =
                        row.requirements && row.requirements.length > 1
                          ? `${row.requirements[0].projectCode || row.project} (+${row.requirements.length - 1})`
                          : row.project || "Chưa gán";
                      const typeProfile = [row.type, row.profile].filter(Boolean).join(" · ") || "Chưa phân loại";

                      return (
                        <tr
                          key={row.code}
                          onClick={() => openDetail(row)}
                          className={`cursor-pointer transition hover:bg-white/[0.04] ${inventoryTableRow}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap min-w-0 overflow-hidden">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-mono font-semibold text-cyan-300 truncate">{row.code}</span>
                              <span className="text-xs font-medium text-slate-100 truncate" title={row.name}>{row.name}</span>
                            </div>
                          </td>
                          <td className="px-2.5 py-2 text-slate-300 font-medium whitespace-nowrap overflow-hidden truncate" title={row.project}>
                            {reqSummary}
                          </td>
                          <td className="px-2.5 py-2 text-slate-300 text-[11px] whitespace-nowrap overflow-hidden truncate" title={typeProfile}>
                            {typeProfile}
                          </td>
                          <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-200 whitespace-nowrap">
                            {formatQuantity(row.requiredQuantity ?? row.qty, 0)}
                          </td>
                          <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-emerald-300 whitespace-nowrap">
                            {formatQuantity(row.remainingRequirementQuantity ?? Math.max(0, (row.requiredQuantity ?? row.qty) - (row.allocatedProductionQuantity ?? 0)), 0)}
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                                R{row.revisionNo ?? "0"}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                                  row.hasBom
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                    : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                                }`}
                              >
                                {row.hasBom ? "BOM ✓" : "BOM ✗"}
                              </span>
                            </div>
                          </td>
                          <td className="px-2.5 py-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${componentStatusBadgeClass(
                                row.engineeringStatus ?? row.status,
                              )}`}
                            >
                              {componentStatusLabel(row.engineeringStatus ?? row.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openDetail(row)}
                              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-cyan-300 transition hover:bg-white/10 hover:text-white"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {!isLoading && componentTableEmptyRows.map((_, index) => (
                    <tr key={`component-list-empty-${index}`} aria-hidden="true" className="border-b border-white/[0.04]">
                      <td colSpan={8} className="h-9 px-1.5 py-0.5">
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

      {/* Phase 4: EXPANDED TABLE MODAL ("Xem tất cả" Level 2 Large Dataset Workspace) */}
      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-[96vw] max-w-[1720px] h-[88vh] flex flex-col rounded-2xl border border-white/15 bg-[#08111f] p-4 shadow-2xl space-y-3 text-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Large Dataset Workspace</div>
                <h2 className="text-base font-bold text-white">Toàn bộ hồ sơ cấu kiện (Level 2)</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-mono text-cyan-300 border border-cyan-400/20">
                  {workspace?.meta.total ?? rows.length} hồ sơ
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-[#08111f]/60 w-full">
              <table className="w-full min-w-[1400px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                >
                  <tr>
                    <th className="w-[110px] px-2.5 py-2 text-left font-semibold text-slate-300">Mã hồ sơ</th>
                    <th className="w-[260px] px-2.5 py-2 text-left font-semibold text-slate-300">Tên cấu kiện</th>
                    <th className="w-[220px] px-2.5 py-2 text-left font-semibold text-slate-300">Công trình / Yêu cầu</th>
                    <th className="w-[110px] px-2 py-2 text-left font-semibold text-slate-300">Loại</th>
                    <th className="w-[180px] px-2 py-2 text-left font-semibold text-slate-300">Profile / Quy cách</th>
                    <th className="w-[80px] px-2 py-2 text-center font-semibold text-slate-300">Revision</th>
                    <th className="w-[95px] px-2 py-2 text-center font-semibold text-slate-300">BOM State</th>
                    <th className="w-[85px] px-2 py-2 text-right font-semibold text-slate-300">SL yêu cầu</th>
                    <th className="w-[85px] px-2 py-2 text-right font-semibold text-slate-300">Đã phân bổ</th>
                    <th className="w-[85px] px-2 py-2 text-right font-semibold text-slate-300">Còn lại</th>
                    <th className="w-[140px] px-2.5 py-2 text-center font-semibold text-slate-300">Trạng thái kỹ thuật</th>
                    <th className="w-[80px] px-2 py-2 text-center font-semibold text-slate-300">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelected(row);
                        setDetailOpen(true);
                      }}
                      className={`${inventoryTableRow} cursor-pointer transition hover:bg-white/[0.04]`}
                    >
                      <td className="px-2.5 py-2 text-cyan-300 font-mono font-semibold whitespace-nowrap truncate">{row.code}</td>
                      <td className="px-2.5 py-2 text-slate-100 font-medium whitespace-nowrap truncate" title={row.name}>{row.name}</td>
                      <td className="px-2.5 py-2 text-slate-300 whitespace-nowrap truncate" title={row.project}>
                        {row.requirementCount && row.requirementCount > 1 ? `${row.requirementCount} yêu cầu` : row.project || "Chưa gán"}
                      </td>
                      <td className="px-2 py-2 text-slate-300 whitespace-nowrap truncate">{row.type || "Dầm"}</td>
                      <td className="px-2 py-2 text-slate-300 font-mono text-[11px] whitespace-nowrap truncate" title={row.profile}>{row.profile || "N/A"}</td>
                      <td className="px-2 py-2 text-center text-slate-300 font-mono whitespace-nowrap">{row.revisionNo ?? "-"}</td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${row.hasBom ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>
                          {row.bomState ?? (row.hasBom ? "Có BOM" : "Chờ BOM")}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-200 whitespace-nowrap">{formatQuantity(row.requiredQuantity ?? row.qty, 0)}</td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-slate-400 whitespace-nowrap">{formatQuantity(row.allocatedProductionQuantity ?? 0, 0)}</td>
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-emerald-300 whitespace-nowrap">
                        {formatQuantity(row.remainingRequirementQuantity ?? Math.max(0, (row.requiredQuantity ?? row.qty) - (row.allocatedProductionQuantity ?? 0)), 0)}
                      </td>
                      <td className="px-2.5 py-2 text-center whitespace-nowrap">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${componentStatusBadgeClass(row.engineeringStatus ?? row.status)}`}>
                          {componentStatusLabel(row.engineeringStatus ?? row.status)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(row);
                              setDetailOpen(true);
                            }}
                            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-cyan-300 transition hover:bg-white/10 hover:text-white"
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRow(row)}
                            title="Xóa hồ sơ cấu kiện"
                            className="rounded border border-red-500/20 bg-red-500/10 p-1 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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

      <ModuleDetailDrawer
        open={detailOpen && Boolean(selected)}
        placement="right"
        title={selected ? `${selected.code} · ${selected.name}` : ""}
        subtitle={
          selected
            ? `CẤU KIỆN · ${selected.type || "Dầm"} · ${selected.profile || "Quy cách N/A"} · Rev ${selected.revisionNo ?? "0"} · ${componentStatusLabel(selected.engineeringStatus ?? selected.status)}`
            : undefined
        }
        onClose={() => setDetailOpen(false)}
        widthClass="w-screen md:w-[64vw] md:max-w-[1280px] md:min-w-[820px]"
        actions={
          selected ? (
            <>
              <button
                type="button"
                onClick={() => openBomFor(selected)}
                className={componentsMutedButton}
              >
                BOM
              </button>
              <button
                type="button"
                onClick={() => openProductionFor(selected)}
                className="rounded-lg border border-emerald-400/30 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                Tạo Lệnh SX
              </button>
              <button
                type="button"
                onClick={() => setDeletingRow(selected)}
                title="Xóa hồ sơ cấu kiện"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 flex items-center gap-1"
              >
                <Trash2 size={14} />
                Xóa
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4 text-xs">
            {/* Operational KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Nhu cầu</div>
                <div className="mt-1 font-mono text-base font-bold text-white">{formatQuantity(selected.requiredQuantity ?? selected.qty, 0)}</div>
                <div className="text-[10px] text-slate-500 truncate" title={selected.project}>{selected.project || "Chưa gán"}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Đã phân bổ PO</div>
                <div className="mt-1 font-mono text-base font-bold text-slate-300">{formatQuantity(selected.allocatedProductionQuantity ?? 0, 0)}</div>
                <div className="text-[10px] text-slate-500">{selectedOrders.length} Lệnh PO</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Còn lại</div>
                <div className="mt-1 font-mono text-base font-bold text-emerald-300">{formatQuantity(selected.remainingRequirementQuantity ?? Math.max(0, (selected.requiredQuantity ?? selected.qty) - (selected.allocatedProductionQuantity ?? 0)), 0)}</div>
                <div className="text-[10px] text-slate-500">Yêu cầu chưa SX</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Production Orders</div>
                <div className="mt-1 font-mono text-base font-bold text-cyan-300">{selectedOrders.length}</div>
                <div className="text-[10px] text-slate-500">{selectedBoms.length} BOMs</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Instances</div>
                <div className="mt-1 font-mono text-base font-bold text-slate-200">0</div>
                <div className="text-[10px] text-slate-500">Physical units</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Thành phẩm</div>
                <div className="mt-1 font-mono text-base font-bold text-cyan-300">0</div>
                <div className="text-[10px] text-slate-500">Nghiệm thu QC</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <ModuleTabs
              tabs={[
                { key: "overview", label: "Tổng quan" },
                { key: "bom", label: "BOM" },
                { key: "requirements", label: "Nhu cầu" },
                { key: "production", label: "Sản xuất" },
                { key: "instances", label: "Instances" },
                { key: "history", label: "Lịch sử" },
              ]}
              active={activeDetailTab}
              onChange={(key) => setActiveDetailTab(key)}
            />

            {/* TAB BODY CONTROLS */}
            {activeDetailTab === "overview" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LEFT - Engineering Definition */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Hồ sơ kỹ thuật</span>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${componentStatusBadgeClass(selected.engineeringStatus ?? selected.status)}`}>
                        {componentStatusLabel(selected.engineeringStatus ?? selected.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <CostMetric title="Mã hồ sơ" value={selected.code} />
                      <CostMetric title="Tên cấu kiện" value={selected.name} />
                      <CostMetric title="Loại cấu kiện" value={selected.type || "Dầm"} />
                      <CostMetric title="Profile / Quy cách" value={selected.profile || "N/A"} />
                      <CostMetric title="Phiên bản (Revision)" value={`Rev ${selected.revisionNo ?? "0"}`} />
                      <CostMetric title="Trạng thái BOM" value={selected.bomState ?? (selected.hasBom ? "Có BOM" : "Chờ BOM")} />
                    </div>
                  </div>

                  {/* RIGHT - Demand & Production Summary */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Nhu cầu & Sản xuất</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={selected.project}>{selected.project || "Chưa gán công trình"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <CostMetric title="Tổng nhu cầu" value={`${formatQuantity(selected.requiredQuantity ?? selected.qty, 0)} cấu kiện`} />
                      <CostMetric title="Đã phân bổ PO" value={`${formatQuantity(selected.allocatedProductionQuantity ?? 0, 0)} cấu kiện`} tone="text-slate-300" />
                      <CostMetric title="Nhu cầu còn lại" value={`${formatQuantity(selected.remainingRequirementQuantity ?? Math.max(0, (selected.requiredQuantity ?? selected.qty) - (selected.allocatedProductionQuantity ?? 0)), 0)} cấu kiện`} tone="text-emerald-300" />
                      <CostMetric title="Lệnh SX liên kết" value={`${selectedOrders.length} Lệnh PO`} />
                      <CostMetric title="Component Instances" value="0 Units" />
                      <CostMetric title="Thành phẩm (FG)" value="0 nghiệm thu" tone="text-cyan-300" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Nhu cầu theo công trình (Project Requirements)</span>
                    <button type="button" onClick={() => setActiveDetailTab("requirements")} className="text-xs font-medium text-cyan-300 hover:underline">
                      Xem tất cả ({selected.requirements?.length ?? 0})
                    </button>
                  </div>
                  <RequirementTable rows={selected.requirements ?? []} />
                </div>
              </div>
            ) : activeDetailTab === "bom" ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div>
                    <div className="text-xs font-bold text-white">Production BOM & Engineering Routing</div>
                    <div className="text-[11px] text-slate-400">Định mức vật tư và quy trình công nghệ đi theo hồ sơ kỹ thuật cấu kiện</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openBomFor(selected)}
                    className="rounded-lg border border-cyan-400/30 bg-cyan-600/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-600/30 transition"
                  >
                    Mở BOM Editor
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/45">
                  <table className="w-full text-xs table-fixed border-collapse">
                    <thead className={inventoryTableHead}>
                      <tr>
                        <th className="w-[140px] px-3 py-2 text-left font-semibold text-slate-300">Mã BOM</th>
                        <th className="w-[90px] px-3 py-2 text-center font-semibold text-slate-300">Phiên bản</th>
                        <th className="w-[90px] px-3 py-2 text-right font-semibold text-slate-300">Số vật tư</th>
                        <th className="w-[90px] px-3 py-2 text-right font-semibold text-slate-300">Routing</th>
                        <th className="w-[110px] px-3 py-2 text-right font-semibold text-slate-300">KL ước tính</th>
                        <th className="w-[110px] px-3 py-2 text-center font-semibold text-slate-300">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedBoms.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                            Chưa có Production BOM. Vui lòng bấm "Mở BOM Editor" để tạo BOM mới.
                          </td>
                        </tr>
                      ) : (
                        selectedBoms.map((bom) => (
                          <tr key={bom.id} className={inventoryTableRow}>
                            <td className="px-3 py-2 font-mono font-semibold text-cyan-300 truncate" title={bom.bomNo}>{bom.bomNo}</td>
                            <td className="px-3 py-2 text-center font-mono text-slate-300">{bom.version}</td>
                            <td className="px-3 py-2 text-right font-mono text-white">{bom.items.length} chi tiết</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-300">{bom.routingSteps.length} bước</td>
                            <td className="px-3 py-2 text-right font-mono text-emerald-300">{formatQuantity(bom.estimatedWeight, 0)} kg</td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                                {bom.status || "Hoạt động"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeDetailTab === "requirements" ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div>
                    <div className="text-xs font-bold text-white">Nhu cầu cấu kiện theo công trình (Project Requirements)</div>
                    <div className="text-[11px] text-slate-400">Danh sách các công trình đăng ký nhu cầu cho hồ sơ cấu kiện này</div>
                  </div>
                </div>
                <RequirementTable rows={selected.requirements ?? []} />
              </div>
            ) : activeDetailTab === "production" ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div>
                    <div className="text-xs font-bold text-white">Danh sách Lệnh Sản xuất (Production Orders)</div>
                    <div className="text-[11px] text-slate-400">Các lệnh sản xuất đã phát hành cho cấu kiện này</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openProductionFor(selected)}
                    className="rounded-lg border border-emerald-400/30 bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition"
                  >
                    Tạo Lệnh Sản xuất
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/45">
                  <table className="w-full text-xs table-fixed border-collapse">
                    <thead className={inventoryTableHead}>
                      <tr>
                        <th className="w-[140px] px-3 py-2 text-left font-semibold text-slate-300">Mã Lệnh SX</th>
                        <th className="w-[200px] px-3 py-2 text-left font-semibold text-slate-300">Tiêu đề Lệnh</th>
                        <th className="w-[90px] px-3 py-2 text-right font-semibold text-slate-300">Số lượng</th>
                        <th className="w-[110px] px-3 py-2 text-right font-semibold text-slate-300">Bắt đầu / Kết thúc</th>
                        <th className="w-[120px] px-3 py-2 text-center font-semibold text-slate-300">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                            Chưa có Lệnh sản xuất nào được phát hành. Bấm "Tạo Lệnh Sản xuất" để phân bổ.
                          </td>
                        </tr>
                      ) : (
                        selectedOrders.map((po) => (
                          <tr key={po.id} className={inventoryTableRow}>
                            <td className="px-3 py-2 font-mono font-semibold text-cyan-300 truncate" title={po.orderNo}>{po.orderNo}</td>
                            <td className="px-3 py-2 text-slate-200 truncate" title={po.title}>{po.title || "Lệnh sản xuất cấu kiện"}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-white">{formatQuantity(po.quantity, 0)}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-300">
                              {po.plannedStartAt ? new Date(po.plannedStartAt).toLocaleDateString("vi-VN") : "-"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                                {po.status || "ĐANG SẢN XUẤT"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeDetailTab === "instances" ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div>
                    <div className="text-xs font-bold text-white">Danh sách Physical Component Instances</div>
                    <div className="text-[11px] text-slate-400">Cấu kiện vật lý đã được chế tạo từ Lệnh sản xuất</div>
                  </div>
                </div>

                <ModuleEmptyState
                  icon={<Package size={20} />}
                  title="Chưa có Component Instances vật lý"
                  description="Chưa có dữ liệu physical instance được ghi nhận cho hồ sơ kỹ thuật này."
                />
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <ModuleEmptyState
                  icon={<Clock size={20} />}
                  title="Chưa có nguồn lịch sử cấu kiện đầy đủ"
                  description="Tính năng ghi nhận nhật ký thao tác chi tiết cho từng cấu kiện đang được đồng bộ."
                />
              </div>
            )}
          </div>
        ) : null}
      </ModuleDetailDrawer>

      {deletingRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xóa hồ sơ cấu kiện?</h3>
                <p className="text-[11px] text-slate-400">Thao tác này sẽ xóa hồ sơ kỹ thuật khỏi hệ thống</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Mã cấu kiện:</span>
                <span className="font-mono font-bold text-cyan-300">{deletingRow.code}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Tên cấu kiện:</span>
                <span className="font-medium text-slate-100 truncate max-w-[220px]" title={deletingRow.name}>{deletingRow.name}</span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">
              Bạn có chắc chắn muốn xóa cấu kiện này? Nếu cấu kiện đã tạo BOM, phát hành Lệnh Sản xuất hoặc có ràng buộc dữ liệu, hệ thống sẽ tự động từ chối để bảo vệ dữ liệu.
            </p>

            <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteComponent.isPending}
                onClick={() => void confirmDeleteComponent()}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-500 transition disabled:opacity-50"
              >
                {deleteComponent.isPending ? "Đang xóa..." : "Xóa hồ sơ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
      <table className="w-full text-xs table-fixed border-collapse">
        <thead className={inventoryTableHead}>
          <tr>
            <th className="px-2.5 py-1.5 text-left font-semibold text-slate-300">Công trình</th>
            <th className="w-[50px] px-2 py-1.5 text-right font-mono font-semibold text-slate-300">YC</th>
            <th className="w-[50px] px-2 py-1.5 text-right font-mono font-semibold text-slate-300">PO</th>
            <th className="w-[50px] px-2 py-1.5 text-right font-mono font-semibold text-slate-300">Còn</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => {
            const remaining = Math.max(
              0,
              row.requiredQuantity - row.allocatedProductionQuantity,
            );
            return (
              <tr key={row.id} className={inventoryTableRow}>
                <td className="px-2.5 py-1.5 text-slate-200 truncate" title={`${row.projectCode} · ${row.projectName}`}>
                  {row.projectCode ? `${row.projectCode} · ` : ""}{row.projectName}
                </td>
                <td className="px-2 py-1.5 text-right font-mono font-medium text-white">
                  {formatQuantity(row.requiredQuantity, 0)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono font-medium text-slate-300">
                  {formatQuantity(row.allocatedProductionQuantity, 0)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono font-medium text-emerald-300">
                  {formatQuantity(remaining, 0)}
                </td>
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
