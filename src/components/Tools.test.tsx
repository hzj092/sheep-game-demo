import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tools } from './Tools'

describe('game tools', () => {
  it('shows three square controls with a top-right quantity badge', () => {
    render(<Tools counts={{ undo: 1, store: 0, shuffle: 1 }} adCounts={{ undo: 1, store: 1, shuffle: 0 }} onUse={() => {}} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    expect(screen.getByRole('button', { name: /暂存，数量 0，广告位 1/ })).toBeInTheDocument()
    expect(buttons.every((button) => button.classList.contains('tool-button'))).toBe(true)
    expect(document.querySelectorAll('.tool-button .tool-count')).toHaveLength(3)
  })
})
