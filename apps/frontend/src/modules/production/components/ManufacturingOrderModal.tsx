import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  EnterpriseDatePicker,
  EnterpriseAssistantPanel,
  EnterpriseField,
  EnterpriseFormGrid,
  EnterpriseFormSection,
  EnterpriseModalForm,
  EnterpriseNumberField,
  EnterpriseOperationalFormLayout,
  EnterpriseSelect,
  EnterpriseSuggestionButton,
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
      title="Tạo lệnh sản xuất"
      description="Chọn nhu cầu công trình đã có hồ sơ kỹ thuật, revision và BOM phát hành."
      onClose={onClose}
      onSubmit={(event) => { event.preventDefault(); void submit() }}
      submitLabel="Tạo lệnh sản xuất"
      pendingLabel="Đang tạo lệnh..."
      pending={create.isPending}
      maxWidthClass="max-w-5xl"
    >
      <EnterpriseOperationalFormLayout
        primary={(
          <>
      <EnterpriseFormSection title="Công trình / Nhu cầu" description="Lệnh sản xuất bắt đầu từ nhu cầu cấu kiện của dự án, không nhập trực tiếp theo tồn kho.">
        <EnterpriseFormGrid>
          <EnterpriseField label="Công trình / Dự án" required htmlFor="production-project">
            <EnterpriseSelect id="production-project" data-autofocus value={projectId} onChange={(event) => { setProjectId(event.target.value); setRequirementId(''); setValidationError('') }}>
              <option value="">Tất cả công trình</option>
              {projects.map((item) => <option value={item.id} key={item.id}>{item.code} - {item.name}</option>)}
            </EnterpriseSelect>
          </EnterpriseField>
          <EnterpriseField label="Yêu cầu cấu kiện" required htmlFor="production-requirement">
            <EnterpriseSelect id="production-requirement" value={requirementId} onChange={(event) => {
              const next = filteredRequirements.find((item) => item.id === event.target.value)
              const nextAllocated = next?.productionOrders
                ?.filter((order) => order.status !== 'CANCELLED')
                .reduce((sum, order) => sum + Number(order.quantity ?? 0), 0) ?? 0
              const nextRemaining = Math.max(0, Number(next?.requiredQuantity ?? 0) - nextAllocated)
              setRequirementId(event.target.value)
              setQuantity(nextRemaining > 0 ? formatQuantity(nextRemaining, 0) : '1')
              setValidationError('')
            }}>
              <option value="">{isLoading ? 'Đang tải yêu cầu...' : 'Chọn yêu cầu'}</option>
              {filteredRequirements.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.requirementNo} · {item.component?.code ?? '-'} · {item.component?.name ?? '-'}
                </option>
              ))}
            </EnterpriseSelect>
          </EnterpriseField>
        </EnterpriseFormGrid>
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Engineering basis">
        {!selectedRequirement ? <p className="text-xs text-slate-500">Chọn yêu cầu để xem hồ sơ cấu kiện, revision và BOM phát hành.</p> : <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Cấu kiện" value={`${selectedRequirement.component?.code ?? '-'} · ${selectedRequirement.component?.name ?? '-'}`} />
          <InfoRow label="Công trình" value={`${selectedRequirement.project?.code ?? '-'} - ${selectedRequirement.project?.name ?? '-'}`} />
          <InfoRow label="Revision" value={selectedRequirement.componentRevision?.revisionNo ?? '-'} />
          <InfoRow label="BOM" value={selectedRequirement.bomDefinitionId ? 'Đã liên kết' : 'Chưa liên kết'} />
          <div className={`md:col-span-2 rounded-lg border px-3 py-2 text-xs ${hasReleasedEngineeringBasis ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
            {hasReleasedEngineeringBasis ? 'Đủ điều kiện kỹ thuật để tạo lệnh sản xuất.' : 'Cần hồ sơ cấu kiện ACTIVE, revision RELEASED và BOM RELEASED trước khi tạo lệnh sản xuất.'}
          </div>
        </div>}
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Số lượng" description="Số lượng tạo lệnh không được vượt số lượng yêu cầu còn lại.">
        <EnterpriseFormGrid>
          <EnterpriseField label="Số lượng sản xuất" required htmlFor="production-quantity">
            <EnterpriseNumberField id="production-quantity" value={quantity} onFocus={(event) => setQuantity(formatQuantityInput(event.target.value))} onBlur={(event) => setQuantity(formatQuantity(event.target.value))} onChange={(event) => { setQuantity(formatQuantityInput(event.target.value)); setValidationError('') }} />
          </EnterpriseField>
          <InfoCard label="Yêu cầu" value={selectedRequirement ? formatQuantity(selectedRequirement.requiredQuantity, 0) : '-'} />
          <InfoCard label="Đã phân bổ" value={selectedRequirement ? formatQuantity(allocatedQuantity, 0) : '-'} tone="text-cyan-200" />
          <InfoCard label="Còn lại" value={selectedRequirement ? formatQuantity(remainingQuantity, 0) : '-'} tone="text-emerald-300" />
        </EnterpriseFormGrid>
        {selectedRequirement && parsedQuantity > remainingQuantity ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            <span>Vượt nhu cầu còn lại {formatQuantity(parsedQuantity - remainingQuantity, 0)} cấu kiện.</span>
            <button type="button" onClick={() => { setQuantity(formatQuantity(remainingQuantity, 0)); setValidationError('') }} className="font-semibold text-red-100 underline underline-offset-4">
              Dùng số lượng còn lại: {formatQuantity(remainingQuantity, 0)}
            </button>
          </div>
        ) : null}
      </EnterpriseFormSection>

      <EnterpriseFormSection title="Kế hoạch">
        <EnterpriseFormGrid>
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

      <EnterpriseFormSection title="Tổng hợp">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard label="Công trình" value={selectedRequirement?.project?.code ?? '-'} />
          <InfoCard label="Hồ sơ cấu kiện" value={selectedRequirement?.component?.code ?? '-'} tone="text-cyan-200" />
          <InfoCard label="Số lượng tạo lệnh" value={Number.isFinite(parsedQuantity) ? formatQuantity(parsedQuantity, 0) : '-'} tone="text-emerald-300" />
        </div>
      </EnterpriseFormSection>
          </>
        )}
        assistant={(
          <>
            <EnterpriseAssistantPanel title="Readiness nhu cầu" description="Readonly từ ProjectComponentRequirement và Engineering basis.">
              <div className="space-y-2">
                <InfoRow label="Nhu cầu" value={selectedRequirement ? formatQuantity(selectedRequirement.requiredQuantity, 0) : '-'} />
                <InfoRow label="Đã phân bổ" value={selectedRequirement ? formatQuantity(allocatedQuantity, 0) : '-'} />
                <InfoRow label="Còn lại" value={selectedRequirement ? formatQuantity(remainingQuantity, 0) : '-'} />
                <InfoRow label="Revision" value={selectedRequirement?.componentRevision?.revisionNo ?? '-'} />
                <InfoRow label="BOM" value={selectedRequirement?.bomDefinition?.state ?? '-'} />
                <InfoRow label="Routing" value={hasReleasedEngineeringBasis ? 'Sẵn sàng' : 'Chưa đủ điều kiện'} />
              </div>
              {selectedRequirement && remainingQuantity > 0 ? (
                <div className="mt-3">
                  <EnterpriseSuggestionButton onClick={() => { setQuantity(formatQuantity(remainingQuantity, 0)); setValidationError('') }}>
                    <span className="block font-semibold text-cyan-200">Dùng số lượng còn lại</span>
                    <span className="mt-1 block text-slate-400">{formatQuantity(remainingQuantity, 0)} cấu kiện chưa phân bổ.</span>
                  </EnterpriseSuggestionButton>
                </div>
              ) : null}
            </EnterpriseAssistantPanel>
            <EnterpriseAssistantPanel title="Vật tư theo BOM" description="Không suy diễn shortage nếu chưa có read-model authoritative.">
              <div className="space-y-2">
                <InfoRow label="Tổng dòng BOM" value={selectedRequirement?.bomDefinitionId ? 'Có BOM phát hành' : '-'} />
                <InfoRow label="Dòng khả dụng" value="Chưa có dữ liệu gợi ý" />
                <InfoRow label="Dòng thiếu" value="Chưa có dữ liệu gợi ý" />
              </div>
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-500">
                Kiểm tra thiếu vật tư authoritative thuộc reservation/issue. Form không bịa dữ liệu readiness.
              </p>
            </EnterpriseAssistantPanel>
          </>
        )}
      />
    </EnterpriseModalForm>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs"><span className="text-slate-500">{label}</span><b className="text-right text-slate-200">{value}</b></div>
}

function InfoCard({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs"><p className="text-slate-500">{label}</p><b className={`mt-1 block text-lg ${tone}`}>{value}</b></div>
}
