import { ANIMAL_TYPES } from '../game/levels'
import type { GameState } from '../game/types'

type Props = {
  state: GameState
  hint: string
}

export function Tray({ state, hint }: Props) {
  return (
    <section className="tray-block" aria-label="收纳槽">
      <div className="tray-heading">
        <div>
          <span className="section-kicker">COLLECTION</span>
          <h2>收纳槽</h2>
        </div>
        <span className="tray-count" aria-live="polite">槽位 {state.tray.length} / 7</span>
      </div>
      {hint && <span className="tool-hint" role="status">{hint}</span>}
      <div className="tray" role="group" aria-label={`槽位 ${state.tray.length} / 7`}>
        {Array.from({ length: 7 }, (_, index) => {
          const tileId = state.tray[index]
          const tile = tileId ? state.tiles.find((card) => card.id === tileId) : undefined
          const type = tile && ANIMAL_TYPES.find((item) => item.id === tile.type)
          return (
            <div className={`tray-slot${tile ? ' tray-slot-filled' : ''}`} key={index}>
              {tile && type ? <span aria-label={type.name}>{type.symbol}</span> : <span className="slot-dash" />}
            </div>
          )
        })}
      </div>
    </section>
  )
}
