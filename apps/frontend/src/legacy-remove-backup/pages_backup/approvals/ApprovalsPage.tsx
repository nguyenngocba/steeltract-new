import {
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import { api } from '../../lib/api'

export function ApprovalsPage() {
  const [approvals,
    setApprovals] =
    useState<any[]>([])

  async function loadData() {
    const response =
      await api.get(
        '/approvals',
      )

    setApprovals(
      response.data,
    )
  }

  async function approve(
    id: string,
  ) {
    await api.patch(
      `/approvals/${id}/approve`,
      {
        approver:
          'Administrator',
      },
    )

    toast.success(
      'Approved',
    )

    loadData()
  }

  async function reject(
    id: string,
  ) {
    await api.patch(
      `/approvals/${id}/reject`,
      {
        approver:
          'Administrator',
      },
    )

    toast.success(
      'Rejected',
    )

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Approval Workflow
      </h1>

      <div className="space-y-4">
        {approvals.map(
          (approval) => (
            <div
              key={
                approval.id
              }
              className="
                bg-zinc-900
                border border-zinc-800
                rounded-2xl
                p-6
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold">
                    {
                      approval.module
                    }
                  </p>

                  <p className="text-zinc-400 mt-2">
                    Ref:
                    {' '}
                    {
                      approval.referenceId
                    }
                  </p>
                </div>

                <div
                  className={`
                    px-4 py-2 rounded-xl border
                    ${
                      approval.status ===
                      'APPROVED'
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : approval.status ===
                            'REJECTED'
                          ? 'bg-red-500/20 border-red-500/30 text-red-400'
                          : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                    }
                  `}
                >
                  {
                    approval.status
                  }
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-zinc-400 text-sm">
                    Requester
                  </p>

                  <p className="font-semibold">
                    {
                      approval.requester
                    }
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400 text-sm">
                    Approver
                  </p>

                  <p className="font-semibold">
                    {
                      approval.approver ||
                      '-'
                    }
                  </p>
                </div>
              </div>

              {approval.note && (
                <div className="mt-6 bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-300">
                    {
                      approval.note
                    }
                  </p>
                </div>
              )}

              {approval.status ===
                'PENDING' && (
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() =>
                      approve(
                        approval.id,
                      )
                    }
                    className="
                      bg-green-500
                      hover:bg-green-600
                      px-4 py-2
                      rounded-xl
                    "
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      reject(
                        approval.id,
                      )
                    }
                    className="
                      bg-red-500
                      hover:bg-red-600
                      px-4 py-2
                      rounded-xl
                    "
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
