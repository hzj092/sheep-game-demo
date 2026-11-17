import type { Level2Layout, Tile } from './types'

export const GENERATOR_VERSION = 2
export const LEVELS = [
  { id: 'basic', title: '基础关', subtitle: '熟悉牌堆与三消节奏', cardNum: 4, layerNum: 2 },
  { id: 'sheep', title: '羊了个羊模式', subtitle: '更多牌型，层层推进', cardNum: 15, layerNum: 6 },
] as const
export type LevelId = (typeof LEVELS)[number]['id']
export const LEVEL_COUNT = LEVELS.length
export const LEVEL2_LAYOUTS = [
  { id: 'random', title: '完全随机', subtitle: '沿用当前随机牌堆', totalTiles: 270 },
  { id: 'inverted-pyramid', title: '倒金字塔', subtitle: '完整平方层，顶层 61 张', totalTiles: 201 },
  { id: 'sheep', title: '羊了个羊', subtitle: '两侧牌堆与中央双区域', totalTiles: 270 },
] as const

export const ANIMAL_TYPES = [
  '🐶', '😼', '🐹', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🙊', '🐔',
  '🐧', '🦆', '🦅', '🦉', '🐺', '🐗', '🐝', '🐴', '🦄', '🦖', '🦂', '🦑', '🦕', '🐢',
  '🦀', '🐡', '🐊', '🦈', '🦒', '🐏', '🐑', '🦔', '🦌', '🐕', '🐂', '🦍', '🦓', '🦞',
  '🐟', '🐳',
].map((symbol, index) => ({ id: `animal-${index}`, symbol, name: symbol }))

export type LevelDefinition = {
  id: LevelId
  title: string
  subtitle: string
  cardNum: number
  layerNum: number
  generatorVersion: number
  seed: number
  layout: Level2Layout
  layoutTitle: string
  tiles: Tile[]
  tutorial: string[]
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function assignLayers(pool: string[], random: () => number): Array<{ type: string; layer: number; x: number; y: number }> {
  const result: Array<{ type: string; layer: number; x: number; y: number }> = []
  let cursor = 0
  let layer = 0
  while (cursor < pool.length) {
    const gridWidth = layer + 1
    const capacity = gridWidth * gridWidth
    const desired = Math.ceil(capacity / 2 + random() * capacity / 2)
    const count = Math.min(pool.length - cursor, desired)
    const positions = shuffle(Array.from({ length: (gridWidth + 1) ** 2 }, (_, index) => index), random).slice(0, count)
    positions.forEach((position, index) => {
      result.push({
        type: pool[cursor + index], layer,
        x: position % (gridWidth + 1) - gridWidth / 2 + layer * 0.08,
        y: Math.floor(position / (gridWidth + 1)) - gridWidth / 2 + layer * 0.08,
      })
    })
    cursor += count
    layer += 1
  }
  return result
}

function addCoverage(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => ({
    ...tile,
    coveredBy: tiles.filter((cover) => cover.layer === tile.layer + 1 && Math.abs(cover.x - tile.x) <= 1 && Math.abs(cover.y - tile.y) <= 1).map(({ id }) => id),
  }))
}

function addOverlapCoverage(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => ({
    ...tile,
    coveredBy: tiles
      .filter((cover) => !cover.returned && cover.layer > tile.layer && Math.abs(cover.x - tile.x) <= 0.5 && Math.abs(cover.y - tile.y) <= 0.55)
      .map(({ id }) => id),
  }))
}

type TileEntry = Omit<Tile, 'id' | 'type' | 'removed' | 'coveredBy'>

function createTileEntries(types: string[], seed: number, entries: TileEntry[]): Tile[] {
  return entries.map((entry, index) => ({
    id: `s${seed >>> 0}-${index}`,
    type: types[index],
    removed: false,
    coveredBy: [],
    ...entry,
  }))
}

