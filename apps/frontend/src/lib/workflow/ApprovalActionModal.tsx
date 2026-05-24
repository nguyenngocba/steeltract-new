import { useState } from 'react'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'

import type {
  WorkflowActionPayload,
} from './workflow.types'

type ApprovalAction = 'approve' | 'reject' | 'escalate'

interface ApprovalActionModalProps {
  open: boolean
  action: ApprovalAction
  loading?: boolean
  onClose: () => void
  onSubmit: (
    payload: WorkflowActionPayload,
  ) => void | Promise<void>
}

const actionTitle: Record<ApprovalAction, string> = {
  approve: 'Approve workflow',
  reject: 'Reject workflow',
  escalate: 'Escalate workflow',
}

export function ApprovalActionModal({
  open,
  action,
  loading = false,
  onClose,
  onSubmit,
}: ApprovalActionModalProps) {
  const [comment, setComment] = useState('')

  const handleClose = () => {
    setComment('')
    onClose()
  }

  const handleSubmit = async () => {
    await onSubmit({
      comment: comment.trim() || undefined,
      reason:
        action === 'escalate'
          ? comment.trim() || undefined
          : undefined,
    })
  }

  return (
    <Modal
      open={open}
      title={actionTitle[action]}
      onClose={handleClose}
    >
      <div className="space-y-4">
        <textarea
          value={comment}
          onChange={(event) =>
            setComment(event.target.value)
          }
          rows={4}
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
          placeholder="Comment"
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={
              action === 'reject'
                ? 'danger'
                : 'primary'
            }
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting' : actionTitle[action]}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
