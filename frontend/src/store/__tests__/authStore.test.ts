import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    localStorage.clear()
  })

  it('sets and clears auth data', () => {
    const user = { id: 1, name: 'John', email: 'john@example.com', roles: ['ROLE_ADMIN'] }
    useAuthStore.getState().setAuth(user, 'token')

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.token).toBe('token')
    expect(state.isAuthenticated).toBe(true)

    state.clearAuth()
    const cleared = useAuthStore.getState()
    expect(cleared.user).toBeNull()
    expect(cleared.token).toBeNull()
    expect(cleared.isAuthenticated).toBe(false)
  })

  it('checks user roles', () => {
    const user = { id: 1, name: 'John', email: 'john@example.com', roles: ['ROLE_ADMIN'] }
    useAuthStore.getState().setAuth(user, 'token')

    expect(useAuthStore.getState().hasRole('ADMIN')).toBe(true)
    expect(useAuthStore.getState().hasRole('STUDENT')).toBe(false)
  })
})
