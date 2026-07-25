import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ROUTES } from '../data/routes.js'
import {
  getDirection,
  defaultBinIndex,
  rankStations,
  backtrackSuggestion,
  PATTERN_SOURCE,
} from '../lib/patternStats.js'
import PatternHeatmap from '../components/PatternHeatmap.jsx'
import StationRankList from '../components/StationRankList.jsx'

// 현재 시각 기준 출근/퇴근 기본값 (정오 이전 = 출근)
const defaultDir = () => (new Date().getHours() < 12 ? 'commute' : 'return')

export default function PatternPage() {
  const [searchParams] = useSearchParams()
  const initialRoute = ROUTES.some((r) => r.key === searchParams.get('route'))
    ? searchParams.get('route')
    : ROUTES[0].key

  const [routeKey, setRouteKey] = useState(initialRoute)
  const [dir, setDir] = useState(defaultDir)

  const direction = getDirection(routeKey, dir)
  const initialBin = useMemo(() => defaultBinIndex(direction), [direction])
  const [binIdx, setBinIdx] = useState(null)
  const selectedBin = binIdx ?? initialBin.binIdx

  // 노선/방향이 바뀌면 bin 범위가 달라지므로 리셋
  const changeRoute = (key) => { setRouteKey(key); setBinIdx(null) }
  const changeDir = (d) => { setDir(d); setBinIdx(null) }

  const ranked = rankStations(direction, selectedBin)
  const worst = ranked[ranked.length - 1]
  const tip = backtrackSuggestion(direction, selectedBin, worst.seq)

  return (
    <>
      <h1 className="page-title">탑승 패턴</h1>
      <p className="page-sub">평일 시간대별로 어느 정류장에서 타야 앉을 수 있는지 보여드려요</p>

      <div className="chip-row" style={{ marginBottom: 12 }}>
        {ROUTES.map((r) => (
          <button
            key={r.key}
            className={`chip ${r.key === routeKey ? 'active' : ''}`}
            onClick={() => changeRoute(r.key)}
          >
            {r.routeName}
          </button>
        ))}
      </div>

      <div className="seg">
        <button className={dir === 'commute' ? 'active' : ''} onClick={() => changeDir('commute')}>
          출근 (서울 방면)
        </button>
        <button className={dir === 'return' ? 'active' : ''} onClick={() => changeDir('return')}>
          퇴근 (경기 방면)
        </button>
      </div>

      <div className="card">
        <div className="time-now">
          🕐 {direction.bins[selectedBin]} 기준
          {!initialBin.isNow && binIdx === null && ' (혼잡 피크 시간대)'}
        </div>
        <input
          className="time-slider"
          type="range"
          min={0}
          max={direction.bins.length - 1}
          value={selectedBin}
          onChange={(e) => setBinIdx(Number(e.target.value))}
        />
        <div className="time-slider-label">
          <span>{direction.bins[0]}</span>
          <span>{direction.bins[direction.bins.length - 1]}</span>
        </div>
      </div>

      <div className="card">
        <PatternHeatmap direction={direction} selectedBin={selectedBin} onSelectBin={setBinIdx} />
      </div>

      <div className="section-label">{direction.bins[selectedBin]} 좌석 확보 확률 순위</div>
      <div className="card">
        <StationRankList ranked={ranked} />
        {tip && (
          <div className="tip-box">
            💡 {worst.name}에서 {Math.round(worst.pBoard * 100)}%라면, {tip.name}까지 거슬러
            가서 타면 확률이 {Math.round(tip.pBoard * 100)}%로 +{tip.gainPp}%p 올라가요.
          </div>
        )}
      </div>

      <div className="notice">
        {PATTERN_SOURCE === 'simulated'
          ? '⚠️ 이 패턴은 프로토타입용 시뮬레이션 데이터입니다. 실제 수집 데이터가 쌓이면 같은 화면에서 실측 패턴으로 교체됩니다.'
          : '실측 수집 데이터 기반 패턴입니다.'}
      </div>
    </>
  )
}
