import { useEffect, useState } from 'react'
import { loadDeck, loadManifest } from './loader'
import type { Deck, Manifest } from './schema'

interface Remote<T> {
  data: T | null
  error: string | null
}

function useRemote<T>(load: () => Promise<T>, key: string): Remote<T> {
  const [state, setState] = useState<Remote<T>>({ data: null, error: null })

  useEffect(() => {
    let active = true
    setState({ data: null, error: null })
    load().then(
      (data) => {
        if (active) setState({ data, error: null })
      },
      (error: Error) => {
        if (active) setState({ data: null, error: error.message })
      },
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}

export function useManifest(): Remote<Manifest> {
  return useRemote(loadManifest, 'manifest')
}

export function useDeck(deckId: string): Remote<Deck> {
  return useRemote(() => loadDeck(deckId), deckId)
}
