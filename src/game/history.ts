import type { Level2Layout, LevelId } from './types'

export const RUN_HISTORY_KEY = 'sheep-demo.run-history.v1'

export type RunRecord = {
  mode: LevelId
  layout?: Level2Layout
  seed: number
  generatorVersion: number
  result: 'won' | 'lost'
  finishedAt: string
}

export function readRunHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(RUN_HISTORY_KEY)
    const value: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(value) ? value as RunRecord[] : []
  } catch {
    return []
  }
}

export function recordRun(record: RunRecord): RunRecord {
  const history = [...readRunHistory(), record]
  localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(history))
  return record
}
