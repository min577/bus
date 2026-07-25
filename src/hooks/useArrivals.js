import { useCallback, useEffect, useRef, useState } from 'react'
import { getArrivals, NoApiKeyError } from '../api/gbis.js'
import { getMockArrivals } from '../api/mock.js'

const POLL_MS = 20000 // GBIS 개발계정 일 1,000회 제한 → 20초 간격

/**
 * 정류장 도착정보 폴링.
 * - 화면 비활성(Page Visibility) 시 폴링 중단
 * - API 키 미설정/프록시 실패 시 데모 모드로 폴백
 */
export function useArrivals(stationId) {
  const [state, setState] = useState({
    arrivals: [],
    loading: true,
    error: null,
    demo: false,
    lastUpdated: null,
  })
  const timerRef = useRef(null)

  const load = useCallback(async () => {
    if (!stationId) return
    try {
      const isDemoStation = String(stationId).startsWith('demo-')
      const arrivals = isDemoStation ? getMockArrivals() : await getArrivals(stationId)
      setState({ arrivals, loading: false, error: null, demo: isDemoStation, lastUpdated: Date.now() })
    } catch (err) {
      if (err instanceof NoApiKeyError) {
        setState({ arrivals: getMockArrivals(), loading: false, error: null, demo: true, lastUpdated: Date.now() })
      } else {
        setState((s) => ({ ...s, loading: false, error: err.message }))
      }
    }
  }, [stationId])

  useEffect(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    load()

    const tick = () => {
      if (document.visibilityState === 'visible') load()
    }
    timerRef.current = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  return { ...state, refresh: load }
}
