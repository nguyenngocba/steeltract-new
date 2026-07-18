import { useState } from 'react'
import toast from 'react-hot-toast'

import {
  EnterpriseField,
  EnterpriseFormGrid,
  EnterpriseFormSection,
  EnterpriseModalForm,
  EnterpriseNumberField,
} from '@/shared/forms'
import { formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

import type { ProductionMaterialIssue } from '../api/production.api'
import {
  useConsumeProductionMaterial,
  useReturnProductionMaterialIssue,
} from '../hooks/useProductionCockpit'

export type ProductionConsumptionTarget = {
  productionOrderId: string
  orderNo: string
  material: string
  inventoryItemId: string
  remainingQty: number
  unit?: string
}

export function ProductionMaterialReturnModal({
  issue,
  returnableQty,
  onClose,
}: {
  issue: ProductionMaterialIssue
  returnableQty: number
  onClose: () => void
}) {
  const returnIssue = useReturnProductionMaterialIssue()
  const [quantity, setQuantity] = useState(formatQuantity(returnableQty))
  const [validationError, setValidationError] = useState('')
  const materialLabel = issue.inventoryItem
    ? `${issue.inventoryItem.code} · ${issue.inventoryItem.name}`
    : issue.inventoryItemId

  async function submit() {
    const parsedQuantity = parseLocaleNumber(quantity)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || parsedQuantity > returnableQty) {
      setValidationError(`Số lượng hoàn trả phải lớn hơn 0 và không vượt quá ${formatQuantity(returnableQty)}.`)
      return
    }
    setValidationError('')
    try {
      await returnIssue.mutateAsync({
        id: issue.id,
        payload: {
          quantity: parsedQuantity,
          remarks: `Return unused production material to Main Warehouse from ${issue.issueNo}`,
        },
      })
      toast.success('Đã hoàn trả vật tư dư về Kho chính')
      onClose()
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      const message = Array.isArray(raw) ? raw.join(', ') : raw || ''
      toast.error(
        message.includes('Insufficient stock')
          ? 'Không còn vật tư dư hợp lệ để hoàn trả. Vui lòng tải lại dữ liệu phiếu cấp.'
          : message || 'Không thể hoàn trả vật tư',
      )
    }
  }

  return (
    <EnterpriseModalForm
      open
      title="Hoàn trả vật tư sản xuất"
      description={`${issue.issueNo} · ${materialLabel}`}
      onClose={onClose}
      onSubmit={(event) => { event.preventDefault(); void submit() }}
      submitLabel="Xác nhận hoàn trả"
      pendingLabel="Đang hoàn trả..."
      pending={returnIssue.isPending}
      maxWidthClass="max-w-xl"
    >
      <EnterpriseFormSection title="Số lượng hoàn trả" description="Vật tư được trả về Kho chính theo phiếu cấp hiện tại.">
        <EnterpriseFormGrid columns={1}>
          <EnterpriseField
            label={`Số lượng (tối đa ${formatQuantity(returnableQty)} ${issue.inventoryItem?.unit ?? ''})`}
            required
            htmlFor="production-return-quantity"
            error={validationError}
          >
            <EnterpriseNumberField
              id="production-return-quantity"
              data-autofocus
              value={quantity}
              onFocus={(event) => setQuantity(formatQuantityInput(event.target.value))}
              onBlur={(event) => setQuantity(formatQuantity(event.target.value))}
              onChange={(event) => { setQuantity(formatQuantityInput(event.target.value)); setValidationError('') }}
            />
          </EnterpriseField>
        </EnterpriseFormGrid>
      </EnterpriseFormSection>
    </EnterpriseModalForm>
  )
}

export function ProductionConsumptionModal({
  target,
  onClose,
}: {
  target: ProductionConsumptionTarget
  onClose: () => void
}) {
  const consume = useConsumeProductionMaterial()
  const [consumedQty, setConsumedQty] = useState(formatQuantity(target.remainingQty))
  const [scrapQty, setScrapQty] = useState('0')
  const [validationError, setValidationError] = useState('')

  async function submit() {
    const consumed = parseLocaleNumber(consumedQty)
    const scrap = parseLocaleNumber(scrapQty)
    if (!Number.isFinite(consumed) || !Number.isFinite(scrap) || consumed < 0 || scrap < 0 || consumed + scrap <= 0) {
      setValidationError('Số lượng tiêu hao hoặc scrap không hợp lệ.')
      return
    }
    setValidationError('')
    try {
      await consume.mutateAsync({
        id: target.productionOrderId,
        payload: {
          inventoryItemId: target.inventoryItemId,
          consumedQty: consumed,
          scrapQty: scrap,
          remark: `Consume from Production Cockpit for ${target.orderNo}`,
        },
      })
      toast.success('Đã ghi nhận tiêu hao vật tư sản xuất')
      onClose()
    } catch (error) {
      const raw = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      toast.error(Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể ghi nhận tiêu hao')
    }
  }

  return (
    <EnterpriseModalForm
      open
      title="Ghi nhận tiêu hao vật tư"
      description={`${target.orderNo} · ${target.material}`}
      onClose={onClose}
      onSubmit={(event) => { event.preventDefault(); void submit() }}
      submitLabel="Ghi nhận tiêu hao"
      pendingLabel="Đang ghi nhận..."
      pending={consume.isPending}
      maxWidthClass="max-w-xl"
    >
      <EnterpriseFormSection
        title="Phân bổ vật tư"
        description={`Số lượng còn lại: ${formatQuantity(target.remainingQty)} ${target.unit ?? ''}.`}
      >
        <EnterpriseFormGrid>
          <EnterpriseField label="Tiêu hao" required htmlFor="production-consumed-quantity">
            <EnterpriseNumberField
              id="production-consumed-quantity"
              data-autofocus
              value={consumedQty}
              onFocus={(event) => setConsumedQty(formatQuantityInput(event.target.value))}
              onBlur={(event) => setConsumedQty(formatQuantity(event.target.value))}
              onChange={(event) => { setConsumedQty(formatQuantityInput(event.target.value)); setValidationError('') }}
            />
          </EnterpriseField>
          <EnterpriseField label="Scrap" required htmlFor="production-scrap-quantity">
            <EnterpriseNumberField
              id="production-scrap-quantity"
              value={scrapQty}
              onFocus={(event) => setScrapQty(formatQuantityInput(event.target.value))}
              onBlur={(event) => setScrapQty(formatQuantity(event.target.value))}
              onChange={(event) => { setScrapQty(formatQuantityInput(event.target.value)); setValidationError('') }}
            />
          </EnterpriseField>
        </EnterpriseFormGrid>
        {validationError ? <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{validationError}</p> : null}
      </EnterpriseFormSection>
    </EnterpriseModalForm>
  )
}
