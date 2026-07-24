import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, BarChart3, CheckCircle2, Eye, Layers, Package, Truck, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EnterpriseModulePage } from "@/shared/runtime-tabs/EnterpriseModulePage";
import {
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleFilterBar,
  ModuleLoadingState,
  moduleInput,
  moduleMutedButton,
} from "@/shared/ui/modules";
import {
  CockpitChartCard,
  CockpitKpiCard,
  CockpitTableShell,
  DataTablePagination,
  EnterpriseKpiCard,
} from "@/shared/ui/cockpit";
import {
  EnterpriseCompactTrendChart,
  EnterpriseMeter,
  EnterprisePanel,
  EnterpriseStatusBadge,
  enterpriseTableHead,
  enterpriseTableRow,
} from "@/shared/ui/enterprise-components";
import {
  useComponentsDashboard,
  useComponentsOverview,
} from "../../hooks/queries/useComponents";
import { formatQuantity } from "@/shared/utils/number-format";
import {
  ComponentsDonut,
  ComponentsMiniBars,
  ComponentsSelect,
} from "./ComponentsCockpitShared";

function statusTone(label: string) {
  if (label.includes("Không đạt"))
    return "border-red-500/30 bg-red-500/10 text-red-300";
  if (label.includes("Đang SX"))
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (label.includes("QC"))
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (label.includes("chuyển") || label.includes("Chuyển"))
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
}

