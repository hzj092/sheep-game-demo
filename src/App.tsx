import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, RotateCcw, X } from 'lucide-react'
import { Board } from './components/Board'
import { Tools } from './components/Tools'
import { Tray } from './components/Tray'
import { createGameState, selectTile, shuffleBoard, storeThreeToBoard, undo } from './game/engine'
import { createSeed, getLevel, LEVEL2_LAYOUTS, LEVELS, type LevelId } from './game/levels'
import { readRunHistory, recordRun } from './game/history'
import { grantMockReward, type MockReward } from './game/rewards'
import type { GameState, Level2Layout } from './game/types'
import type { ToolId } from './components/Tools'
import './styles.css'

type AdReward = MockReward

function newGame(mode: LevelId, layout: Level2Layout = 'random'): GameState {
  const level = getLevel(mode, createSeed(), layout)
  return createGameState(mode, level.tiles, level.seed, level.generatorVersion, level.layout)
}

export default function App() {
  const [state, setState] = useState<GameState | null>(null)
  const [adRequest, setAdRequest] = useState<AdReward | null>(null)
  const [notice, setNotice] = useState('')
  const [toolHint, setToolHint] = useState('')
  const [runs, setRuns] = useState(() => readRunHistory())
  const finalizedSeed = useRef<number | null>(null)
  const level = state ? LEVELS.find(({ id }) => id === state.level) : null
  const cleared = state?.tiles.filter((tile) => tile.removed).length ?? 0
  const remaining = state ? state.tiles.length - cleared : 0
  const progress = state && state.tiles.length ? Math.round((cleared / state.tiles.length) * 100) : 0

  function settleHome(result: 'won' | 'lost') {
    if (!state) return
    try {
      recordRun({ mode: state.level, layout: state.layout, seed: state.seed, generatorVersion: state.generatorVersion, result, finishedAt: new Date().toISOString() })
      setRuns(readRunHistory())
      setNotice(`${state.level === 'basic' ? '基础关' : '羊了个羊模式'} · ${result === 'won' ? '胜利' : '失败'} · 种子 ${state.seed}`)
    } catch {
      setNotice('本地记录写入失败；本局结果未保存。')
    }
    setState(null)
    setAdRequest(null)
  }

  useEffect(() => {
    if (state?.status === 'won' && finalizedSeed.current !== state.seed) {
      finalizedSeed.current = state.seed
      settleHome('won')
    }
  }, [state?.status])

  function useTool(tool: ToolId) {
    if (!state || state.status !== 'playing') return
    if (state.tools[tool] > 0) {
      setState((current) => {
        if (!current) return current
        if (tool === 'undo') return undo(current)
        if (tool === 'store') return storeThreeToBoard(current)
        return shuffleBoard(current)
      })
      return
    }
    if (state.toolAds[tool] > 0) {
      setAdRequest(tool)
      return
    }
    setToolHint('无道具')
    window.setTimeout(() => setToolHint(''), 1600)
  }

  function completeAd() {
    if (!state || !adRequest) return
    setState((current) => current ? grantMockReward(current, adRequest, true) : current)
    setAdRequest(null)
  }

  if (!state) {
      const basic = LEVELS.find(({ id }) => id === 'basic')!
      return (
      <main className="app-shell home-shell">
        <header className="topbar"><a className="brand" href="#home" aria-label="羊了个羊首页"><span className="brand-mark" aria-hidden="true">🐑</span><span><strong>羊了个羊</strong><small>牧场牌堆挑战</small></span></a></header>
        <section className="home-content" id="home">
          <div className="home-heading"><span className="eyebrow">ANIMAL MATCH · LOCAL DEMO</span><h1>选择关卡</h1><p>每次开始都会生成一副新的牌堆。</p></div>
          <div className="mode-list">
            <button className="mode-entry" type="button" onClick={() => { setNotice(''); setState(newGame('basic')) }}>
              <span className="mode-symbol" aria-hidden="true">🐶</span>
              <span className="mode-copy"><strong>{basic.title}</strong><small>{basic.subtitle}</small><small>{basic.cardNum} 种牌型 · {basic.cardNum * basic.layerNum * 3} 张牌</small></span>
              <ArrowRight size={19} aria-hidden="true" />
            </button>
            <section className="mode-entry mode-entry-group" aria-labelledby="second-level-title">
              <span className="mode-symbol" aria-hidden="true">🐑</span>
              <div className="mode-copy"><strong id="second-level-title">羊了个羊模式</strong><small>选择一种第 2 关牌堆结构</small><div className="layout-choice-list">
                {LEVEL2_LAYOUTS.map((layout) => <button className="layout-choice" key={layout.id} type="button" aria-label={layout.title} onClick={() => { setNotice(''); setState(newGame('sheep', layout.id)) }}>
                  <span>{layout.title}</span><small>{layout.totalTiles} 张</small>
                </button>)}
              </div></div>
            </section>
          </div>
          <p className="home-status" aria-live="polite">{notice || `本机已记录 ${runs.length} 局`}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="home-link" type="button" onClick={() => { setState(null); setAdRequest(null) }}><ArrowLeft size={16} /> 返回首页</button>
        <div className="topbar-right"><span className="season-pill">种子 {state.seed}</span><button className="icon-button" type="button" aria-label="重开本局" title="重开本局" onClick={() => setState(newGame(state.level, state.layout))}><RotateCcw size={18} /></button></div>
      </header>
      <div className="game-layout" id="game">
        <section className="play-column" aria-label="游戏区域">
          <div className="level-heading"><div className="level-copy"><span className="eyebrow">{state.level === 'basic' ? 'BASIC' : 'SHEEP MODE'} · {state.generatorVersion}</span><h1>{state.level === 'basic' ? level?.title : state.layout === 'random' ? '完全随机' : state.layout === 'inverted-pyramid' ? '倒金字塔' : '羊了个羊'}</h1><p>{state.layout === 'random' && state.level === 'sheep' ? '沿用当前随机牌堆' : state.layout === 'inverted-pyramid' ? '完整平方层，顶层 61 张' : level?.subtitle}</p></div><div className="level-medal" aria-label={`已清除 ${cleared} 张`}>{String(cleared).padStart(2, '0')}<small>已清</small></div></div>
          <div className="progress-track" aria-label={`进度 ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
        </section>
        <div className="board-frame">
          <div className="board-topline"><span className="board-caption"><span className="caption-mark" /> 牌堆区域</span><span className="remaining-count">剩余 <strong>{remaining}</strong> 张</span></div>
          <Board state={state} onSelect={(id) => setState((current) => current ? selectTile(current, id) : current)} />
          <div className="board-footline"><span>可选牌按层间覆盖实时判断</span><span>Seed {state.seed}</span></div>
        </div>
        <aside className="control-column" aria-label="游戏控制">
          <Tray state={state} hint={toolHint} />
          <Tools counts={state.tools} adCounts={state.toolAds} onUse={useTool} />
        </aside>
      </div>
      {state.status === 'lost' && <div className="result-backdrop"><section className="result-panel result-loss" role="dialog" aria-modal="true" aria-labelledby="result-title"><div className="result-icon">🐑</div><span className="eyebrow">TRY AGAIN</span><h2 id="result-title">槽位满了</h2><p>模拟广告续关会把槽位最左侧三张牌放回牌区底部。</p><div className="result-actions"><button className="secondary-action" type="button" disabled={state.revive <= 0} onClick={() => setAdRequest('revive')}>模拟广告续关 <BadgeCheck size={16} /></button><button className="primary-action" type="button" onClick={() => settleHome('lost')}>记录失败并返回首页 <ArrowLeft size={16} /></button></div></section></div>}
      {state.status === 'won' && <div className="result-backdrop"><section className="result-panel result-win" role="dialog" aria-modal="true" aria-labelledby="result-title"><div className="result-icon">🌟</div><span className="eyebrow">FIELD COMPLETE</span><h2 id="result-title">全部清除</h2><p>本局种子 {state.seed} 将写入本机记录。</p><button className="primary-action" type="button" onClick={() => settleHome('won')}>记录胜利并返回首页</button></section></div>}
      {adRequest && <div className="result-backdrop"><section className="result-panel" role="dialog" aria-modal="true" aria-labelledby="ad-title"><button className="result-close" type="button" aria-label="关闭模拟广告" onClick={() => setAdRequest(null)}><X size={18} /></button><div className="result-icon">▶</div><span className="eyebrow">LOCAL MOCK AD</span><h2 id="ad-title">模拟广告</h2><p>{adRequest === 'revive' ? '完成广告后续关，槽位最左侧三张牌将回到牌堆底部。' : '完成广告后仅补充 1 次道具，不会自动使用。跳过则不获得道具。'}</p><div className="result-actions"><button className="primary-action" type="button" onClick={completeAd}>模拟播放完成</button><button className="secondary-action" type="button" onClick={() => setAdRequest(null)}>跳过广告</button></div></section></div>}
    </main>
  )
}
