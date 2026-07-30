import { AxiosError } from 'axios'

type ApiIssue = {
  path?: Array<string | number>
  message?: string
  code?: string
  minimum?: number
}

type ApiErrorBody = {
  message?: string
  errors?: ApiIssue[]
}

const fieldLabels: Record<string, string> = {
  username: 'Tên đăng nhập',
  password: 'Mật khẩu',
  email: 'Email',
  roleIds: 'Vai trò',
  fullName: 'Tên hiển thị',
  code: 'Mã',
  name: 'Tên',
}

const businessMessages: Record<string, string> = {
  'Username already exists': 'Tên đăng nhập đã tồn tại.',
  'Email already exists': 'Email đã tồn tại.',
  'One or more roles do not exist': 'Vai trò được chọn không tồn tại.',
  'User not found': 'Không tìm thấy người dùng.',
  'A conversion factor requires a base unit.': 'Hệ số quy đổi cần có đơn vị cơ sở.',
  'A unit cannot convert to itself.': 'Đơn vị không thể quy đổi sang chính nó.',
  'Base unit not found': 'Không tìm thấy đơn vị cơ sở.',
  'Base unit must use the same category.': 'Đơn vị cơ sở phải cùng loại.',
  'Base unit is inactive.': 'Đơn vị cơ sở đang ngưng sử dụng.',
}

function issueMessage(issue: ApiIssue) {
  const field = issue.path?.[0] == null ? 'Trường dữ liệu' : String(issue.path[0])
  const label = fieldLabels[field] ?? field

  if (issue.code === 'too_small' && typeof issue.minimum === 'number') {
    if (field === 'roleIds') return 'Vui lòng chọn ít nhất một vai trò.'
    return `${label} phải có ít nhất ${issue.minimum} ký tự.`
  }

  if (issue.code === 'invalid_format' && field === 'email') {
    return 'Email không đúng định dạng.'
  }

  if (issue.message) return `${label}: ${issue.message}`
  return `${label} không hợp lệ.`
}

export function apiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined
    const firstIssue = data?.errors?.[0]

    if (firstIssue) {
      return issueMessage(firstIssue)
    }

    if (data?.message && businessMessages[data.message]) {
      return businessMessages[data.message]
    }

    if (typeof data?.message === 'string' && data.message !== 'Validation failed') {
      return data.message
    }

    if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
    if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.'
  }

  if (error instanceof Error && !error.message.includes('status code')) {
    return error.message
  }

  return 'Không thực hiện được thao tác. Vui lòng kiểm tra dữ liệu và thử lại.'
}
