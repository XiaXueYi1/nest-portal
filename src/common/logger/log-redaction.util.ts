const SENSITIVE_KEYWORDS = ['password', 'token', 'cookie', 'authorization', 'secret']

const MASK = '[REDACTED]'

const isSensitiveKey = (key: string): boolean => {
  const normalizedKey = key.trim().toLowerCase()
  return SENSITIVE_KEYWORDS.some((keyword) => normalizedKey.includes(keyword))
}

export const redactSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? MASK : redactSensitive(val)
  }
  return result
}
