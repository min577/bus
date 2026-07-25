import { useCallback, useState } from 'react'

const KEY = 'bus.favorites.v1'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

/** 즐겨찾기 정류장 (localStorage) */
export function useFavorites() {
  const [favorites, setFavorites] = useState(read)

  const toggle = useCallback((station) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.stationId === station.stationId)
      const next = exists
        ? prev.filter((s) => s.stationId !== station.stationId)
        : [...prev, station].slice(-8)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (stationId) => favorites.some((s) => s.stationId === stationId),
    [favorites],
  )

  return { favorites, toggle, isFavorite }
}
