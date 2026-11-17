import type { GameState } from './types'
import { reviveGame } from './engine'

export type MockReward = 'undo' | 'store' | 'shuffle' | 'revive'

export function grantMockReward(state: GameState, reward: MockReward, completed: boolean): GameState {
  if (!completed) return state
  if (reward === 'revive') {
    return reviveGame(state)
  }
  if (state.status !== 'playing' || state.toolAds[reward] <= 0) return state
  return {
    ...state,
    tools: { ...state.tools, [reward]: state.tools[reward] + 1 },
    toolAds: { ...state.toolAds, [reward]: state.toolAds[reward] - 1 },
  }
}