function makeInvertedPool(random: () => number): string[] {
  const selected = shuffle(ANIMAL_TYPES, random).slice(0, 15).map(({ id }) => id)
  const grouped = selected.flatMap((type, index) => Array.from({ length: index < 7 ? 15 : 12 }, () => type))
  return shuffle(grouped, random)
}

function createInvertedPyramid(seed: number, random: () => number): Tile[] {
  const counts = [1, 4, 9, 16, 25, 36, 49, 61]
  const pool = makeInvertedPool(random)
  const entries: TileEntry[] = []
  let cursor = 0
  counts.forEach((count, layer) => {
    const width = layer + 1
    const selected = shuffle(Array.from({ length: width * width }, (_, index) => index), random).slice(0, count)
    selected.forEach((position) => {
      entries.push({
        layer,
        x: position % width - (width - 1) / 2,
        y: Math.floor(position / width) - (width - 1) / 2,
        motif: 'grid',
      })
      cursor += 1
    })
  })
  return addOverlapCoverage(createTileEntries(pool.slice(0, cursor), seed, entries))
}

function addMotif(
  entries: TileEntry[],
  base: Array<[number, number]>,
  top: [number, number],
  repeats: number,
  startLayer: number,
  motif: 'large-pyramid' | 'small-pyramid',
  region: 'upper' | 'lower',
): number {
  let layer = startLayer
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    base.forEach(([x, y]) => entries.push({ layer, x, y, motif, region }))
    entries.push({ layer: layer + 1, x: top[0], y: top[1], motif, region })
    layer += 2
  }
  return layer
}

function regionPositions(region: 'upper' | 'lower'): Array<[number, number]> {
  const ys = region === 'upper' ? [-2, -1] : [1, 2, 3, 4]
  return ys.flatMap((y) => Array.from({ length: 7 }, (_, index) => [index - 3, y] as [number, number]))
}

function chooseFootprint<T>(candidates: T[], random: () => number): T {
  return candidates[Math.floor(random() * candidates.length)]
}

function createSheepLayout(seed: number, random: () => number): Tile[] {
  const entries: TileEntry[] = []
  const upper = regionPositions('upper')
  const lower = regionPositions('lower')
  const largeFootprints = (positions: Array<[number, number]>) => positions
    .filter(([x, y]) => positions.some(([otherX, otherY]) => otherX === x + 1 && otherY === y)
      && positions.some(([otherX, otherY]) => otherX === x && otherY === y + 1)
      && positions.some(([otherX, otherY]) => otherX === x + 1 && otherY === y + 1))
    .map(([x, y]) => ({ base: [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]] as Array<[number, number]>, top: [x + 0.5, y + 0.5] as [number, number] }))
  const smallFootprints = (positions: Array<[number, number]>) => [
    ...positions.filter(([x, y]) => positions.some(([otherX, otherY]) => otherX === x + 1 && otherY === y))
      .map(([x, y]) => ({ base: [[x, y], [x + 1, y]] as Array<[number, number]>, top: [x + 0.5, y] as [number, number] })),
    ...positions.filter(([x, y]) => positions.some(([otherX, otherY]) => otherX === x && otherY === y + 1))
      .map(([x, y]) => ({ base: [[x, y], [x, y + 1]] as Array<[number, number]>, top: [x, y + 0.5] as [number, number] })),
  ]
  const upperSmall = chooseFootprint(smallFootprints(upper), random)
  const lowerSmall = chooseFootprint(smallFootprints(lower), random)
  const upperLarge = chooseFootprint(largeFootprints(upper), random)
  const lowerLarge = chooseFootprint(largeFootprints(lower), random)
  let layer = 0
  layer = addMotif(entries, upperSmall.base, upperSmall.top, 2, layer, 'small-pyramid', 'upper')
  layer = addMotif(entries, lowerSmall.base, lowerSmall.top, 2, layer, 'small-pyramid', 'lower')
  layer = addMotif(entries, upperLarge.base, upperLarge.top, 3, layer, 'large-pyramid', 'upper')
  layer = addMotif(entries, lowerLarge.base, lowerLarge.top, 3, layer, 'large-pyramid', 'lower')

  const intermediate = [
    ...upper.map(([x, y]) => ({ x, y, region: 'upper' as const })),
    ...lower.map(([x, y]) => ({ x, y, region: 'lower' as const })),
  ]
  const intermediateCounts = [32, 34, 32, 26]
  intermediateCounts.forEach((count, index) => {
    shuffle(intermediate, random).slice(0, count).forEach(({ x, y, region }) => entries.push({ layer: layer + index, x, y, region, motif: 'grid' }))
  })

  const gridLayerStart = layer + intermediateCounts.length
  for (let gridRepeat = 0; gridRepeat < 2; gridRepeat += 1) {
    upper.forEach(([x, y]) => entries.push({ layer: gridLayerStart + gridRepeat * 2, x, y, region: 'upper', motif: 'grid' }))
    lower.forEach(([x, y]) => entries.push({ layer: gridLayerStart + gridRepeat * 2 + 1, x, y, region: 'lower', motif: 'grid' }))
  }

  const sideLayer = gridLayerStart + 4
  for (const [stackId, x] of [['left', -5], ['right', 5]] as const) {
    for (let index = 0; index < 10; index += 1) {
      entries.push({
        layer: sideLayer + index,
        x,
        y: -3,
        region: stackId === 'left' ? 'left-stack' : 'right-stack',
        stackId,
        offsetPx: index * 8,
        motif: 'stack',
      })
    }
  }

  const selected = shuffle(ANIMAL_TYPES, random).slice(0, 15).map(({ id }) => id)
  const types = shuffle(Array.from({ length: entries.length }, (_, index) => selected[Math.floor(index / 18) % selected.length]), random)
  return addOverlapCoverage(createTileEntries(types, seed, entries))
}

