import { describe, expect, it } from 'vitest'
import { ANIMAL_TYPES, GENERATOR_VERSION, getLevel, LEVELS } from './levels'

describe('seeded animal-pool levels', () => {
  it('keeps the approved catalog of 44 distinct animal symbols', () => {
    expect(ANIMAL_TYPES).toHaveLength(44)
    expect(new Set(ANIMAL_TYPES.map(({ symbol }) => symbol)).size).toBe(44)
    expect(ANIMAL_TYPES.map(({ symbol }) => symbol)).toEqual([
      '🐶', '😼', '🐹', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🙊', '🐔',
      '🐧', '🦆', '🦅', '🦉', '🐺', '🐗', '🐝', '🐴', '🦄', '🦖', '🦂', '🦑', '🦕', '🐢',
      '🦀', '🐡', '🐊', '🦈', '🦒', '🐏', '🐑', '🦔', '🦌', '🐕', '🐂', '🦍', '🦓', '🦞',
      '🐟', '🐳',
    ])
  })

  it('offers basic and sheep modes at the agreed pool sizes', () => {
    expect(LEVELS.map(({ id }) => id)).toEqual(['basic', 'sheep'])
    const basic = getLevel('basic', 42)
    const sheep = getLevel('sheep', 42)
    expect(basic.tiles).toHaveLength(24)
    expect(new Set(basic.tiles.map(({ type }) => type)).size).toBe(4)
    expect(sheep.tiles).toHaveLength(270)
    expect(new Set(sheep.tiles.map(({ type }) => type)).size).toBe(15)
    for (const level of [basic, sheep]) {
      const counts = new Map<string, number>()
      level.tiles.forEach(({ type }) => counts.set(type, (counts.get(type) ?? 0) + 1))
      expect([...counts.values()].every((count) => count === level.layerNum * 3)).toBe(true)
    }
  })

  it('repeats all generated output for mode, seed, and generator version', () => {
    expect(GENERATOR_VERSION).toBeTruthy()
    expect(getLevel('sheep', 1234)).toEqual(getLevel('sheep', 1234))
    expect(getLevel('sheep', 1234).tiles).not.toEqual(getLevel('sheep', 1235).tiles)
    expect(getLevel('basic', 0)).toEqual(getLevel('basic', 0))
    expect(getLevel('basic', 4294967295)).toEqual(getLevel('basic', 4294967295))
  })

  it('allocates every tile into non-empty layers with unique positions per layer', () => {
    for (const mode of ['basic', 'sheep'] as const) {
      const { tiles } = getLevel(mode, 987)
      const layers = new Map<number, Set<string>>()
      for (const tile of tiles) {
        const positions = layers.get(tile.layer) ?? new Set<string>()
        positions.add(`${tile.x},${tile.y}`)
        layers.set(tile.layer, positions)
      }
      expect([...layers.values()].reduce((sum, positions) => sum + positions.size, 0)).toBe(tiles.length)
      expect([...layers.values()].every((positions) => positions.size > 0)).toBe(true)
      expect([...layers].every(([layer, positions]) => positions.size <= (layer + 1) ** 2)).toBe(true)
    }
  })

  it('generates the inverted pyramid with the agreed square layer counts', () => {
    const level = getLevel('sheep', 7, 'inverted-pyramid')
    const counts = [...new Map(level.tiles.map((tile) => [tile.layer, 0])).keys()]
      .sort((a, b) => a - b)
      .map((layer) => level.tiles.filter((tile) => tile.layer === layer).length)
    expect(counts).toEqual([1, 4, 9, 16, 25, 36, 49, 61])
    expect(level.tiles).toHaveLength(201)
    expect(level.layout).toBe('inverted-pyramid')
    expect([...new Map(level.tiles.map(({ type }) => [type, 0])).keys()].every((type) => level.tiles.filter((tile) => tile.type === type).length % 3 === 0)).toBe(true)
    expect(level.tiles.filter((tile) => tile.layer === 7).every((tile) => tile.coveredBy?.length === 0)).toBe(true)
    expect(level.tiles.filter((tile) => tile.layer === 0).every((tile) => (tile.coveredBy?.length ?? 0) > 0)).toBe(true)
  })

  it('generates a deterministic sheep composition with side stacks and central regions', () => {
    const first = getLevel('sheep', 99, 'sheep')
    const second = getLevel('sheep', 99, 'sheep')
    const otherSeed = getLevel('sheep', 100, 'sheep')
    expect(first).toEqual(second)
    expect(first.tiles.filter((tile) => tile.motif?.includes('pyramid')).map(({ x, y }) => [x, y]))
      .not.toEqual(otherSeed.tiles.filter((tile) => tile.motif?.includes('pyramid')).map(({ x, y }) => [x, y]))
    expect(first.tiles).toHaveLength(270)
    expect(first.layout).toBe('sheep')
    const typeCounts = new Map<string, number>()
    first.tiles.forEach(({ type }) => typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1))
    expect(typeCounts.size).toBe(15)
    expect([...typeCounts.values()].every((count) => count === 18)).toBe(true)
    expect(first.tiles.filter((tile) => tile.stackId === 'left')).toHaveLength(10)
    expect(first.tiles.filter((tile) => tile.stackId === 'right')).toHaveLength(10)
    for (const side of ['left', 'right'] as const) {
      const stack = first.tiles.filter((tile) => tile.stackId === side).sort((a, b) => (a.offsetPx ?? 0) - (b.offsetPx ?? 0))
      expect(stack.map((tile) => tile.offsetPx)).toEqual([0, 8, 16, 24, 32, 40, 48, 56, 64, 72])
      expect(stack.every((tile) => tile.motif === 'stack')).toBe(true)
    }
    const central = first.tiles.filter((tile) => !tile.stackId)
    expect(central.every((tile) => tile.region === 'upper' || tile.region === 'lower')).toBe(true)
    expect(central.filter((tile) => tile.region === 'upper').every((tile) => tile.x >= -3.5 && tile.x <= 3.5 && tile.y >= -2.5 && tile.y <= -0.5)).toBe(true)
    expect(central.filter((tile) => tile.region === 'lower').every((tile) => tile.x >= -3.5 && tile.x <= 3.5 && tile.y >= 0.5 && tile.y <= 4.5)).toBe(true)
    const largePyramidTiles = first.tiles.filter((tile) => tile.motif === 'large-pyramid')
    expect(largePyramidTiles).toHaveLength(30)
    expect(largePyramidTiles.length / first.tiles.length).toBeGreaterThanOrEqual(0.08)
    expect(largePyramidTiles.length / first.tiles.length).toBeLessThanOrEqual(0.25)
    expect(first.tiles.filter((tile) => tile.motif === 'small-pyramid').every((tile) => Number(tile.id.split('-').at(-1)) < 22)).toBe(true)
    for (const [region, layerSize] of [['upper', 14], ['lower', 28]] as const) {
      const completeLayers = new Map<number, number>()
      central.filter((tile) => tile.region === region && tile.motif === 'grid')
        .forEach((tile) => completeLayers.set(tile.layer, (completeLayers.get(tile.layer) ?? 0) + 1))
      expect([...completeLayers.values()].filter((count) => count === layerSize).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('records every higher tile whose face contains a lower tile center', () => {
    const { tiles } = getLevel('sheep', 99, 'sheep')
    for (const tile of tiles.filter(({ stackId }) => !stackId)) {
      const expected = tiles.filter((cover) =>
        !cover.stackId && cover.layer > tile.layer &&
        Math.abs(cover.x - tile.x) <= 0.5 && Math.abs(cover.y - tile.y) <= 0.5,
      ).map(({ id }) => id).sort()
      expect([...(tile.coveredBy ?? [])].sort()).toEqual(expected)
    }
  })
})
