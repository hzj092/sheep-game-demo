import { describe, expect, it } from 'vitest'
import {
  createGameState,
  isTileSelectable,
  storeThreeToBoard,
  reviveGame,
  selectTile,
  shuffleBoard,
  undo,
} from './engine'
import type { GameState, Tile } from './types'

function tile(id: string, type: string, layer = 0, x = 0, y = 0): Tile {
  return { id, type, layer, x, y, removed: false }
}

function stateWith(tiles: Tile[], tray: string[] = []): GameState {
  return { ...createGameState('basic', tiles), tray, history: [], status: 'playing', tools: { undo: 1, store: 1, shuffle: 1 } }
}

describe('seven-slot match-three rules', () => {
  it('adds a selected tile and clears a matching triple', () => {
    let state = stateWith([tile('a', 'berry'), tile('b', 'berry'), tile('c', 'berry')])
    state = selectTile(state, 'a')
    state = selectTile(state, 'b')
    expect(state.tray).toEqual(['a', 'b'])
    state = selectTile(state, 'c')
    expect(state.tray).toEqual([])
    expect(state.tiles.every((card) => card.removed)).toBe(true)
    expect(state.status).toBe('won')
    expect(selectTile(state, 'a')).toBe(state)
  })

  it('rejects a selection when another tile covers it', () => {
    const state = stateWith([tile('under', 'berry'), tile('over', 'lemon', 1)])
    expect(selectTile(state, 'under')).toBe(state)
    expect(selectTile(state, 'over').tray).toEqual(['over'])
  })

  it('treats a fully covered center as blocked even when cached coverage is empty', () => {
    const state = stateWith([
      { ...tile('under', 'berry'), coveredBy: [] },
      { ...tile('over', 'lemon', 1), coveredBy: [] },
    ])
    expect(isTileSelectable(state, 'under')).toBe(false)
    expect(isTileSelectable(state, 'over')).toBe(true)
  })

  it('counts an edge hit as covered and restores selection after the cover is removed', () => {
    const state = { ...stateWith([
      { ...tile('under', 'berry', 0, 0, 0), coveredBy: [] },
      { ...tile('edge', 'lemon', 1, 0.5, 0.55), coveredBy: [] },
      { ...tile('outside', 'grape', 1, 0.501, 0.551), coveredBy: [] },
    ]), layout: 'sheep' as const }
    expect(isTileSelectable(state, 'under')).toBe(false)
    expect(isTileSelectable(state, 'outside')).toBe(true)
    const uncovered = { ...state, tiles: state.tiles.map((card) => card.id === 'edge' ? { ...card, removed: true } : card) }
    expect(isTileSelectable(uncovered, 'under')).toBe(true)
  })

  it('does not let a returned tile cover an ordinary board tile', () => {
    const state = stateWith([
      tile('ordinary', 'berry', 0, 0, 0),
      { ...tile('returned', 'lemon', 100, 0, 0), returned: true },
    ])
    expect(isTileSelectable(state, 'ordinary')).toBe(true)
    expect(isTileSelectable(state, 'returned')).toBe(true)
  })

  it('loses when the seventh unmatched tile fills the tray', () => {
    const types = ['berry', 'lemon', 'grape', 'pear', 'melon', 'plum', 'kiwi']
    let state = stateWith(types.map((type, index) => tile(String(index), type)))
    for (const card of state.tiles) state = selectTile(state, card.id)
    expect(state.tray).toHaveLength(7)
    expect(state.status).toBe('lost')
  })

  it('undo restores the selected tile and previous tray', () => {
    const initial = stateWith([tile('a', 'berry')])
    const selected = selectTile(initial, 'a')
    const restored = undo(selected)
    expect(restored.tray).toEqual([])
    expect(restored.tiles[0].removed).toBe(false)
    expect(restored.tools.undo).toBe(0)
  })

  it('moves the leftmost three tray cards back to the board and consumes one store use', () => {
    const initial = stateWith([
      tile('a', 'berry'), tile('b', 'lemon'), tile('c', 'grape'), tile('d', 'pear'),
    ], ['a', 'b', 'c', 'd'])
    const next = storeThreeToBoard(initial)
    expect(next.tray).toEqual(['d'])
    expect(next.tools.store).toBe(0)
    expect(next.tiles.filter(({ returned, removed }) => returned && !removed).map(({ id }) => id)).toEqual(['a', 'b', 'c'])
    const returned = next.tiles.filter(({ returned, removed }) => returned && !removed)
    const highestOrdinaryLayer = Math.max(...next.tiles.filter(({ returned }) => !returned).map(({ layer }) => layer))
    expect(returned.every((card) => card.layer > highestOrdinaryLayer && card.coveredBy?.length === 0)).toBe(true)
    expect(returned.every((card) => isTileSelectable(next, card.id))).toBe(true)
  })

  it('shuffles remaining tile types without changing geometry or removed cards', () => {
    const initial = stateWith([
      tile('a', 'berry', 0, 0, 0), tile('b', 'lemon', 1, 1, 0), tile('c', 'plum', 0, 2, 1),
    ])
    const shuffled = shuffleBoard(initial, () => 0.75)
    expect(shuffled.tiles.map(({ id, layer, x, y, removed }) => ({ id, layer, x, y, removed })))
      .toEqual(initial.tiles.map(({ id, layer, x, y, removed }) => ({ id, layer, x, y, removed })))
    expect(shuffled.tiles.map((card) => card.type).sort()).toEqual(initial.tiles.map((card) => card.type).sort())
    expect(shuffled.tools.shuffle).toBe(0)
  })

  it('does not undo an older selection across a later tool action', () => {
    let state = stateWith([tile('a', 'berry'), tile('b', 'lemon'), tile('c', 'grape')], ['b', 'c'])
    state = selectTile(state, 'a')
    state = storeThreeToBoard(state)
    expect(undo(state)).toBe(state)
    expect(state.tray).toEqual([])
  })

  it('uses explicit adjacent-layer coverage and makes revived cards selectable', () => {
    const state = stateWith([
      { ...tile('base', 'berry'), coveredBy: ['cover'] },
      tile('cover', 'lemon', 1),
      tile('c', 'grape'), tile('d', 'pear'), tile('e', 'melon'), tile('f', 'plum'), tile('g', 'kiwi'),
    ])
    expect(isTileSelectable(state, 'base')).toBe(false)
    const revived = {
      ...state, status: 'lost' as const, revive: 1,
      tray: ['base', 'cover', 'c', 'd', 'e', 'f', 'g'],
    }
    const next = reviveGame(revived)
    expect(next.status).toBe('playing')
    expect(next.tray).toHaveLength(4)
    expect(next.tray).toEqual(['d', 'e', 'f', 'g'])
    expect(next.tiles.filter((card) => card.returned && !card.removed)).toHaveLength(3)
    expect(next.tiles.filter((card) => card.returned).every((card) => isTileSelectable(next, card.id))).toBe(true)
  })
})
