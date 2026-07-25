import { useEffect, useRef, useState } from 'react'
import { useArrivals } from '../hooks/useArrivals.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { searchStations, NoApiKeyError } from '../api/gbis.js'
import StationPicker from '../components/StationPicker.jsx'
import ArrivalCard from '../components/ArrivalCard.jsx'
import { DEFAULT_STATION, ROUTES } from '../data/routes.js'

const LAST_KEY = 'bus.lastStation.v1'

function readLastStation() {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY)) || DEFAULT_STATION
  } catch {
    return DEFAULT_STATION
  }
}

export default function HomePage() {
  const [station, setStation] = useState(readLastStation)
  const { arrivals, loading, error, demo, lastUpdated, refresh } = useArrivals(station.stationId)
  const { favorites, toggle, isFavorite } = useFavorites()
  const [, forceTick] = useState(0)
  const upgradedRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(LAST_KEY, JSON.stringify(station))
  }, [station])

  // 기본 정류장이 데모(placeholder)면, API 키가 살아있는지 확인해
  // 실제 정류장으로 자동 전환 (키가 없으면 그대로 데모 모드)
  useEffect(() => {
    if (upgradedRef.current || !String(station.stationId).startsWith('demo-')) return
    upgradedRef.current = true
    searchStations(station.stationName)
      .then((results) => {
        const match =
          results.find((s) => s.stationName === station.stationName) || results[0]
        if (match) setStation(match)
      })
      .catch((err) => {
        if (!(err instanceof NoApiKeyError)) {
          /* 프록시 오류 → 데모 유지, 카드 영역에서 안내 */
        }
      })
  }, [station])

  // "n초 전 업데이트" 표시 갱신
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 5000)
    return () => clearInterval(t)
  }, [])

  const curatedNames = new Set(ROUTES.map((r) => r.routeName))
  const sorted = [...arrivals].sort((a, b) => {
    const ca = curatedNames.has(a.routeName) ? 0 : 1
    const cb = curatedNames.has(b.routeName) ? 0 : 1
    return ca - cb || (a.buses[0]?.predictTimeMin ?? 999) - (b.buses[0]?.predictTimeMin ?? 999)
  })

  const agoSec = lastUpdated ? Math.max(0, Math.round((Date.now() - lastUpdated) / 1000)) : null

  return (
    <>
      <h1 className="page-title">실시간 도착</h1>
      <p className="page-sub">정류장을 선택하면 노선별 도착시간과 잔여좌석을 보여드려요</p>

      {demo && (
        <div className="banner-demo">
          <strong>데모 모드</strong> — 시뮬레이션 데이터가 표시되고 있어요. API 키를 등록하면
          실제 실시간 정보로 바뀝니다.{' '}
          <a href="/api/gbis?op=health" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
            키 상태 확인
          </a>
        </div>
      )}

      <StationPicker onSelect={setStation} />

      {favorites.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {favorites.map((s) => (
            <button
              key={s.stationId}
              className={`chip ${s.stationId === station.stationId ? 'active' : ''}`}
              onClick={() => setStation(s)}
            >
              {s.stationName}
            </button>
          ))}
        </div>
      )}

      <div className="refresh-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span className="station-title">{station.stationName}</span>
          <button
            className={`btn-fav ${isFavorite(station.stationId) ? 'on' : ''}`}
            onClick={() => toggle(station)}
            aria-label="즐겨찾기"
          >
            ★
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {agoSec !== null && <span className="updated">{agoSec}초 전</span>}
          <button className="btn-refresh" onClick={refresh}>새로고침</button>
        </div>
      </div>

      {loading && <div className="loading">도착 정보를 불러오는 중이에요</div>}
      {error && (
        <div className="error-box">
          도착 정보를 가져오지 못했어요
          <br />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{error}</span>
          <br />
          <a href="/api/gbis?op=health" target="_blank" rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 700 }}>
            API 키 상태 진단하기
          </a>
        </div>
      )}
      {!loading && !error && sorted.length === 0 && (
        <div className="empty-state">
          지금 도착 예정인 버스가 없어요.
          <br />
          운행 시간이 아니거나 정류장 정보가 없는 경우예요.
        </div>
      )}
      {sorted.map((a) => (
        <ArrivalCard key={a.routeId} arrival={a} />
      ))}

      <div className="notice">
        잔여좌석은 직행좌석·광역급행(M버스) 노선에서만 제공됩니다. 호출 제한을 지키기 위해
        20초 간격으로 갱신하며, 화면이 백그라운드로 가면 갱신을 멈춥니다.
      </div>
    </>
  )
}
