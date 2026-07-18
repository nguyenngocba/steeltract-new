import { useEffect, useState } from "react";
import { BarChart3, Package } from "lucide-react";

import { ComponentsWorkspace } from "../../components/ComponentsWorkspace";
import {
  ModuleEmptyState,
  ModuleFilterBar,
  ModuleLoadingState,
} from "../../../../shared/ui/modules";
import {
  CockpitChartCard,
  CockpitKpiCard,
  CockpitTableShell,
  COCKPIT_HEIGHTS,
  DataTablePagination,
} from "../../../../shared/ui/cockpit";
import {
  useComponentsDashboard,
  useComponentsOverview,
} from "../../hooks/queries/useComponents";
import { formatQuantity } from "@/shared/utils/number-format";
import {
  ComponentsDonut,
  ComponentsMiniBars,
  ComponentsSelect,
  componentsInput,
  componentsMutedButton,
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
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 14;
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
  const paginatedRows = rows;
  const dashboardData = dashboard?.data;
  const statusCounts = dashboardData
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
  const dashboardActivity =
    dashboardData?.payload?.timelineActions?.map((row) => row.count) ?? [];
  const colors = [
    "#1d7cff",
    "#06b6d4",
    "#7c3aed",
    "#f59e0b",
    "#ef4444",
    "#14c987",
  ];
  const typeSegments = (dashboardData?.payload?.statusCounts ?? []).map(
    ({ status: label, count: value }, index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }),
  );
  const topProfiles: Array<[string, number]> = [];
  const maxTop = Math.max(1, ...topProfiles.map(([, value]) => value));

  return (
    <ComponentsWorkspace>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <CockpitKpiCard
            title="Tổng số cấu kiện"
            value={formatQuantity(statusCounts.total, 0)}
            note="Dữ liệu hiện tại"
            tone="blue"
            state="normal"
          />
          <CockpitKpiCard
            title="Đang sản xuất"
            value={formatQuantity(statusCounts.producing, 0)}
            note="Theo trạng thái"
            tone="purple"
            state="normal"
          />
          <CockpitKpiCard
            title="Tồn kho cấu kiện"
            value={formatQuantity(statusCounts.stock, 0)}
            note="Theo trạng thái"
            tone="amber"
            state="normal"
          />
          <CockpitKpiCard
            title="Đã QC đạt"
            value={formatQuantity(statusCounts.qcPass, 0)}
            note="Theo trạng thái"
            tone="emerald"
            state="normal"
          />
          <CockpitKpiCard
            title="QC không đạt"
            value={formatQuantity(statusCounts.qcFail, 0)}
            note="Theo trạng thái"
            tone="red"
            state="normal"
          />
          <CockpitKpiCard
            title="Đang chuyển"
            value={formatQuantity(statusCounts.transferring, 0)}
            note="Theo trạng thái"
            tone="cyan"
            state="normal"
          />
        </div>

        <ModuleFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã, tên, profile, dự án..."
            className={`${componentsInput} xl:col-span-4`}
          />
          <ComponentsSelect
            value={project}
            onChange={setProject}
            className="xl:col-span-2"
          >
            <option value="">Dự án</option>
            {(readModel?.filters.projects ?? []).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </ComponentsSelect>
          <ComponentsSelect
            value={status}
            onChange={setStatus}
            className="xl:col-span-2"
          >
            <option value="">Trạng thái</option>
            {(readModel?.filters.statuses ?? []).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </ComponentsSelect>
          <ComponentsSelect
            value={location}
            onChange={setLocation}
            className="xl:col-span-2"
          >
            <option value="">Vị trí</option>
            {(readModel?.filters.locations ?? []).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </ComponentsSelect>
          <ComponentsSelect
            value={type}
            onChange={setType}
            className="xl:col-span-1"
          >
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
            className={`${componentsMutedButton} xl:col-span-1`}
          >
            Làm mới
          </button>
        </ModuleFilterBar>

        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-12 xl:col-span-9">
            <CockpitChartCard
              title={`Danh sách cấu kiện (${readModel?.meta.total ?? 0})`}
              className={COCKPIT_HEIGHTS.TABLE_MD}
            >
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[980px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-350">
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
                          className="px-4 py-2.5 text-left text-xs font-semibold text-slate-300 border-b border-cyan-400/10"
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
                          className="border-b border-white/[0.04] text-slate-200 transition hover:bg-cyan-400/[0.04]"
                        >
                          <td className="truncate px-4 py-2.5 text-cyan-300 font-mono">
                            {row.code}
                          </td>
                          <td className="truncate px-4 py-2.5 text-white">
                            {row.name}
                          </td>
                          <td className="truncate px-4 py-2.5 text-slate-300">
                            {row.profile}
                          </td>
                          <td className="truncate px-4 py-2.5 text-slate-300">
                            {row.project}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-lg border px-2 py-0.5 text-xs ${statusTone(row.status)}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="truncate px-4 py-2.5 text-slate-300">
                            {row.location}
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-cyan-300">
                            {formatQuantity(row.quantity, 0)}
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-emerald-300">
                            {formatQuantity(row.qcQuantity, 0)}
                          </td>
                        </tr>
                      ))
                    )}
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
            </CockpitChartCard>
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={readModel?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </div>

          <aside className="col-span-12 space-y-1 xl:col-span-3">
            <CockpitChartCard
              title="Tổng hợp"
              className={COCKPIT_HEIGHTS.CHART_SM}
            >
              <ComponentsDonut
                centerValue={formatQuantity(dashboardData?.totalComponents ?? 0, 0)}
                centerLabel="Tổng"
                segments={
                  typeSegments.length
                    ? typeSegments
                    : [{ label: "Chưa có dữ liệu", value: 1, color: "#334155" }]
                }
              />
            </CockpitChartCard>
            <CockpitChartCard
              title="Hoạt động"
              className={COCKPIT_HEIGHTS.CHART_SM}
            >
              <ComponentsMiniBars
                values={dashboardActivity}
                tone="emerald"
              />
            </CockpitChartCard>
            <CockpitChartCard
              title="Thống kê"
              className={COCKPIT_HEIGHTS.CHART_SM}
            >
              <div className="space-y-1">
                {topProfiles.map(([profile, value]) => (
                  <div
                    key={profile}
                    className="grid grid-cols-[1fr_70px_44px] items-center gap-1 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-slate-200">{profile}</div>
                      <div className="mt-1 h-2 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          style={{
                            width: `${Math.max(8, (value / maxTop) * 100)}%`,
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
                            readModel?.analytics.totalQuantity ?? 0,
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                ))}
                {!topProfiles.length ? (
                  <ModuleEmptyState
                    icon={<BarChart3 size={18} />}
                    title="Chưa có thống kê"
                    description="Các cấu kiện theo profile sẽ hiển thị tại đây."
                  />
                ) : null}
              </div>
            </CockpitChartCard>
          </aside>
        </div>
      </div>
    </ComponentsWorkspace>
  );
}
