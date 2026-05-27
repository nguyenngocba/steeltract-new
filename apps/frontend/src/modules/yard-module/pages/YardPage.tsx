import { useState } from 'react'

import { YardDashboardTab }
from '../tabs/dashboard/YardDashboardTab'

const tabs = [
  'dashboard',
  'yards',
  'zones',
  'loading',
  'unloading',
  'crane',
  'trucks',
  'maps',
  'tracking',
  'reports',
  'settings',
]

export function YardPage() {

  const [activeTab, setActiveTab] =
    useState('dashboard')

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-6 py-5">

        <h1 className="text-3xl font-bold text-white">
          Yard Runtime
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Yard + Truck + Crane Runtime
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
          <YardDashboardTab />
        )}

      </div>

    </div>
  )
}
