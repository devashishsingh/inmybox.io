// INMYBOX ENHANCEMENT — Phase 5: Structured logging utility
// Zero-dependency, structured JSON logging with request context.
// Replaces raw console.error(tag, err) pattern across the codebase.

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  requestId?: string
  [key: string]: unknown
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

function createLogger(module: string, requestId?: string) {
  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      ...(requestId && { requestId }),
      ...meta,
    }
    const formatted = formatEntry(entry)
    if (level === 'error') console.error(formatted)
    else if (level === 'warn') console.warn(formatted)
    else console.log(formatted)
  }

  return {
    info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
    error: (message: string, err?: unknown, meta?: Record<string, unknown>) =>
      log('error', message, { error: safeErrorMessage(err), ...meta }),
  }
}

export { createLogger, safeErrorMessage }
