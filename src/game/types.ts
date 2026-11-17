export type Tile = {
  id: string
  type: string
  layer: number
  x: number
  y: number
  removed: boolean
  coveredBy?: string[]
  returned?: boolean
  region?: 'upper' | 'lower' | 'left-stack' | 'right-stack'
  stackId?: 'left' | 'right'
  offsetPx?: number
  motif?: 'large-pyramid' | 'small-pyramid' | 'grid' | 'stack'
}

export type LevelId = 'basic' | 'sheep'
export type Level2Layout = 'random' | 'inverted-pyramid' | 'sheep'

export type GameStatus = 'playing' | 'won' | 'lost'

export type GameState = {
  level: LevelId
  layout: Level2Layout
  seed: number
  generatorVersion: number
  tiles: Tile[]
  tray: string[]
  history: Array<{ tiles: Tile[]; tray: string[] }>
  status: GameStatus
  tools: { undo: number; store: number; shuffle: number }
  toolAds: { undo: number; store: number; shuffle: number }
  revive: number
}
