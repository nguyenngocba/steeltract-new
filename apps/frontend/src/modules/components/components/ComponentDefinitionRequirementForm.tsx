import {
  EnterpriseAssistantPanel,
  EnterpriseDatePicker,
  EnterpriseField,
  EnterpriseFormGrid,
  EnterpriseFormSection,
  EnterpriseInput,
  EnterpriseNumberField,
  EnterpriseOperationalFormLayout,
  EnterpriseSelect,
  EnterpriseSuggestionButton,
  EnterpriseSummaryPanel,
} from '@/shared/forms'

type ProjectOption = {
  id: string
  code?: string
  name: string
}

type ComponentSuggestionSource = {
  id?: string
  code?: string
  name?: string
  componentType?: string | null
  type?: string | null
  profile?: string | null
  projectId?: string | null
  project?: string | ProjectOption | null
  projectRef?: ProjectOption | null
  requiredQuantity?: number | null
}

export type ComponentDefinitionFormState = {
  name: string
  type: string
  profile: string
  projectId: string
  qty: string
  requiredBy: string
  note: string
}

export function ComponentDefinitionRequirementForm({
  form,
  projects,
  components,
  onChange,
}: {
  form: ComponentDefinitionFormState
  projects: ProjectOption[]
  components: ComponentSuggestionSource[]
  onChange: (patch: Partial<ComponentDefinitionFormState>) => void
}) {
  const selectedProject = projects.find((item) => item.id === form.projectId)
  const typeOptions = unique(
    components.map((row) => row.componentType ?? row.type).filter(Boolean).map(String),
  )
  const profileOptions = unique(
    components.map((row) => row.profile).filter(Boolean).map(String),
  )
  const projectComponents = form.projectId
    ? components.filter((row) => row.projectId === form.projectId || readProjectId(row.project) === form.projectId || row.projectRef?.id === form.projectId)
    : []
  const similarComponents = components
    .filter((row) => {
      const type = String(row.componentType ?? row.type ?? '')
      const profile = String(row.profile ?? '')
      return Boolean(row.code && row.name) && (
        (form.type && type === form.type) ||
        (form.profile && profile === form.profile) ||
        (form.projectId && (row.projectId === form.projectId || row.projectRef?.id === form.projectId))
      )
    })
    .slice(0, 4)

  return (
    <EnterpriseOperationalFormLayout
      primary={(
        <>
          <EnterpriseFormSection title="Thông tin công trình" description="Chọn công trình tạo nhu cầu. Quan hệ này được lưu vào ProjectComponentRequirement.">
            <EnterpriseFormGrid columns={1}>
              <EnterpriseField label="Công trình / Dự án" required htmlFor="component-project">
                <EnterpriseSelect
                  id="component-project"
                  data-autofocus
                  value={form.projectId}
                  onChange={(event) => onChange({ projectId: event.target.value })}
                >
                  <option value="">Chọn công trình / dự án</option>
                  {projects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ?? item.name} - {item.name}
                    </option>
                  ))}
                </EnterpriseSelect>
              </EnterpriseField>
            </EnterpriseFormGrid>
          </EnterpriseFormSection>

          <EnterpriseFormSection title="Thông tin cấu kiện" description="Hồ sơ cấu kiện là định nghĩa kỹ thuật, chưa phải tồn kho vật lý.">
            <EnterpriseFormGrid>
              <EnterpriseField label="Tên cấu kiện" required htmlFor="component-name" className="md:col-span-2">
                <EnterpriseInput
                  id="component-name"
                  value={form.name}
                  onChange={(event) => onChange({ name: event.target.value })}
                  placeholder="Nhập tên hồ sơ cấu kiện"
                />
              </EnterpriseField>
              <EnterpriseField label="Loại cấu kiện" required htmlFor="component-type">
                <EnterpriseInput
                  id="component-type"
                  list="component-definition-type-options"
                  value={form.type}
                  onChange={(event) => onChange({ type: event.target.value })}
                  placeholder="Chọn hoặc nhập loại"
                />
                <datalist id="component-definition-type-options">
                  {typeOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
              </EnterpriseField>
              <EnterpriseField label="Profile / Kích thước" htmlFor="component-profile">
                <EnterpriseInput
                  id="component-profile"
                  list="component-definition-profile-options"
                  value={form.profile}
                  onChange={(event) => onChange({ profile: event.target.value })}
                  placeholder="Theo bản vẽ / catalog"
                />
                <datalist id="component-definition-profile-options">
                  {profileOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
              </EnterpriseField>
              <EnterpriseField label="Mã cấu kiện" htmlFor="component-code">
                <EnterpriseInput id="component-code" value="Backend tự sinh mã ổn định" readOnly />
              </EnterpriseField>
              <EnterpriseField label="Số lượng yêu cầu" required htmlFor="component-quantity">
                <EnterpriseNumberField
                  id="component-quantity"
                  value={form.qty}
                  onChange={(event) => onChange({ qty: event.target.value })}
                  placeholder="Nhập số lượng"
                />
              </EnterpriseField>
              <EnterpriseField label="Ngày yêu cầu / kế hoạch" htmlFor="component-required-by">
                <EnterpriseDatePicker
                  id="component-required-by"
                  value={form.requiredBy}
                  onChange={(event) => onChange({ requiredBy: event.target.value })}
                />
              </EnterpriseField>
              <EnterpriseField label="Ghi chú" htmlFor="component-note" className="md:col-span-2">
                <EnterpriseInput
                  id="component-note"
                  value={form.note}
                  onChange={(event) => onChange({ note: event.target.value })}
                  placeholder="Ghi chú kỹ thuật hoặc yêu cầu công trình"
                />
              </EnterpriseField>
            </EnterpriseFormGrid>
          </EnterpriseFormSection>
        </>
      )}
      assistant={(
        <>
          <EnterpriseAssistantPanel title="Gợi ý hồ sơ" description="Dữ liệu lấy từ hồ sơ cấu kiện và yêu cầu công trình hiện có.">
            <div className="space-y-2">
              {similarComponents.length ? similarComponents.map((item) => {
                const type = String(item.componentType ?? item.type ?? '')
                const profile = String(item.profile ?? '')
                return (
                  <EnterpriseSuggestionButton
                    key={item.id ?? `${item.code}-${type}-${profile}`}
                    onClick={() => onChange({ type, profile })}
                  >
                    <span className="block font-semibold text-cyan-200">{item.code ?? 'Hồ sơ tương tự'} · {item.name ?? '-'}</span>
                    <span className="mt-1 block text-slate-400">{[type, profile].filter(Boolean).join(' · ') || 'Chưa có type/profile'}</span>
                    <span className="mt-1 block text-slate-500">Áp dụng loại/profile, không sao chép lifecycle, BOM, tồn kho hoặc lệnh sản xuất.</span>
                  </EnterpriseSuggestionButton>
                )
              }) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-500">Chưa có dữ liệu gợi ý phù hợp.</p>
              )}
            </div>
          </EnterpriseAssistantPanel>

          <EnterpriseAssistantPanel title="Ngữ cảnh công trình">
            <div className="space-y-2">
              <MiniFact label="Công trình" value={selectedProject ? `${selectedProject.code ?? selectedProject.name} - ${selectedProject.name}` : 'Chưa chọn'} />
              <MiniFact label="Hồ sơ đã có trong công trình" value={String(projectComponents.length)} />
              <MiniFact label="Loại đã dùng gần đây" value={typeOptions.slice(0, 3).join(', ') || 'Chưa có'} />
              <MiniFact label="Profile đã dùng gần đây" value={profileOptions.slice(0, 3).join(', ') || 'Chưa có'} />
            </div>
          </EnterpriseAssistantPanel>
        </>
      )}
      summary={(
        <EnterpriseSummaryPanel>
          <div className="grid gap-2 md:grid-cols-4">
            <span>Công trình: {selectedProject?.name ?? 'Chưa chọn'}</span>
            <span>Hồ sơ: {form.name.trim() || 'Chưa nhập'}</span>
            <span>Loại/Profile: {[form.type, form.profile].filter(Boolean).join(' · ') || 'Chưa nhập'}</span>
            <span>Số lượng yêu cầu: {form.qty || '0'}</span>
          </div>
          <p className="mt-2 text-cyan-200/80">
            Tạo Component Definition trạng thái Draft và ProjectComponentRequirement. Không tạo tồn kho,
            ComponentInstance hoặc Lệnh sản xuất.
          </p>
        </EnterpriseSummaryPanel>
      )}
    />
  )
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right))
}

function readProjectId(project: ComponentSuggestionSource['project']) {
  return typeof project === 'object' && project ? project.id : undefined
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <b className="text-right font-medium text-slate-200">{value}</b>
    </div>
  )
}
