import { BadRequestException } from '@nestjs/common'
import { DateRangeQueryDto } from '@/common/dto/date-range-query.dto'

const DAY_MS = 24 * 60 * 60 * 1000

export interface StatsDateRange {
  start: Date
  end: Date
  endExclusive: Date
  startDate: string
  endDate: string
  dates: string[]
}

export interface DailyCount {
  date: string
  count: number
}

export function resolveStatsDateRange(query: DateRangeQueryDto): StatsDateRange {
  const defaultEnd = addDays(startOfDay(new Date()), -1)
  const end = query.endDate ? parseDate(query.endDate, 'endDate') : defaultEnd
  const start = query.startDate ? parseDate(query.startDate, 'startDate') : addDays(end, -6)

  if (start > end) {
    throw new BadRequestException('startDate must be before or equal to endDate')
  }

  const dates = eachDate(start, end)

  return {
    start,
    end,
    endExclusive: addDays(end, 1),
    startDate: formatDate(start),
    endDate: formatDate(end),
    dates,
  }
}

export function buildDailyCounts(range: StatsDateRange, values: Date[]): DailyCount[] {
  const counts = new Map(range.dates.map((date) => [date, 0]))

  values.forEach((value) => {
    const date = formatDate(value)
    if (counts.has(date)) {
      counts.set(date, (counts.get(date) ?? 0) + 1)
    }
  })

  return range.dates.map((date) => ({ date, count: counts.get(date) ?? 0 }))
}

function parseDate(value: string, fieldName: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new BadRequestException(`${fieldName} must be a valid date`)
  }

  return date
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS)
}

function eachDate(start: Date, end: Date): string[] {
  const dates: string[] = []
  for (let current = start; current <= end; current = addDays(current, 1)) {
    dates.push(formatDate(current))
  }
  return dates
}

function formatDate(value: Date): string {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
