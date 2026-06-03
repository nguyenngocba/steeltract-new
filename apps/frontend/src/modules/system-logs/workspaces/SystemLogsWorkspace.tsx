import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, RefreshCw, Search } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { systemApi, type ActivityLog } from '@/modules/system/api/system.api'

const panel = 'rounded border border-slate-800 bg-[#071321]'
const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '-'

export function SystemLogsWorkspace() {
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const { data = [], refetch } = useQuery<ActivityLog[]>({ queryKey: ['system-activity-logs'], queryFn: systemApi.activityLogs, refetchInterval: 10000 })
  const modules = Array.from(new Set(data.map((row) => row.module).filter(Boolean))) as string[]
  const rows = useMemo(() => data.filter((row) => {
    if (moduleFilter !== 'all' && row.module !== moduleFilter) return false
    return `${row.action} ${row.entity} ${row.entityId ?? ''} ${row.module ?? ''}`.toLowerCase().includes(query.toLowerCase())
  }), [data, moduleFilter, query])
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.action] = (acc[row.action] ?? 0) + 1
    return acc
  }, {})

  return <OperationalShell>
    <main className="min-h-screen bg-[#020811] p-4 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4"><div><h1 className="text-2xl font-semibold">Nhật ký hệ thống</h1><p className="mt-1 text-sm text-slate-500">Theo dõi tất cả hoạt động trong hệ thống</p></div><button className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm"><Download size={16} />Xuất Excel</button></header>
      <section className={`${panel} p-3`}><div className="flex flex-wrap gap-2"><div className="flex min-w-72 flex-1 items-center gap-2 rounded border border-slate-700 bg-[#050d18] px-3"><Search size={15} className="text-cyan-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm hành động, đối tượng..." className="h-10 w-full bg-transparent text-sm outline-none" /></div><select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="h-10 rounded border border-slate-700 bg-[#050d18] px-3 text-sm"><option value="all">Module: Tất cả</option>{modules.map((module) => <option key={module} value={module}>{module}</option>)}</select><button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 text-sm"><RefreshCw size={15} />Làm mới</button></div></section>
      <div className="mt-3 grid gap-3 xl:grid-cols-[320px_1fr]"><aside className="space-y-3"><section className={`${panel} p-4`}><h2 className="text-sm font-semibold">Tổng quan</h2><div className="mt-3 space-y-2">{Object.entries(counts).slice(0, 8).map(([action, count]) => <div key={action} className="flex justify-between text-sm"><span className="text-slate-400">{action}</span><span className="text-cyan-300">{count}</span></div>)}</div></section></aside><LogTable rows={rows} /></div>
    </main>
  </OperationalShell>
}

function LogTable({ rows }: { rows: ActivityLog[] }) {
  return <section className={`${panel} overflow-hidden`}><h2 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Danh sách nhật ký ({rows.length})</h2><table className="w-full text-sm"><thead className="bg-slate-900/60 text-xs text-slate-400"><tr><th className="px-4 py-3 text-left">Thời gian</th><th className="px-4 py-3 text-left">Người dùng</th><th className="px-4 py-3 text-left">Hành động</th><th className="px-4 py-3 text-left">Đối tượng</th><th className="px-4 py-3 text-left">Module</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-800 hover:bg-cyan-950/20"><td className="px-4 py-3 text-slate-500">{date(row.createdAt)}</td><td className="px-4 py-3">{row.user?.fullName ?? row.user?.username ?? row.userId ?? 'System'}</td><td className="px-4 py-3"><span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">{row.action}</span></td><td className="px-4 py-3">{row.entity}<span className="block text-xs text-slate-500">{row.entityId ?? '-'}</span></td><td className="px-4 py-3 text-cyan-300">{row.module ?? '-'}</td></tr>)}</tbody></table></section>
}
