import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('two-mode game flow', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('keeps the basic entry and exposes exactly three second-level layouts', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '选择关卡' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /基础关/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /完全随机|倒金字塔|羊了个羊/ })).toHaveLength(3)
  })

  it('uses tool stock directly, grants stock after an ad, and does not auto-use it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /基础关/ }))
    expect(screen.getByRole('heading', { name: '基础关' })).toBeInTheDocument()
    expect(screen.getByText(/槽位 0 \/ 7/)).toBeInTheDocument()
    const shuffle = screen.getByRole('button', { name: /洗牌/ })
    expect(shuffle).toHaveAttribute('aria-label', expect.stringContaining('数量 1'))
    await user.click(shuffle)
    expect(screen.getByRole('button', { name: /洗牌/ })).toHaveAttribute('aria-label', expect.stringContaining('数量 0'))

    await user.click(screen.getByRole('button', { name: /洗牌/ }))
    expect(screen.getByRole('dialog', { name: '模拟广告' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '跳过广告' }))
    expect(screen.getByRole('button', { name: /洗牌/ })).toHaveAttribute('aria-label', expect.stringContaining('广告位 1'))

    await user.click(screen.getByRole('button', { name: /洗牌/ }))
    await user.click(screen.getByRole('button', { name: '模拟播放完成' }))
    expect(screen.queryByRole('dialog', { name: '模拟广告' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /洗牌/ })).toHaveAttribute('aria-label', expect.stringContaining('数量 1'))

    await user.click(screen.getByRole('button', { name: /洗牌/ }))
    expect(screen.getByRole('button', { name: /洗牌/ })).toHaveAttribute('aria-label', expect.stringContaining('广告位 0'))
    await user.click(screen.getByRole('button', { name: /洗牌/ }))
    expect(screen.getByText('无道具')).toBeInTheDocument()
  })

  it('starts every second-level layout with its configured tile count and heading', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /完全随机/ }))
    expect(screen.getByRole('heading', { name: '完全随机' })).toBeInTheDocument()
    expect(screen.getByText('270', { exact: true })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '返回首页' }))
    await user.click(screen.getByRole('button', { name: /倒金字塔/ }))
    expect(screen.getByRole('heading', { name: '倒金字塔' })).toBeInTheDocument()
    expect(screen.getByText('201', { exact: true })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '返回首页' }))
    await user.click(screen.getByRole('button', { name: /^羊了个羊$/ }))
    expect(screen.getByRole('heading', { name: '羊了个羊' })).toBeInTheDocument()
    expect(screen.getByText('270', { exact: true })).toBeInTheDocument()
  })
})
