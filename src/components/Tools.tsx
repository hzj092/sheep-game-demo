import { ArchiveRestore, RotateCcw, Shuffle } from 'lucide-react'

export type ToolId = 'undo' | 'store' | 'shuffle'

type Props = {
  counts: { undo: number; store: number; shuffle: number }
  adCounts: { undo: number; store: number; shuffle: number }
  onUse: (tool: ToolId) => void
}

export function Tools({ counts, adCounts, onUse }: Props) {
  return (
    <section className="tools-block" aria-label="道具">
      <div className="tools-heading">
        <span className="section-kicker">FIELD KIT</span>
        <span className="tools-note">每种道具独立计次</span>
      </div>
      <div className="tools-row">
        <button type="button" className="tool-button" aria-label={`撤回，数量 ${counts.undo}，广告位 ${adCounts.undo}`} onClick={() => onUse('undo')}>
          <span className="tool-icon"><RotateCcw size={19} strokeWidth={2.1} /></span>
          <span className="tool-copy"><strong>撤回</strong><small>上一步 · 广告 {adCounts.undo}</small></span>
          <span className="tool-count">{counts.undo}</span>
        </button>
        <button type="button" className="tool-button" aria-label={`暂存，数量 ${counts.store}，广告位 ${adCounts.store}`} onClick={() => onUse('store')}>
          <span className="tool-icon"><ArchiveRestore size={19} strokeWidth={2.1} /></span>
          <span className="tool-copy"><strong>暂存</strong><small>牌堆回流 · 广告 {adCounts.store}</small></span>
          <span className="tool-count">{counts.store}</span>
        </button>
        <button type="button" className="tool-button" aria-label={`洗牌，数量 ${counts.shuffle}，广告位 ${adCounts.shuffle}`} onClick={() => onUse('shuffle')}>
          <span className="tool-icon"><Shuffle size={19} strokeWidth={2.1} /></span>
          <span className="tool-copy"><strong>洗牌</strong><small>牌型重排 · 广告 {adCounts.shuffle}</small></span>
          <span className="tool-count">{counts.shuffle}</span>
        </button>
      </div>
    </section>
  )
}