export function getLevel(id: LevelId, seed = 1, layout: Level2Layout = 'random'): LevelDefinition {
  const config = LEVELS.find((level) => level.id === id)
  if (!config) throw new RangeError(`Unknown level: ${id}`)
  const random = seededRandom(seed)
  const selectedLayout: Level2Layout = id === 'basic' ? 'random' : layout
  if (selectedLayout === 'inverted-pyramid') {
    return {
      ...config,
      seed: seed >>> 0,
      generatorVersion: GENERATOR_VERSION,
      layout: selectedLayout,
      layoutTitle: '倒金字塔',
      tiles: createInvertedPyramid(seed, random),
      tutorial: [],
    }
  }
  if (selectedLayout === 'sheep') {
    return {
      ...config,
      seed: seed >>> 0,
      generatorVersion: GENERATOR_VERSION,
      layout: selectedLayout,
      layoutTitle: '羊了个羊',
      tiles: createSheepLayout(seed, random),
      tutorial: [],
    }
  }
  const selectedTypes = shuffle(ANIMAL_TYPES, random).slice(0, config.cardNum).map(({ id: typeId }) => typeId)
  const pool = shuffle(selectedTypes.flatMap((type) => Array.from({ length: config.layerNum * 3 }, () => type)), random)
  const positioned = assignLayers(pool, random).map((tile, index) => ({ id: `s${seed >>> 0}-${index}`, ...tile, removed: false, coveredBy: [] as string[] }))
  return {
    ...config, seed: seed >>> 0, generatorVersion: GENERATOR_VERSION, layout: 'random', layoutTitle: id === 'basic' ? '基础关' : '完全随机',
    tiles: addCoverage(positioned), tutorial: id === 'basic' ? ['点击未被覆盖的牌放入槽位。', '凑齐三张相同牌型即可消除。', '槽位最多七张，善用道具。'] : [],
  }
}

export function createSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) return crypto.getRandomValues(new Uint32Array(1))[0]
  return Math.floor(Math.random() * 4294967296) >>> 0
}
