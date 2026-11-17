import { isTileSelectable } from '../game/engine'
import { ANIMAL_TYPES } from '../game/levels'
import type { GameState, Tile } from '../game/types'

type Props = {
  state: GameState
  onSelect: (id: string) => void
}

export function Board({ state, onSelect }: Props) {
  const ordinary = state.tiles.filter((tile) => !tile.returned)
  const minX = Math.min(0, ...ordinary.map(({ x }) => x))
  const maxX = Math.max(0, ...ordinary.map(({ x }) => x))
  const minY = Math.min(0, ...ordinary.map(({ y }) => y))
  const maxY = Math.max(0, ...ordinary.map(({ y }) => y))
  const position = (value: number, min: number, max: number) => `${max === min ? 50 : 12 + ((value - min) / (max - min)) * 76}%`
  return (
    <section className="board" aria-label="牌堆">
      {state.tiles.map((tile: Tile) => {
        if (tile.removed) return null
        const definition = ANIMAL_TYPES.find((item) => item.id === tile.type)!
        const selectable = isTileSelectable(state, tile.id)
        return (
          <button
            className={`tile${tile.returned ? ' tile-returned' : ''}${selectable ? ' tile-ready' : ' tile-covered'}`}
            key={tile.id}
            style={{
              left: tile.returned ? `calc(50% + ${tile.x * 11}%)` : state.layout === 'inverted-pyramid' || state.layout === 'sheep' ? `calc(50% + ${tile.x * 8}%)` : position(tile.x, minX, maxX),
              top: tile.returned ? '95%' : state.layout === 'inverted-pyramid' || state.layout === 'sheep' ? `calc(50% + ${tile.y * 8}% + ${tile.offsetPx ?? 0}px)` : position(tile.y, minY, maxY),
              zIndex: tile.returned ? 100 + tile.x : tile.layer,
              backgroundColor: selectable ? '#fff' : '#e3e6e4',
              color: '#183d31',
            }}
            type="button"
            disabled={!selectable}
            aria-label={`${selectable ? '选择' : '被遮挡'}${definition.name}`}
            onClick={() => onSelect(tile.id)}
          >
            <span aria-hidden="true">{definition.symbol}</span>
          </button>
        )
      })}
      <div className="board-stamp" aria-hidden="true">FIELD<br />NO. 02</div>
    </section>
  )
}
