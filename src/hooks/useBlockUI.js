// useBlockUI — convenience hook for showing the global blocking overlay
// during long-running operations.
//
// Usage:
//   const { block, unblock, withBlock } = useBlockUI()
//   await withBlock('Generating PDF…', async () => {
//     // … long operation
//   })
//
// OR manually:
//   block('Saving shipment…')
//   try { await save() } finally { unblock() }

import { useCallback } from 'react'
import useRBACStore from '../store/rbacStore'

export default function useBlockUI() {
  const setLoading = useRBACStore(s => s.setLoading)

  const block   = useCallback((msg = 'Loading…') => setLoading(true, msg), [setLoading])
  const unblock = useCallback(()                 => setLoading(false, ''), [setLoading])

  // Wrap an async operation so the overlay shows for its lifetime
  const withBlock = useCallback(async (msg, fn) => {
    block(msg)
    try {
      return await fn()
    } finally {
      unblock()
    }
  }, [block, unblock])

  return { block, unblock, withBlock }
}
