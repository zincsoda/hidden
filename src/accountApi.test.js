import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ACCOUNT_SLUG,
  DELETE_ACCOUNT_URL,
  DELETE_ACCOUNT_WARNING,
  clearLocalAppData,
  deleteAccount,
} from './accountApi.js'
import { LAST_DISPLAYED_VERSE_KEY } from './lastDisplayedVerse.js'
import { APP_BACKGROUND_STORAGE_KEY } from './overlayBackdrop.js'

describe('accountApi', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(LAST_DISPLAYED_VERSE_KEY, '{"reference":"A","text":"t"}')
    localStorage.setItem('verseFontScale', '3')
    localStorage.setItem(APP_BACKGROUND_STORAGE_KEY, '2')
    localStorage.setItem('displayMode', 'large')
    sessionStorage.setItem('ga_standalone_session_tracked', '1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('targets the sheet account slug used by memory verses', () => {
    expect(ACCOUNT_SLUG).toBe('ksr')
    expect(DELETE_ACCOUNT_URL).toContain('/ksr/')
  })

  it('describes permanent deletion consequences', () => {
    expect(DELETE_ACCOUNT_WARNING).toMatch(/permanently deletes/i)
    expect(DELETE_ACCOUNT_WARNING).toMatch(/cannot be undone/i)
  })

  it('clearLocalAppData removes known app storage keys', () => {
    clearLocalAppData()
    expect(localStorage.getItem(LAST_DISPLAYED_VERSE_KEY)).toBeNull()
    expect(localStorage.getItem('verseFontScale')).toBeNull()
    expect(localStorage.getItem(APP_BACKGROUND_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('displayMode')).toBeNull()
    expect(sessionStorage.getItem('ga_standalone_session_tracked')).toBeNull()
  })

  it('deleteAccount sends DELETE to the account URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await deleteAccount()

    expect(fetchMock).toHaveBeenCalledWith(DELETE_ACCOUNT_URL, { method: 'DELETE' })
  })

  it('deleteAccount throws when the server rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ Message: 'Unavailable' }),
      }),
    )

    await expect(deleteAccount()).rejects.toThrow(/Could not delete account \(503\): Unavailable/)
  })
})
