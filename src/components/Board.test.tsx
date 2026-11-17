import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import postcss, { type Rule } from 'postcss'
import { Board } from './Board'
import { selectTile, createGameState } from '../game/engine'
import type { Tile } from '../game/types'
import stylesheetText from '../styles.css?raw'
import '../styles.css'

const tiles: Tile[] = [
  { id: 'lower', type: 'animal-0', layer: 0, x: 0, y: 0, removed: false, coveredBy: ['upper'] },
  { id: 'upper', type: 'animal-1', layer: 1, x: 0, y: 0, removed: false, coveredBy: [] },
]

describe('board tile contrast', () => {
  it('keeps hover feedback from changing tile stacking or position', () => {
    const stylesheet = postcss.parse(stylesheetText)
    const hoverRule = stylesheet.nodes.find((node): node is Rule => node.type === 'rule' && node.selector === '.tile-ready:hover')
    const properties = hoverRule?.nodes?.filter((node) => node.type === 'decl').map((node) => node.prop) ?? []
    expect(properties).not.toContain('z-index')
    expect(properties).not.toContain('transform')
  })

  it('uses light gray under a cover, then restores the white face when uncovered', () => {
    const initial = createGameState('basic', tiles)
    const { rerender } = render(<Board state={initial} onSelect={() => {}} />)

    const covered = screen.getByRole('button', { name: '被遮挡🐶' })
    expect(covered).toHaveStyle({ backgroundColor: 'rgb(227, 230, 228)' })

    const uncovered = selectTile(initial, 'upper')
    rerender(<Board state={uncovered} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: '选择🐶' })).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' })
  })

  it('renders each side-stack card with its specified 8px vertical offset', () => {
    const stackTiles: Tile[] = [
      { id: 'stack-0', type: 'animal-0', layer: 0, x: -5, y: -3, removed: false, coveredBy: ['stack-1'], stackId: 'left', offsetPx: 0 },
      { id: 'stack-1', type: 'animal-1', layer: 1, x: -5, y: -3, removed: false, coveredBy: [], stackId: 'left', offsetPx: 8 },
    ]
    const state = createGameState('sheep', stackTiles, 1, 2, 'sheep')
    render(<Board state={state} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: '被遮挡🐶' })).toHaveStyle({ top: 'calc(50% + -24% + 0px)' })
    expect(screen.getByRole('button', { name: '选择😼' })).toHaveStyle({ top: 'calc(50% + -24% + 8px)' })
  })

  it('renders returned tiles on a separate bottom rail', () => {
    const returned = { ...tiles[0], id: 'returned', returned: true }
    const state = createGameState('sheep', [...tiles, returned], 1, 2, 'sheep')
    render(<Board state={state} onSelect={() => {}} />)
    expect(document.querySelector('.tile-returned')).toHaveStyle({ top: '95%' })
  })
})
