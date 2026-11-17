import type { GameState, Level2Layout, LevelId, Tile } from './types'

const TRAY_LIMIT = 7
const MATCH_SIZE = 3
const RANDOM_LAYOUT_CENTER_RADIUS = 0.82
const GRID_TILE_HALF_WIDTH = 0.5
const GRID_TILE_HALF_HEIGHT = 0.55

export function createGameState(level: LevelId, tiles: Tile[], seed = 1, generatorVersion = 1, layout: Level2Layout = 'random'): GameState {
  return {
    level,
    layout,
    seed,
    generatorVersion,
    tiles: tiles.map((card) => ({ ...card })),
    tray: [],
    history: [],
    status: 'playing',
    tools: { undo: 1, store: 1, shuffle: 1 },
    toolAds: { undo: 1, store: 1, shuffle: 1 },
    revive: 1,
  }
}

export function isTileSelectable(state: GameState, tileId: string): boolean {
  const tile = state.tiles.find((card) => card.id === tileId)
  if (!tile || tile.removed || state.status !== 'playing') return false
  if (tile.returned) return true
  const gridLayout = state.layout === 'sheep' || state.layout === 'inverted-pyramid'
  return !state.tiles.some((cover) => {
    if (cover.removed || cover.returned || cover.layer <= tile.layer) return false
    if (tile.coveredBy?.includes(cover.id)) return true
    const halfWidth = gridLayout ? GRID_TILE_HALF_WIDTH : RANDOM_LAYOUT_CENTER_RADIUS
    const halfHeight = gridLayout ? GRID_TILE_HALF_HEIGHT : RANDOM_LAYOUT_CENTER_RADIUS
    return Math.abs(cover.x - tile.x) <= halfWidth && Math.abs(cover.y - tile.y) <= halfHeight
  })
}

function snapshot(state: GameState) {
  return {
    tiles: state.tiles.map((card) => ({ ...card })),
    tray: [...state.tray],
  }
}

function settle(state: GameState): GameState {
  if (state.tray.length >= TRAY_LIMIT) return { ...state, status: 'lost' }
  if (state.tiles.every((card) => card.removed) && state.tray.length === 0) {
    return { ...state, status: 'won' }
  }
  return state
}

function addToTray(state: GameState, tileId: string): GameState {
  const tile = state.tiles.find((card) => card.id === tileId)
  if (!tile || state.tray.length >= TRAY_LIMIT) return state
  const tray = [...state.tray, tileId]
  const matching = tray.filter((id) => state.tiles.find((card) => card.id === id)?.type === tile.type)
  const clearedIds = matching.length >= MATCH_SIZE ? new Set(matching.slice(0, MATCH_SIZE)) : new Set<string>()
  return settle({
    ...state,
    tray: tray.filter((id) => !clearedIds.has(id)),
  })
}

export function selectTile(state: GameState, tileId: string): GameState {
  if (!isTileSelectable(state, tileId) || state.tray.length >= TRAY_LIMIT) return state
  const previous = snapshot(state)
  const selected = {
    ...state,
    tiles: state.tiles.map((card) => card.id === tileId ? { ...card, removed: true } : card),
    history: [...state.history, previous],
  }
  return addToTray(selected, tileId)
}

export function undo(state: GameState): GameState {
  if (state.tools.undo <= 0 || state.history.length === 0 || state.status !== 'playing') return state
  const previous = state.history[state.history.length - 1]
  return {
    ...state,
    ...previous,
    history: state.history.slice(0, -1),
    status: 'playing',
    tools: { ...state.tools, undo: state.tools.undo - 1 },
  }
}

function returnTilesToBoard(state: GameState, ids: string[]): GameState {
  const previousReturns = state.tiles.filter((tile) => tile.returned && !tile.removed).map(({ id }) => id)
  const returnedIds = [...previousReturns, ...ids]
  const highestLayer = Math.max(-1, ...state.tiles.map(({ layer }) => layer)) + 1
  const returned = new Set(returnedIds)
  return {
    ...state,
    tiles: state.tiles.map((tile) => {
      if (!returned.has(tile.id)) return tile
      const index = returnedIds.indexOf(tile.id)
      return {
        ...tile,
        removed: false,
        returned: true,
        layer: highestLayer,
        x: index - (returnedIds.length - 1) / 2,
        y: highestLayer,
        coveredBy: [],
      }
    }),
  }
}

export function storeThreeToBoard(state: GameState): GameState {
  if (state.tools.store <= 0 || state.tray.length < MATCH_SIZE || state.status !== 'playing') return state
  const returnedIds = state.tray.slice(0, MATCH_SIZE)
  const next = returnTilesToBoard({ ...state, tray: state.tray.slice(MATCH_SIZE), history: [] }, returnedIds)
  return { ...next, tools: { ...state.tools, store: state.tools.store - 1 } }
}

export function shuffleBoard(state: GameState, random: () => number = Math.random): GameState {
  if (state.tools.shuffle <= 0 || state.status !== 'playing') return state
  const active = state.tiles.filter((card) => !card.removed)
  if (active.length < 2) return state
  const types = active.map((card) => card.type)
  for (let index = types.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[types[index], types[swapIndex]] = [types[swapIndex], types[index]]
  }
  let typeIndex = 0
  return {
    ...state,
    tiles: state.tiles.map((card) => card.removed ? card : { ...card, type: types[typeIndex++] }),
    history: [],
    tools: { ...state.tools, shuffle: state.tools.shuffle - 1 },
  }
}

export function reviveGame(state: GameState): GameState {
  if (state.status !== 'lost' || state.revive <= 0 || state.tray.length < 3) return state
  const freed = state.tray.slice(0, 3)
  const returned = returnTilesToBoard({ ...state, tray: state.tray.slice(3), history: [] }, freed)
  return {
    ...state,
    tray: returned.tray,
    tiles: returned.tiles,
    history: [], status: 'playing', revive: state.revive - 1,
  }
}
