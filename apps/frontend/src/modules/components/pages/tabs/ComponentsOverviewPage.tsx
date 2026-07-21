import { useEffect, useState } from "react";
import { BarChart3, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EnterpriseModulePage } from "@/shared/runtime-tabs/EnterpriseModulePage";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../../../shared/ui/modules";
import {
  CockpitKpiCard,
} from "../../../../shared/ui/cockpit";
import {
  InventoryChartCard,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from "../../../inventory/components/InventoryVisuals";
import {
  useComponentsDashboard,
  useComponentsOverview,
} from "../../hooks/queries/useComponents";
import { formatQuantity } from "@/shared/utils/number-format";
import {
  ComponentsDonut,
  ComponentsMiniBars,
  ComponentsSelect,
  componentsMutedButton,
} from "./ComponentsCockpitShared";

const inventoryFilterControl =
  "h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65";

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
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
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
  const kpiTrend = dashboardActivity.length ? dashboardActivity : undefined;

  return (
    <EnterpriseModulePage>
      <div className="space-y-2 text-xs -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <CockpitKpiCard
            title="Tổng cấu kiện"
            value={formatQuantity(statusCounts.total, 0)}
            note="Toàn bộ lifecycle"
            tone="blue"
            state="normal"
            trendData={kpiTrend}
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Đang sản xuất"
            value={formatQuantity(statusCounts.producing, 0)}
            note="Cut / Weld / Paint"
            tone="purple"
            state="normal"
            trendData={kpiTrend}
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Trong kho cấu kiện"
            value={formatQuantity(statusCounts.stock, 0)}
            note="Đang lưu kho"
            tone="amber"
            state="normal"
            trendData={kpiTrend}
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Ready to ship"
            value={formatQuantity(statusCounts.qcPass, 0)}
            note="QC đạt / READY"
            tone="emerald"
            state="normal"
            trendData={kpiTrend}
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Không đạt"
            value={formatQuantity(statusCounts.qcFail, 0)}
            note="Theo read model"
            tone="red"
            state="normal"
            trendData={kpiTrend}
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Đang xuất bãi"
            value={formatQuantity(statusCounts.transferring, 0)}
            note="SHIPPED"
            tone="cyan"
            state="normal"
            trendData={kpiTrend}
            className="!h-[92px] !p-3"
          />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã, tên, profile, dự án..."
              className={`${inventoryFilterControl} xl:col-span-2`}
            />
            <ComponentsSelect value={project} onChange={setProject} className={inventoryFilterControl}>
              <option value="">Dự án</option>
              {(readModel?.filters.projects ?? []).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect value={status} onChange={setStatus} className={inventoryFilterControl}>
              <option value="">Trạng thái</option>
              {(readModel?.filters.statuses ?? []).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect value={location} onChange={setLocation} className={inventoryFilterControl}>
              <option value="">Vị trí</option>
              {(readModel?.filters.locations ?? []).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </ComponentsSelect>
            <ComponentsSelect value={type} onChange={setType} className={inventoryFilterControl}>
              <option value="">Loại</option>
              {(readModel?.filters.types ?? []).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </ComponentsSelect>
            <button
              onClick={() => {
                setQuery("");
                setProject("");
                setStatus("");
                setLocation("");
                setType("");
              }}
              className={componentsMutedButton}
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1 -mt-1">
          <InventoryPanel
            title={
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                  Top {paginatedRows.length} cấu kiện
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("/components/list")}
                  className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Xem tất cả
                </button>
              </div>
            }
            className="xl:col-span-9"
          >
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <div className="rounded-lg border border-white/10 overflow-hidden h-[430px]">
                <table className="w-full min-w-[1200px] text-xs table-fixed border-collapse">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10`}
                    style={{ backgroundColor: "rgba(30, 41, 59, 1)" }}
                  >
                    <tr>
                      {[
                        "Mã cấu kiện",
                        "Tên cấu kiện",
                        "Loại / Profile",
                        "Dự án",
                        "Trạng thái",
                        "Vị trí",
                        "SL",
                        "Đã QC",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-2 text-left font-medium"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6">
                          <ModuleLoadingState label="Đang tải cấu kiện..." />
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={inventoryTableRow}
                        >
                          <td className="truncate px-2.5 py-1 text-cyan-300 font-mono">
                            {row.code}
                          </td>
                          <td className="truncate px-2.5 py-1 text-white">
                            {row.name}
                          </td>
                          <td className="truncate px-2.5 py-1 text-slate-300">
                            {row.profile}
                          </td>
                          <td className="truncate px-2.5 py-1 text-slate-300">
                            {row.project}
                          </td>
                          <td className="px-2.5 py-1">
                            <span
                              className={`rounded-lg border px-2 py-0.5 text-xs ${statusTone(row.status)}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="truncate px-2.5 py-1 text-slate-300">
                            {row.location}
                          </td>
                          <td className="px-2.5 py-1 font-mono tabular-nums text-cyan-300">
                            {formatQuantity(row.quantity, 0)}
                          </td>
                          <td className="px-2.5 py-1 font-mono tabular-nums text-emerald-300">
                            {formatQuantity(row.qcQuantity, 0)}
                          </td>
                        </tr>
                      ))
                    )}
                    {!isLoading && componentTableEmptyRows.map((_, index) => (
                      <tr key={`component-empty-${index}`} aria-hidden="true" className="border-b border-white/[0.04]">
                        <td colSpan={8} className="h-9 px-1.5 py-0.5">
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
                    title="Chưa có dữ liệu cấu kiện"
                    description="Không tìm thấy cấu kiện phù hợp với bộ lọc hiện tại."
                  />
                </div>
              ) : null}
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard
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
            </InventoryChartCard>
            <InventoryChartCard
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
            </InventoryChartCard>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          <InventoryChartCard title="Hàng đợi QC" className="p-2">
            {waitingQcRows.length ? (
              <ComponentQueue rows={waitingQcRows} tone="amber" />
            ) : (
              <ModuleEmptyState icon={<Package size={18} />} title="Không có cấu kiện chờ QC" description="Các cấu kiện có trạng thái hoặc vị trí QC sẽ xuất hiện tại đây." />
            )}
          </InventoryChartCard>
          <InventoryChartCard title="Ready to ship" className="p-2">
            {readyShipRows.length ? (
              <ComponentQueue rows={readyShipRows} tone="emerald" />
            ) : (
              <ModuleEmptyState icon={<Package size={18} />} title="Chưa có cấu kiện sẵn sàng chuyển" description="Các cấu kiện READY/QC đạt sẽ xuất hiện tại đây." />
            )}
          </InventoryChartCard>
          <InventoryChartCard title="Hoạt động" className="p-2">
            <ComponentsMiniBars
              values={dashboardActivity}
              tone="emerald"
            />
          </InventoryChartCard>
          <InventoryChartCard title="Thống kê nhanh" className="p-2">
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
          </InventoryChartCard>
        </div>
      </div>
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
