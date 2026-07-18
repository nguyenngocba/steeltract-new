const DEFAULT_MAX_ERROR_LENGTH = 2_000;

export function safeErrorMessage(
  error: unknown,
  maxLength = DEFAULT_MAX_ERROR_LENGTH,
) {
  const limit = Math.max(32, Math.floor(maxLength));
  const message = extractErrorMessage(error).trim() || 'Unknown error';

  if (message.length <= limit) {
    return message;
  }

  return `${message.slice(0, limit - 3)}...`;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }
    if (typeof record.code === 'string' || typeof record.code === 'number') {
      return `Error code ${String(record.code)}`;
    }
  }

  return 'Unknown error';
}
