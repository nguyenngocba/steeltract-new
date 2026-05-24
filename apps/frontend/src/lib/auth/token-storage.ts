const ACCESS_TOKEN_KEY =
  'steeltrack.accessToken'
const REFRESH_TOKEN_KEY =
  'steeltrack.refreshToken'
const LEGACY_TOKEN_KEY = 'token'

export function getAccessToken() {
  return (
    localStorage.getItem(
      ACCESS_TOKEN_KEY,
    ) ||
    localStorage.getItem(
      LEGACY_TOKEN_KEY,
    )
  )
}

export function getRefreshToken() {
  return localStorage.getItem(
    REFRESH_TOKEN_KEY,
  )
}

export function setTokens(tokens: {
  accessToken: string
  refreshToken: string
}) {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    tokens.accessToken,
  )
  localStorage.setItem(
    LEGACY_TOKEN_KEY,
    tokens.accessToken,
  )
  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    tokens.refreshToken,
  )
}

export function clearTokens() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  )
  localStorage.removeItem(
    LEGACY_TOKEN_KEY,
  )
  localStorage.removeItem(
    REFRESH_TOKEN_KEY,
  )
}
