import { describe, expect, it } from 'vitest'
import { grantMockReward } from './rewards'
import { createGameState } from './engine'
import type { Tile } from './types'

const tiles: Tile[] = [
  { id: 'a', type: 'berry', layer: 1, x: 0, y: 0, removed: true },
  { id: 'b', type: 'lemon', layer: 1, x: 1, y: 0, removed: true },
  { id: 'c', type: 'grape', layer: 1, x: 2, y: 0, removed: true },
]

describe('mock reward callback', () => {
  it('does not grant anything when the reward flow is cancelled', () => {
    const state = { ...createGameState('basic', tiles), tools: { undo: 0, store: 1, shuffle: 1 } }
    expect(grantMockReward(state, 'undo', false)).toBe(state)
  })

  it('grants a tool only after successful completion', () => {
    const state = { ...createGameState('basic', tiles), tools: { undo: 0, store: 1, shuffle: 1 } }
    const granted = grantMockReward(state, 'undo', true)
    expect(granted.tools.undo).toBe(1)
    expect(granted.toolAds.undo).toBe(0)
    expect(granted.tray).toEqual(state.tray)
    expect(grantMockReward(granted, 'undo', true)).toBe(granted)
  })

  it('does not grant an exhausted ad slot or change state when the ad is skipped', () => {
    const state = { ...createGameState('basic', tiles), toolAds: { undo: 0, store: 1, shuffle: 1 } }
    expect(grantMockReward(state, 'undo', true)).toBe(state)
    const skipped = grantMockReward(state, 'store', false)
    expect(skipped).toBe(state)
  })

  it('revives a lost game by freeing three tray slots', () => {
    const state = {
      ...createGameState('sheep', tiles),
      tray: ['a', 'b', 'c', 'a', 'b', 'c', 'a'],
      status: 'lost' as const,
    }
    const revived = grantMockReward(state, 'revive', true)
    expect(revived.status).toBe('playing')
    expect(revived.tray).toHaveLength(4)
    expect(revived.tiles.filter((tile) => tile.returned)).toHaveLength(3)
    expect(revived.revive).toBe(0)
  })
})
