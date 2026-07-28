import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  EnterpriseDatePicker,
  EnterpriseField,
  EnterpriseFormGrid,
  EnterpriseFormSection,
  EnterpriseModalForm,
  EnterpriseNumberField,
  EnterpriseSelect,
} from '@/shared/forms'
import { formatLocalDateTimeInput } from '@/shared/utils/date-time'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

import type { ProductionBom, ProductionComponent } from '../api/production.api'
import { useCreateCanonicalProductionOrder, useProjectComponentRequirements } from '../hooks/useProductionCockpit'

export function ManufacturingOrderModal({ initialComponentId = '', onClose }: {
  components?: ProductionComponent[]
  boms?: ProductionBom[]
  initialComponentId?: string
  onClose: () => void
}) {
  const create = useCreateCanonicalProductionOrder()
  const { data: requirementsReadModel, isLoading } = useProjectComponentRequirements({ limit: 100 }, true)
  const requirements = requirementsReadModel?.data ?? []
  const [projectId, setProjectId] = useState('')
  const [requirementId, setRequirementId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [start, setStart] = useState(formatLocalDateTimeInput())
  const [due, setDue] = useState('')
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState('')
  const projects = useMemo(() => {
    const unique = new Map<string, { id: string; code: string; name: string }>()
    for (const requirement of requirements) {
      if (requirement.project) unique.set(requirement.project.id, requirement.project)
    }
    return Array.from(unique.values()).sort((left, right) => left.code.localeCompare(right.code))
  }, [requirements])
  const filteredRequirements = requirements.filter((item) =>
    (!projectId || item.projectId === projectId) &&
    (!initialComponentId || item.componentId === initialComponentId),
  )
  const selectedRequirement = filteredRequirements.find((item) => item.id === requirementId)
  const allocatedQuantity = selectedRequirement?.productionOrders
    ?.filter((order) => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum + Number(order.quantity ?? 0), 0) ?? 0
  const remainingQuantity = Math.max(0, Number(selectedRequirement?.requiredQuantity ?? 0) - allocatedQuantity)
  const parsedQuantity = parseLocaleNumber(quantity)
  const hasReleasedEngineeringBasis = Boolean(
    selectedRequirement?.component?.lifecycleState === 'ACTIVE' &&
    selectedRequirement?.componentRevision?.state === 'RELEASED' &&
    selectedRequirement?.componentRevisionId &&
    selectedRequirement?.bomDefinitionId &&
    selectedRequirement?.bomDefinition?.state === 'RELEASED' &&
    selectedRequirement?.bomDefinition?.contentHash,
  )

  async function submit() {
    if (!selectedRequirement) {
      setValidationError('Chọn yêu cầu cấu kiện của công trình trước khi tạo lệnh.')
      return
    }
    if (!hasReleasedEngineeringBasis) {
      setValidationError('Yêu cầu này chưa có Component Revision/BOM đã phát hành nên chưa thể tạo lệnh sản xuất.')
      return
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setValidationError('Số lượng sản xuất phải là số nguyên lớn hơn 0.')
      return
    }
    if (parsedQuantity > remainingQuantity) {
      setValidationError(`Số lượng sản xuất vượt quá số lượng còn lại (${formatQuantity(remainingQuantity, 0)}).`)
      return
    }
    setValidationError('')
    const orderNo = nextLocalCode('MO')
    try {
      await create.mutateAsync({
        orderNo,
        title: `Sản xuất ${selectedRequirement.component?.name ?? selectedRequirement.requirementNo}`,
        description: note || undefined,
        projectId: selectedRequirement.projectId,
        componentRequirementId: selectedRequirement.id,
        quantity: parsedQuantity,
        unit: 'cấu kiện',
        plannedStartAt: start ? new Date(start).toISOString() : undefined,
        plannedEndAt: due ? new Date(due).toISOString() : undefined,
        engineeringBasis: {
          componentId: selectedRequirement.componentId,
          componentRevisionId: selectedRequirement.componentRevisionId!,
          bomDefinitionId: selectedRequirement.bomDefinitionId!,
          contentHash: selectedRequirement.bomDefinition!.contentHash!,
          verifiedAt: new Date().toISOString(),
        },
      })
      toast.success(`Đã tạo ${orderNo} từ yêu cầu ${selectedRequirement.requirementNo}`)
      onClose()
    } catch {
      toast.error('Không thể tạo lệnh sản xuất')
    }
  }

  return (
    <EnterpriseModalForm
      open
      title="Tạo lệnh sản xuất từ yêu cầu"
      description="Lệnh sản xuất phải bắt đầu từ ProjectComponentRequirement đã có Engineering Revision/BOM phát hành."
      onClose={onClose}
      onSubmit={(event) => { event.preventDefault(); void submit() }}
      submitLabel="Tạo lệnh sản xuất"
      pendingLabel="Đang tạo lệnh..."
      pending={create.isPending}
      maxWidthClass="max-w-3xl"
    >
      <EnterpriseFormSection title="Yêu cầu công trình" description="Chọn nhu cầu dự án trước, sau đó nhập số lượng đưa vào sản xuất.">
        <EnterpriseFormGrid>
          <EnterpriseField label="Công trình / Dự án" required htmlFor="production-project">
            <EnterpriseSelect id="production-project" data-autofocus value={projectId} onChange={(event) => { setProjectId(event.target.value); setRequirementId(''); setValidationError('') }}>
              <option value="">Tất cả công trình</option>
              {projects.map((item) => <option value={item.id} key={item.id}>{item.code} - {item.name}</option>)}
            </EnterpriseSelect>
          </EnterpriseField>
          <EnterpriseField label="Yêu cầu cấu kiện" required htmlFor="production-requirement">
            <EnterpriseSelect id="production-requirement" value={requirementId} onChange={(event) => { setRequirementId(event.target.value); setValidationError('') }}>
              <option value="">{isLoading ? 'Đang tải yêu cầu...' : 'Chọn yêu cầu'}</option>
              {filteredRequirements.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.requirementNo} · {item.component?.code ?? '-'} · {item.component?.name ?? '-'}
                </option>
              ))}
            </EnterpriseSelect>
          </EnterpriseField>
          <EnterpriseField label="Số lượng sản xuất" required htmlFor="production-quantity">
            <EnterpriseNumberField id="production-quantity" value={quantity} onFocus={(event) => setQuantity(formatQuantityInput(event.target.value))} onBlur={(event) => setQuantity(formatQuantity(event.target.value))} onChange={(event) => { setQuantity(formatQuantityInput(event.target.value)); setValidationError('') }} />
          </EnterpriseField>
          <EnterpriseField label="Ngày bắt đầu" htmlFor="production-start">
            <EnterpriseDatePicker id="production-start" value={start} onFocus={() => setStart(formatLocalDateTimeInput())} onChange={(event) => setStart(event.target.value)} />
          </EnterpriseField>
          <EnterpriseField label="Ngày đến hạn" htmlFor="production-due">
            <EnterpriseDatePicker id="production-due" value={due} onFocus={() => setDue(formatLocalDateTimeInput())} onChange={(event) => setDue(event.target.value)} />
          </EnterpriseField>
          <EnterpriseField label="Ghi chú" htmlFor="production-note">
            <textarea id="production-note" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-[74px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" />
          </EnterpriseField>
        </EnterpriseFormGrid>
        {validationError ? <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{validationError}</p> : null}
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Tóm tắt canonical">
        {!selectedRequirement ? <p className="text-xs text-slate-500">Chọn yêu cầu để xem Engineering basis và số lượng còn lại.</p> : <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Cấu kiện</span><b className="text-cyan-200">{selectedRequirement.component?.code} · {selectedRequirement.component?.name}</b></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Công trình</span><b>{selectedRequirement.project?.code} - {selectedRequirement.project?.name}</b></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Revision</span><b>{selectedRequirement.componentRevision?.revisionNo ?? '-'}</b></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Engineering status</span><b className={hasReleasedEngineeringBasis ? 'text-emerald-300' : 'text-amber-300'}>{hasReleasedEngineeringBasis ? 'Đã phát hành' : 'Chưa đủ điều kiện'}</b></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3"><p className="text-slate-500">Yêu cầu</p><b className="mt-1 block text-lg text-white">{formatQuantity(selectedRequirement.requiredQuantity, 0)}</b></div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3"><p className="text-slate-500">Đã phân bổ</p><b className="mt-1 block text-lg text-cyan-200">{formatQuantity(allocatedQuantity, 0)}</b></div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3"><p className="text-slate-500">Còn lại</p><b className="mt-1 block text-lg text-emerald-300">{formatQuantity(remainingQuantity, 0)}</b></div>
          </div>
          {!hasReleasedEngineeringBasis ? <p className="md:col-span-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Cần Component ACTIVE, revision RELEASED và BOM RELEASED có content hash trước khi tạo Production Order.</p> : null}
        </div>}
      </EnterpriseFormSection>
    </EnterpriseModalForm>
  )
}
