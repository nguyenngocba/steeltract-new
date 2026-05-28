import { useState } from 'react'

import { ComponentsDashboardTab }
from '../tabs/dashboard/ComponentsDashboardTab'

const tabs = [
  'dashboard',
  'components',
  'fabrication',
  'cutting',
  'welding',
  'painting',
  'assembly',
  'qc',
  'tracking',
  'consumables',
  'reports',
  'settings',
]

export function ComponentsPage() {

  const [activeTab, setActiveTab] =
    useState('dashboard')

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-6 py-5">

        <h1 className="text-3xl font-bold text-white">
          Components Runtime
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Fabrication + QC + Tracking
        </p>

      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-auto border-b border-zinc-800 px-6 py-4">

        {tabs.map((tab) => (

          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-cyan-600 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            {tab}
          </button>

        ))}

      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto p-6">

        {activeTab === 'dashboard' && (
          <ComponentsDashboardTab />
        )}

      </div>

    </div>
  )
}
