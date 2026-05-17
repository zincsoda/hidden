import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReloadPrompt from './ReloadPrompt.jsx'

const updateServiceWorker = vi.fn().mockResolvedValue(undefined)
const setNeedRefresh = vi.fn()

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options) => {
    queueMicrotask(() => options?.onRegistered?.(undefined))
    return {
      needRefresh: [true, setNeedRefresh],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    }
  },
}))

describe('ReloadPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('location', { ...window.location, reload: vi.fn() })
  })

  it('dismisses the banner and activates the waiting worker when Reload is tapped', async () => {
    const user = userEvent.setup()
    render(<ReloadPrompt />)

    await user.click(screen.getByRole('button', { name: 'Reload' }))

    expect(setNeedRefresh).toHaveBeenCalledWith(false)
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
    expect(screen.queryByText('New update available!')).not.toBeInTheDocument()
  })
})
