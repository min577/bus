import { Link } from 'react-router-dom'
import SeatBadge from './SeatBadge.jsx'
import { ROUTES } from '../data/routes.js'

function BusRow({ bus }) {
  return (
    <div className="bus-row">
      <span className="eta">
        {bus.predictTimeMin <= 1 ? '곧 도착' : `${bus.predictTimeMin}분`}
      </span>
      <span className="loc">
        {bus.locationNo !== null ? `${bus.locationNo}정류장 전` : ''}
      </span>
      <SeatBadge remainSeat={bus.remainSeat} />
    </div>
  )
}

export default function ArrivalCard({ arrival }) {
  const curated = ROUTES.find((r) => r.routeName === arrival.routeName)
  const firstBusFull = arrival.buses[0]?.remainSeat === 0

  return (
    <div className="card arrival-card">
      <div className="arrival-head">
        <span className="route-name">{arrival.routeName}</span>
        <span className="route-dest">
          {arrival.routeDestName ? `${arrival.routeDestName} 방면` : ''}
        </span>
      </div>
      {arrival.buses.length === 0 ? (
        <div className="bus-row"><span className="loc">도착 예정 버스 없음</span></div>
      ) : (
        arrival.buses.map((bus, i) => <BusRow key={i} bus={bus} />)
      )}
      {firstBusFull && curated && (
        <Link className="full-link" to={`/pattern?route=${curated.key}`}>
          만차네요 — 어디서 타면 앉을 수 있는지 패턴 보기 →
        </Link>
      )}
    </div>
  )
}