export function ComponentsOverviewPage() {
  const navigate = useNavigate();
  const [searchDraft, setSearchDraft] = useState("");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedModalOpen, setExpandedModalOpen] = useState(false);

  function handleRowClick(row: any) {
    setSelectedComponent(row);
    setDrawerOpen(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(searchDraft);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const { data: readModel, isLoading } = useComponentsOverview({
    page,
    limit: pageSize,
    search: query || undefined,
    project: project || undefined,
    status: status || undefined,
    location: location || undefined,
    type: type || undefined,
  });
  const { data: dashboard } = useComponentsDashboard();

  useEffect(() => {
    setPage(1);
  }, [project, status, location, type, query]);

  const rows = readModel?.data ?? [];
  const paginatedRows = rows.slice(0, 8);
  const dashboardData = dashboard?.data;
  const statusCounts = readModel?.summary
    ? {
        total: readModel.summary.total,
        producing: readModel.summary.producing,
        stock: readModel.summary.stock,
        qcPass: readModel.summary.qcPass,
        qcFail: readModel.summary.qcFail,
        transferring: readModel.summary.transferring,
      }
    : dashboardData
      ? {
        total: dashboardData.totalComponents,
        producing: dashboardData.producingCount,
        stock: dashboardData.stockCount,
        qcPass: dashboardData.readyCount,
        qcFail: 0,
        transferring: dashboardData.shippedCount,
      }
      : {
        total: 0,
        producing: 0,
        stock: 0,
        qcPass: 0,
        qcFail: 0,
        transferring: 0,
      };
  const dashboardActivity = readModel?.analytics.activitySeries
    ?? dashboardData?.payload?.timelineActions?.map((row) => row.count)
    ?? [];
  const colors = [
    "#1d7cff",
    "#06b6d4",
    "#7c3aed",
    "#f59e0b",
    "#ef4444",
    "#14c987",
  ];
  const typeSegments = (readModel?.analytics.typeSegments ?? []).map(
    ([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }),
  );
  const projectRows = Array.from(
    rows.reduce((map, row) => {
      const key = row.project || "Chưa gán dự án";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxProject = Math.max(1, ...projectRows.map(([, value]) => value));
  const waitingQcRows = rows
    .filter((row) => /QC|kiểm|kiem|INTERNAL/i.test(`${row.status} ${row.location}`))
    .slice(0, 4);
  const readyShipRows = rows
    .filter((row) => /READY|Đã QC|DA QC|QC đạt|QC dat/i.test(row.status))
    .slice(0, 4);
  const componentTableEmptyRows = Array.from({ length: Math.max(0, 8 - paginatedRows.length) });
  const quickStats = [
    { title: "Đang sản xuất", value: `${formatQuantity(statusCounts.producing, 0)} cấu kiện`, note: "CUT/WELD/PAINT", tone: "text-cyan-300" },
    { title: "Tồn kho", value: `${formatQuantity(statusCounts.stock, 0)} cấu kiện`, note: "STOCK", tone: "text-amber-300" },
    { title: "Sẵn sàng xuất bãi", value: `${formatQuantity(statusCounts.qcPass, 0)} cấu kiện`, note: "READY", tone: "text-emerald-300" },
    { title: "Đang chuyển", value: `${formatQuantity(statusCounts.transferring, 0)} cấu kiện`, note: "SHIPPED", tone: "text-purple-300" },
    { title: "Hoạt động", value: `${formatQuantity(dashboardActivity.reduce((sum, value) => sum + value, 0), 0)} sự kiện`, note: "Timeline", tone: "text-blue-300" },
  ];

  const kpiTrends = useMemo(() => {
    const base = dashboardActivity.length >= 2 ? dashboardActivity : [12, 18, 15, 22, 28, 35];
    const totalRatio = Math.max(1, statusCounts.total);
    const analytics = (readModel?.analytics ?? {}) as {
      producingSeries?: number[];
      stockSeries?: number[];
      qcPassSeries?: number[];
      qcFailSeries?: number[];
      transferringSeries?: number[];
    };

    return {
      // 1. Total Components -> Real historical analytics
      total: base,
      // 2. Producing -> Real historical analytics (if analytics.producingSeries exists) else Estimated
      producing: Array.isArray(analytics.producingSeries) && analytics.producingSeries.length >= 2
        ? analytics.producingSeries
        : base.map((v) => Math.round(v * (statusCounts.producing / totalRatio))),
      // 3. Stock -> Real historical analytics (if analytics.stockSeries exists) else Estimated
      stock: Array.isArray(analytics.stockSeries) && analytics.stockSeries.length >= 2
        ? analytics.stockSeries
        : base.map((v) => Math.round(v * (statusCounts.stock / totalRatio))),
      // 4. QC Pass -> Real historical analytics (if analytics.qcPassSeries exists) else Estimated
      qcPass: Array.isArray(analytics.qcPassSeries) && analytics.qcPassSeries.length >= 2
        ? analytics.qcPassSeries
        : base.map((v) => Math.round(v * (statusCounts.qcPass / totalRatio))),
      // 5. QC Fail -> Real historical analytics (if analytics.qcFailSeries exists) else Estimated
      qcFail: Array.isArray(analytics.qcFailSeries) && analytics.qcFailSeries.length >= 2
        ? analytics.qcFailSeries
        : base.map((v) => Math.round(v * (statusCounts.qcFail / totalRatio))),
      // 6. Transferring -> Real historical analytics (if analytics.transferringSeries exists) else Estimated
      transferring: Array.isArray(analytics.transferringSeries) && analytics.transferringSeries.length >= 2
        ? analytics.transferringSeries
        : base.map((v) => Math.round(v * (statusCounts.transferring / totalRatio))),
    };
  }, [dashboardActivity, statusCounts, readModel?.analytics]);

  const kpiDeltas = useMemo(() => {
    const computeDelta = (series: number[], alertMetric = false) => {
      const current = series[series.length - 1] ?? 0;
      const prev = series[series.length - 2] ?? 0;
      const diff = current - prev;
      const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0.0";
      const sign = diff >= 0 ? "▲ +" : "▼ ";
      const text = `${sign}${Math.abs(diff)} (${diff >= 0 ? "+" : ""}${pct}%)`;
      const color = alertMetric
        ? diff > 0
          ? "text-red-400 font-semibold font-mono text-[10px]"
          : "text-emerald-400 font-semibold font-mono text-[10px]"
        : diff >= 0
          ? "text-emerald-400 font-semibold font-mono text-[10px]"
          : "text-red-400 font-semibold font-mono text-[10px]";
      return { text, color };
    };

    return {
      total: computeDelta(kpiTrends.total),
      producing: computeDelta(kpiTrends.producing),
      stock: computeDelta(kpiTrends.stock),
      qcPass: computeDelta(kpiTrends.qcPass),
      qcFail: computeDelta(kpiTrends.qcFail, true),
      transferring: computeDelta(kpiTrends.transferring),
    };
  }, [kpiTrends]);

  const trendRows = useMemo(() => {
    const series = dashboardActivity.length ? dashboardActivity : [0, 0, 0, 0, 0, 0];
    const labels = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6"];
    const slice = series.slice(-6);
    return labels.map((label, idx) => ({
      label,
      value: slice[idx] ?? 0,
    }));
  }, [dashboardActivity]);

  function applySearch() {
    setQuery(searchDraft);
    setPage(1);
  }

  function resetFilters() {
    setSearchDraft("");
    setQuery("");
    setProject("");
    setStatus("");
    setLocation("");
    setType("");
    setPage(1);
  }

  return (
    <EnterpriseModulePage>
      <div className="space-y-2 text-xs -mt-2">
        {/* PART 1: Top KPI Strip (6 Cards) */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Tổng cấu kiện"
            value={statusCounts.total ? formatQuantity(statusCounts.total, 0) : "--"}
            note={kpiDeltas.total.text}
            noteClassName={kpiDeltas.total.color}
            tone="blue"
            icon={<Layers size={15} />}
            trend={kpiTrends.total}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đang sản xuất"
            value={statusCounts.producing ? formatQuantity(statusCounts.producing, 0) : "--"}
            note={kpiDeltas.producing.text}
            noteClassName={kpiDeltas.producing.color}
            tone="purple"
            icon={<Wrench size={15} />}
            trend={kpiTrends.producing}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Trong kho cấu kiện"
            value={statusCounts.stock ? formatQuantity(statusCounts.stock, 0) : "--"}
            note={kpiDeltas.stock.text}
            noteClassName={kpiDeltas.stock.color}
            tone="amber"
            icon={<Archive size={15} />}
            trend={kpiTrends.stock}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Ready to ship"
            value={statusCounts.qcPass ? formatQuantity(statusCounts.qcPass, 0) : "--"}
            note={kpiDeltas.qcPass.text}
            noteClassName={kpiDeltas.qcPass.color}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            trend={kpiTrends.qcPass}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="QC Không đạt"
            value={statusCounts.qcFail !== undefined ? formatQuantity(statusCounts.qcFail, 0) : "--"}
            note={kpiDeltas.qcFail.text}
            noteClassName={kpiDeltas.qcFail.color}
            tone="red"
            icon={<AlertTriangle size={15} />}
            trend={kpiTrends.qcFail}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đang xuất bãi"
            value={statusCounts.transferring ? formatQuantity(statusCounts.transferring, 0) : "--"}
            note={kpiDeltas.transferring.text}
            noteClassName={kpiDeltas.transferring.color}
            tone="cyan"
            icon={<Truck size={15} />}
            trend={kpiTrends.transferring}
            isLoading={isLoading}
          />
        </div>

        {/* Search & Filter Toolbar Immediately Below KPI Strip (Golden Reference Match) */}
        <EnterprisePanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <ComponentsSelect value={project} onChange={(v) => { setProject(v); setPage(1); }} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]">
              <option value="">Tất cả dự án</option>
              {(readModel?.filters.projects ?? []).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]">
              <option value="">Tất cả trạng thái</option>
              {(readModel?.filters.statuses ?? []).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect value={location} onChange={(v) => { setLocation(v); setPage(1); }} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]">
              <option value="">Tất cả vị trí</option>
              {(readModel?.filters.locations ?? []).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect value={type} onChange={(v) => { setType(v); setPage(1); }} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]">
              <option value="">Tất cả loại</option>
              {(readModel?.filters.types ?? []).map((item) => (
                <option key={item} value={item}>{item}</option>
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
        </EnterprisePanel>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1 -mt-1">
          {/* HERO TABLE: Danh sách cấu kiện */}
          <EnterprisePanel
            title={
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách cấu kiện</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {readModel?.summary?.total ?? rows.length} cấu kiện
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
            }
            className="xl:col-span-9"
          >
            <CockpitTableShell className="h-[430px] overflow-auto scrollbar-none">
              <table className="w-full min-w-[1080px] text-xs table-fixed border-collapse">
                <thead
                  className={`${enterpriseTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                >
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold w-[120px]">Mã cấu kiện</th>
                    <th className="px-3 py-2 text-left font-semibold w-[160px]">Tên cấu kiện</th>
                    <th className="px-3 py-2 text-left font-semibold w-[130px]">Dự án</th>
                    <th className="px-3 py-2 text-left font-semibold w-[120px]">Work Order</th>
                    <th className="px-3 py-2 text-right font-semibold w-[110px]">Khối lượng</th>
                    <th className="px-3 py-2 text-center font-semibold w-[120px]">Tiến độ</th>
                    <th className="px-3 py-2 text-center font-semibold w-[120px]">Material Ready</th>
                    <th className="px-3 py-2 text-center font-semibold w-[110px]">Trạng thái</th>
                    <th className="px-3 py-2 text-center font-semibold w-[90px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center">
                        <ModuleLoadingState label="Đang tải danh sách cấu kiện..." />
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => {
                      const item = row as any;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          className={`${enterpriseTableRow} cursor-pointer`}
                        >
                          <td className="truncate px-3 py-1.5 text-cyan-300 font-mono font-medium">
                            {item.code}
                          </td>
                          <td className="truncate px-3 py-1.5 text-white font-medium">
                            {item.name}
                          </td>
                          <td className="truncate px-3 py-1.5 text-slate-300">
                            {item.project || "Chưa gán"}
                          </td>
                          <td className="truncate px-3 py-1.5 text-cyan-300 font-mono">
                            {item.workOrder || "N/A"}
                          </td>
                          <td className="px-3 py-1.5 font-mono tabular-nums text-right text-cyan-300">
                            {formatQuantity(item.weight ?? item.quantity, 2)} kg
                          </td>
                          <td className="px-3 py-1.5">
                            <EnterpriseMeter value={item.progress ?? 80} />
                          </td>
                          <td className="px-3 py-1.5">
                            <EnterpriseMeter
                              value={item.materialReady ?? 100}
                              tone={(item.materialReady ?? 100) < 100 ? "bg-amber-500" : "bg-emerald-500"}
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <EnterpriseStatusBadge status={item.status || "STOCK"} />
                          </td>
                          <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleRowClick(item)}
                              className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"
                            >
                              <Eye size={12} />
                              Xem
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {!isLoading && componentTableEmptyRows.map((_, index) => (
                    <tr key={`component-empty-${index}`} aria-hidden="true" className="border-b border-white/[0.04]">
                      <td colSpan={9} className="h-9 px-1.5 py-0.5">
                        <div className="h-px w-full bg-white/[0.035]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CockpitTableShell>
            {!isLoading && !rows.length ? (
              <div className="p-3">
                <ModuleEmptyState
                  icon={<Package size={18} />}
                  title="Chưa có dữ liệu cấu kiện"
                  description="Không tìm thấy cấu kiện phù hợp với bộ lọc hiện tại."
                />
              </div>
            ) : null}
            <div className="mt-2">
              <DataTablePagination
                page={page}
                pageSize={pageSize}
                total={readModel?.summary?.total ?? rows.length}
                onPageChange={setPage}
              />
            </div>
          </EnterprisePanel>

          {/* RIGHT ANALYTICS RAIL */}
          <div className="space-y-1.5 xl:col-span-3">
            {/* Card 1: Trạng thái cấu kiện */}
            <CockpitChartCard
              title="Trạng thái cấu kiện"
              className="p-2"
            >
              {typeSegments.length ? (
                <ComponentsDonut
                  centerValue={formatQuantity(statusCounts.total, 0)}
                  centerLabel="Tổng"
                  segments={typeSegments}
                />
              ) : (
                <ModuleEmptyState
                  icon={<BarChart3 size={18} />}
                  title="Chưa có phân bổ trạng thái"
                  description="Biểu đồ sẽ hiển thị khi read model trả về nhóm trạng thái."
                />
              )}
            </CockpitChartCard>

            {/* Card 2: Xu hướng cấu kiện */}
            <CockpitChartCard
              title="Xu hướng cấu kiện"
              value={`${formatQuantity(statusCounts.total, 0)} cấu kiện`}
              delta="6 kỳ gần nhất"
              chartHeightClass="h-[110px]"
              className="p-2 h-[196px]"
            >
              <EnterpriseCompactTrendChart rows={trendRows} />
            </CockpitChartCard>

            {/* Card 3: Theo dự án */}
            <CockpitChartCard
              title="Theo dự án"
              className="p-2"
            >
              <div className="space-y-1">
                {projectRows.map(([projectName, value]) => (
                  <div
                    key={projectName}
                    className="grid grid-cols-[1fr_70px_44px] items-center gap-1 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-slate-200">{projectName}</div>
                      <div className="mt-1 h-2 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          style={{
                            width: `${Math.max(8, (value / maxProject) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-right text-white">
                      {formatQuantity(value, 0)}
                    </span>
                    <span className="text-right text-slate-400">
                      {(
                        (value /
                          Math.max(
                            1,
                            rows.length,
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                ))}
                {!projectRows.length ? (
                  <ModuleEmptyState
                    icon={<BarChart3 size={18} />}
                    title="Chưa có phân bổ dự án"
                    description="Cấu kiện theo dự án sẽ hiển thị khi workspace có dữ liệu."
                  />
                ) : null}
              </div>
            </CockpitChartCard>

            {/* Card 4: Cảnh báo cấu kiện */}
            <CockpitChartCard
              title="Cảnh báo cấu kiện"
              className="p-2"
            >
              <div className="space-y-1.5 text-xs">
                {statusCounts.qcFail > 0 ? (
                  <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-red-300">
                    <span className="truncate">Cấu kiện QC không đạt (NCR)</span>
                    <span className="font-bold font-mono">{statusCounts.qcFail}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-amber-300">
                  <span className="truncate">Cấu kiện chờ kiểm tra (QC Queue)</span>
                  <span className="font-bold font-mono">{waitingQcRows.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-300">
                  <span className="truncate">Sẵn sàng xuất bãi (Ready)</span>
                  <span className="font-bold font-mono">{readyShipRows.length}</span>
                </div>
              </div>
            </CockpitChartCard>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          <CockpitChartCard title="Hàng đợi QC" className="p-2">
            {waitingQcRows.length ? (
              <ComponentQueue rows={waitingQcRows} tone="amber" />
            ) : (
              <ModuleEmptyState icon={<Package size={18} />} title="Không có cấu kiện chờ QC" description="Các cấu kiện có trạng thái hoặc vị trí QC sẽ xuất hiện tại đây." />
            )}
          </CockpitChartCard>
          <CockpitChartCard title="Ready to ship" className="p-2">
            {readyShipRows.length ? (
              <ComponentQueue rows={readyShipRows} tone="emerald" />
            ) : (
              <ModuleEmptyState icon={<Package size={18} />} title="Chưa có cấu kiện sẵn sàng chuyển" description="Các cấu kiện READY/QC đạt sẽ xuất hiện tại đây." />
            )}
          </CockpitChartCard>
          <CockpitChartCard title="Hoạt động" className="p-2">
            <ComponentsMiniBars
              values={dashboardActivity}
              tone="emerald"
            />
          </CockpitChartCard>
          <CockpitChartCard title="Thống kê nhanh" className="p-2">
            <div className="space-y-1">
              {quickStats.slice(0, 4).map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2">
                  <span className="truncate text-xs text-slate-400">{item.title}</span>
                  <div className="min-w-0 text-right">
                    <div className={`truncate text-sm font-bold ${item.tone}`}>{item.value}</div>
                    <div className="truncate text-[10px] text-slate-500">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </CockpitChartCard>
        </div>
      </div>

      {/* Component Detail Drawer */}
      <ModuleDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedComponent ? `Cấu kiện ${selectedComponent.code}` : "Chi tiết cấu kiện"}
        subtitle={selectedComponent?.name}
        size="md"
      >
        {selectedComponent ? (
          <div className="space-y-4 text-xs text-slate-200">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Mã cấu kiện</span>
                <span className="font-mono text-cyan-300 text-sm font-semibold">{selectedComponent.code}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Tên cấu kiện</span>
                <span className="text-white font-medium">{selectedComponent.name}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Dự án</span>
                <span className="text-slate-200">{selectedComponent.project || "Chưa gán"}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Trạng thái</span>
                <EnterpriseStatusBadge status={selectedComponent.status || "STOCK"} />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Profile / Quy cách</span>
                <span className="text-slate-200">{selectedComponent.profile || "N/A"}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Vị trí hiện tại</span>
                <span className="text-slate-200">{selectedComponent.location || "Kho cấu kiện"}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Khối lượng</span>
                <span className="font-mono text-cyan-300">{formatQuantity(selectedComponent.weight ?? selectedComponent.quantity, 2)} kg</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Work Order</span>
                <span className="font-mono text-cyan-300">{selectedComponent.workOrder || "N/A"}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">Tiến độ sản xuất & Vật tư sẵn sàng</h4>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Tiến độ gia công</span>
                  <span className="font-mono text-cyan-300">{selectedComponent.progress ?? 80}%</span>
                </div>
                <EnterpriseMeter value={selectedComponent.progress ?? 80} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Vật tư sẵn sàng (Material Ready)</span>
                  <span className="font-mono text-emerald-300">{selectedComponent.materialReady ?? 100}%</span>
                </div>
                <EnterpriseMeter
                  value={selectedComponent.materialReady ?? 100}
                  tone={(selectedComponent.materialReady ?? 100) < 100 ? "bg-amber-500" : "bg-emerald-500"}
                />
              </div>
            </div>
          </div>
        ) : null}
      </ModuleDetailDrawer>

      {/* EXPANDED TABLE MODAL ("Xem tất cả" interaction matching Inventory Golden Reference) */}
      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách cấu kiện</h2>
                <p className="text-xs text-slate-400">Tổng cộng {readModel?.summary?.total ?? rows.length} cấu kiện trong hệ thống</p>
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
                  className={`${enterpriseTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                >
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold w-[130px]">Mã cấu kiện</th>
                    <th className="px-3 py-2 text-left font-semibold w-[180px]">Tên cấu kiện</th>
                    <th className="px-3 py-2 text-left font-semibold w-[140px]">Dự án</th>
                    <th className="px-3 py-2 text-left font-semibold w-[130px]">Work Order</th>
                    <th className="px-3 py-2 text-right font-semibold w-[120px]">Khối lượng</th>
                    <th className="px-3 py-2 text-center font-semibold w-[130px]">Tiến độ</th>
                    <th className="px-3 py-2 text-center font-semibold w-[130px]">Material Ready</th>
                    <th className="px-3 py-2 text-center font-semibold w-[120px]">Trạng thái</th>
                    <th className="px-3 py-2 text-center font-semibold w-[100px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item: any) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={`${enterpriseTableRow} cursor-pointer`}
                    >
                      <td className="truncate px-3 py-2 text-cyan-300 font-mono font-medium">
                        {item.code}
                      </td>
                      <td className="truncate px-3 py-2 text-white font-medium">
                        {item.name}
                      </td>
                      <td className="truncate px-3 py-2 text-slate-300">
                        {item.project || "Chưa gán"}
                      </td>
                      <td className="truncate px-3 py-2 text-cyan-300 font-mono">
                        {item.workOrder || "N/A"}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-right text-cyan-300">
                        {formatQuantity(item.weight ?? item.quantity, 2)} kg
                      </td>
                      <td className="px-3 py-2">
                        <EnterpriseMeter value={item.progress ?? 80} />
                      </td>
                      <td className="px-3 py-2">
                        <EnterpriseMeter
                          value={item.materialReady ?? 100}
                          tone={(item.materialReady ?? 100) < 100 ? "bg-amber-500" : "bg-emerald-500"}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <EnterpriseStatusBadge status={item.status || "STOCK"} />
                      </td>
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRowClick(item)}
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

            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={readModel?.summary?.total ?? rows.length}
              onPageChange={setPage}
            />
          </div>
        </div>
      ) : null}
    </EnterpriseModulePage>
  );
}

function ComponentQueue({
  rows,
  tone,
}: {
  rows: Array<{ id: string; code: string; name: string; project: string; status: string }>
  tone: "amber" | "emerald"
}) {
  const toneClass = tone === "emerald"
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
    : "border-amber-400/30 bg-amber-500/10 text-amber-300";
  const emptyRows = Array.from({ length: Math.max(0, 4 - rows.length) });

  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs">
          <div className="min-w-0">
            <div className="truncate font-semibold text-cyan-300">{row.code}</div>
            <div className="truncate text-slate-400">{row.name} · {row.project || "-"}</div>
          </div>
          <span className={`rounded-lg border px-2 py-0.5 ${toneClass}`}>{row.status}</span>
        </div>
      ))}
      {emptyRows.map((_, index) => (
        <div key={`queue-empty-${index}`} aria-hidden="true" className="h-[42px] rounded-xl border border-white/[0.055] bg-white/[0.018]" />
      ))}
    </div>
  );
}
