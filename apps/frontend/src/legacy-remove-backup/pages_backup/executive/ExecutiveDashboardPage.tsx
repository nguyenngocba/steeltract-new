import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

import jsPDF from 'jspdf'

import html2canvas from 'html2canvas'

import * as XLSX from 'xlsx'

import { saveAs } from 'file-saver'

export function ExecutiveDashboardPage() {
  const [analytics,
    setAnalytics] =
    useState<any>(null)

  const [forecast,
    setForecast] =
    useState<any>(null)

  async function loadData() {
    const [
      analyticsResponse,
      forecastResponse,
    ] = await Promise.all([
      api.get(
        '/dashboard/analytics',
      ),

      api.get(
        '/dashboard/forecast',
      ),
    ])

    setAnalytics(
      analyticsResponse.data,
    )

    setForecast(
      forecastResponse.data,
    )
  }

  async function exportPdf() {
    const element =
      document.getElementById(
        'executive-report',
      )

    if (!element) {
      return
    }

    const canvas =
      await html2canvas(
        element,
      )

    const imgData =
      canvas.toDataURL(
        'image/png',
      )

    const pdf =
      new jsPDF({
        orientation:
          'portrait',
        unit: 'px',
        format: 'a4',
      })

    pdf.addImage(
      imgData,
      'PNG',
      20,
      20,
      550,
      700,
    )

    pdf.save(
      'executive-report.pdf',
    )
  }

  function exportExcel() {
    const worksheet =
      XLSX.utils.json_to_sheet([
        analytics,
        forecast,
      ])

    const workbook =
      XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Executive',
    )

    const excelBuffer =
      XLSX.write(
        workbook,
        {
          bookType: 'xlsx',
          type: 'array',
        },
      )

    const fileData =
      new Blob(
        [excelBuffer],
        {
          type:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
        },
      )

    saveAs(
      fileData,
      'executive-report.xlsx',
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  if (
    !analytics ||
    !forecast
  ) {
    return (
      <div className="text-white">
        Loading...
      </div>
    )
  }

  return (
    <div id="executive-report">
      <h1 className="text-3xl font-bold mb-8">
        Executive Dashboard
      </h1>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={exportPdf}
          className="
            bg-cyan-500
            hover:bg-cyan-600
            px-6 py-3
            rounded-xl
            font-semibold
          "
        >
          Export PDF
        </button>

        <button
          onClick={exportExcel}
          className="
            bg-green-500
            hover:bg-green-600
            px-6 py-3
            rounded-xl
            font-semibold
          "
        >
          Export Excel
        </button>
      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-sm">
            Total
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              analytics.total
            }
          </p>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
          <p className="text-green-400 text-sm">
            Installed
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              analytics.installed
            }
          </p>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6">
          <p className="text-purple-400 text-sm">
            Delivered
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              analytics.delivered
            }
          </p>
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6">
          <p className="text-yellow-400 text-sm">
            Stock
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              analytics.stock
            }
          </p>
        </div>

        <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-2xl p-6">
          <p className="text-cyan-400 text-sm">
            Progress
          </p>

          <p className="text-4xl font-bold mt-2">
            {
              analytics.progress
            }
            %
          </p>
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-6">
          AI Forecast
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">
              Remaining
            </p>

            <p className="text-4xl font-bold mt-2">
              {
                forecast.remaining
              }
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">
              Daily Install Rate
            </p>

            <p className="text-4xl font-bold mt-2">
              10
            </p>
          </div>

          <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-6">
            <p className="text-cyan-400 text-sm">
              Estimated Completion
            </p>

            <p className="text-4xl font-bold mt-2">
              {
                forecast.estimatedDays
              }
              d
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}