import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";

import { EnterpriseModulePage } from "@/shared/runtime-tabs/EnterpriseModulePage";
import {
  CockpitKpiCard,
} from "../../../../shared/ui/cockpit";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../../../shared/ui/modules";
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from "../../../inventory/components/InventoryVisuals";
import { componentsInput } from "./ComponentsCockpitShared";
import { useComponentsHistory } from "../../hooks/queries/useComponents";
import { formatQuantity } from "@/shared/utils/number-format";

export function ComponentsHistoryPage() {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 14;
  const { data: history, isLoading } = useComponentsHistory({
    page,
    limit: pageSize,
    search: query || undefined,
    action: action || undefined,
  });
  const rows = history?.data ?? [];
  const paginatedRows = rows;
  const doneCount = history?.summary.completed ?? 0;
  const activeCount = history?.summary.active ?? 0;
  const failCount = history?.summary.failed ?? 0;

  useEffect(() => {
    setPage(1);
  }, [query, action]);
  const actionOptions = useMemo(() => {
    const values = new Set<string>();
    (history?.recent ?? []).forEach((row) => {
      if (row.action) values.add(row.action);
    });
    rows.forEach((row) => {
      const stage = row[5];
      if (stage) values.add(stage);
    });
    return Array.from(values).sort();
  }, [history?.recent, rows]);

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-6">
          <CockpitKpiCard
            title="Tổng cấu kiện gia công"
            value={formatQuantity(history?.summary.total ?? 0, 0)}
            note="Lịch sử thực tế"
            state="normal"
            tone="cyan"
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Hoàn thành"
            value={formatQuantity(doneCount, 0)}
            note="Theo timeline"
            state="normal"
            tone="emerald"
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Đang gia công"
            value={formatQuantity(activeCount, 0)}
            note="Theo timeline"
            state="normal"
            tone="blue"
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Chờ gia công"
            value={formatQuantity(history?.summary.waiting ?? 0, 0)}
            note="Theo timeline"
            state="normal"
            tone="amber"
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Lỗi / Làm lại"
            value={formatQuantity(failCount, 0)}
            note="Theo timeline"
            state="normal"
            tone="red"
            className="!h-[92px] !p-3"
          />
          <CockpitKpiCard
            title="Kết quả đạt"
            value={formatQuantity(history?.summary.passed ?? 0, 0)}
            state="normal"
            tone="purple"
            className="!h-[92px] !p-3"
          />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-8">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã cấu kiện, tên cấu kiện, dự án..."
            className={`${componentsInput} xl:col-span-4`}
          />
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className={`${componentsInput} xl:col-span-2`}
          >
            <option value="">Tất cả công đoạn</option>
            {actionOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setAction("");
            }}
            className={`${componentsInput} xl:col-span-2 text-cyan-200`}
          >
            Làm mới
          </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <InventoryPanel
              title={<h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">{`Danh sách lịch sử gia công (${history?.meta.total ?? 0})`}</h3>}
              className="h-[520px]"
            >
              <div className="rounded-lg border border-white/10 overflow-hidden h-[430px]">
                <table className="w-full min-w-[1120px] table-fixed text-sm">
                  <thead className={inventoryTableHead}>
                    <tr>
                      {[
                        "Mã cấu kiện",
                        "Tên cấu kiện",
                        "Số lệnh SX",
                        "Dự án",
                        "Xưởng",
                        "Công đoạn",
                        "Bắt đầu",
                        "Hoàn thành",
                        "Trạng thái",
                        "Kết quả",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-1.5 py-0.5 text-left font-medium"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-2 py-10 text-center text-slate-400"
                        >
                          <ModuleLoadingState label="Đang tải lịch sử..." />
                        </td>
                      </tr>
                    ) : paginatedRows.length ? (
                      paginatedRows.map((row) => (
                        <tr
                          key={row[0]}
                          className={inventoryTableRow}
                        >
                          {row.map((cell, index) => (
                            <td
                              key={`${row[0]}-${cell}`}
                              className={`px-2 py-2 ${index === 0 ? "text-cyan-300" : ""} ${cell === "Đạt" ? "text-emerald-300" : cell === "Không đạt" ? "text-red-300" : ""}`}
                            >
                              {index === 6 || (index === 7 && cell !== "-")
                                ? new Date(cell).toLocaleString("vi-VN")
                                : cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-2 py-10">
                          <ModuleEmptyState
                            icon={<Clock size={18} />}
                            title="Chưa có lịch sử"
                            description="Không tìm thấy lịch sử gia công phù hợp với bộ lọc hiện tại."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <InventoryPagination
                page={page}
                pageSize={pageSize}
                pageCount={Math.max(1, Math.ceil((history?.meta.total ?? 0) / pageSize))}
                total={history?.meta.total ?? 0}
                onPageChange={setPage}
              />
            </InventoryPanel>
          </div>

          <div className="space-y-1 xl:col-span-3">
            <InventoryChartCard
              title="Hoạt động hôm nay"
              className="h-[170px]"
            >
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-cyan-300">
                  {history?.meta.total ?? 0}
                </div>
                <div>Bản ghi đang hiển thị.</div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard
              title="Theo loại"
              className="h-[170px]"
            >
              <div className="grid h-full content-center gap-1 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Hoàn thành</span>
                  <span className="text-emerald-300">{doneCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Đang chạy</span>
                  <span className="text-cyan-300">{activeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Không đạt</span>
                  <span className="text-red-300">{failCount}</span>
                </div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard
              title="Gần đây"
              className="h-[170px]"
            >
              {(history?.recent ?? []).length ? (
                history?.recent.map((row) => (
                  <div
                    key={`${row.code}-${row.action}`}
                    className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300"
                  >
                    <span className="truncate text-cyan-300">{row.code}</span>
                    <span className="shrink-0">{row.action}</span>
                  </div>
                ))
              ) : (
                <ModuleEmptyState
                  icon={<Clock size={18} />}
                  title="Chưa có hoạt động"
                  description="Chưa có lịch sử gần đây."
                />
              )}
            </InventoryChartCard>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  );
}
