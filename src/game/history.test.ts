import { beforeEach, describe, expect, it } from 'vitest'
import { RUN_HISTORY_KEY, readRunHistory, recordRun } from './history'

describe('local run history', () => {
  beforeEach(() => localStorage.clear())

  it('stores final outcome with mode, seed, generator version, and completion time', () => {
    const record = recordRun({ mode: 'sheep', seed: 123, generatorVersion: 1, result: 'lost', finishedAt: '2026-11-12T00:00:00.000Z' })
    expect(record).toEqual({ mode: 'sheep', seed: 123, generatorVersion: 1, result: 'lost', finishedAt: '2026-11-12T00:00:00.000Z' })
    expect(readRunHistory()).toEqual([record])
    expect(JSON.parse(localStorage.getItem(RUN_HISTORY_KEY) ?? '[]')).toEqual([record])
  })

  it('keeps previously recorded runs', () => {
    recordRun({ mode: 'basic', seed: 1, generatorVersion: 1, result: 'won', finishedAt: '2026-11-11T00:00:00.000Z' })
    recordRun({ mode: 'basic', seed: 2, generatorVersion: 1, result: 'lost', finishedAt: '2026-11-12T00:00:00.000Z' })
    expect(readRunHistory()).toHaveLength(2)
  })

  it('persists a second-level layout and reads legacy records without one', () => {
    const legacy = { mode: 'sheep', seed: 8, generatorVersion: 1, result: 'won', finishedAt: '2026-11-10T00:00:00.000Z' }
    localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify([legacy]))
    expect(readRunHistory()).toEqual([legacy])
    const record = recordRun({ mode: 'sheep', layout: 'inverted-pyramid', seed: 9, generatorVersion: 2, result: 'lost', finishedAt: '2026-11-12T00:00:00.000Z' })
    expect(record.layout).toBe('inverted-pyramid')
    expect(readRunHistory()).toEqual([legacy, record])
  })
})
