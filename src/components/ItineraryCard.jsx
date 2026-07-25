import { formatKrw } from '../lib/fare.js'

const LEG_COLORS = { walk: '#9e9e9e', bus: '#c62828', subway: '#1565c0', taxi: '#f9a825' }
const LEG_ICONS = { walk: '🚶', bus: '🚌', subway: '🚇', taxi: '🚕' }

export default function ItineraryCard({ result, isBest, isCheapest }) {
  const { option, totalMin, fare, legs, busNote } = result
  return (
    <div className={`card itin-card ${isBest ? 'best' : ''}`}>
      {isBest && <span className="best-badge">지금 기준 최속</span>}
      <div className="itin-head">
        <span className="itin-title">{option.title}</span>
        <span style={{ textAlign: 'right' }}>
          <div className="itin-total">
            {totalMin}분 <small>예상</small>
          </div>
          <div className={`itin-fare ${isCheapest ? 'cheapest' : ''}`}>
            {formatKrw(fare.totalKrw)}
            {isCheapest && ' · 최저가'}
          </div>
        </span>
      </div>
      <div className="leg-list">
        {legs.map((leg, i) => (
          <div key={i} className="leg">
            <span className="leg-dot" style={{ background: LEG_COLORS[leg.type] }} />
            {i < legs.length - 1 && <span className="leg-line" />}
            <div className="leg-body">
              <div className="leg-title">
                {LEG_ICONS[leg.type]} {leg.label}
              </div>
              <div className="leg-sub">{leg.detail}</div>
            </div>
            <span className="leg-time">{leg.computedMin}분</span>
          </div>
        ))}
      </div>
      {busNote && (
        <div className="itin-note">
          {busNote.binLabel} 기준 {busNote.routeName} 좌석 확보 확률이{' '}
          {Math.round(busNote.pBoard * 100)}%라 평균 {busNote.expBuses}대째에 탑승 — 만차 대기
          약 {busNote.penaltyMin}분이 더해진 값이에요.
        </div>
      )}
      {fare.hasTaxi && (
        <div className="itin-note">
          택시 요금은 주간 중형 기준 추정치예요 (심야·시계외 할증, 호출비 미포함).
        </div>
      )}
    </div>
  )
}
