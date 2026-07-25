// 데모 모드: API 키가 없을 때 실제와 유사한 도착정보를 생성
import { ROUTES } from '../data/routes.js'

// 시간대에 따른 만차 정도(0~1): 출퇴근 피크에 좌석이 급감하는 모습을 재현
function crowdLevel(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60
  const peak = (center, width) => Math.exp(-((h - center) ** 2) / (2 * width ** 2))
  return Math.min(1, peak(8, 0.9) * 1.0 + peak(18.5, 1.1) * 0.9)
}

const jitter = (n) => Math.max(0, Math.round(n + (Math.random() - 0.5) * n * 0.5))

export function getMockArrivals() {
  const crowd = crowdLevel()
  return ROUTES.map((r, i) => {
    const base = Math.round(r.capacity * (1 - crowd))
    const makeBus = (offsetMin) => {
      const remain = jitter(Math.max(0, base - i * 3))
      return {
        predictTimeMin: offsetMin + jitter(3) + i * 2,
        locationNo: 2 + jitter(4),
        remainSeat: crowd > 0.75 && Math.random() < 0.6 ? 0 : remain,
        plateNo: null,
      }
    }
    return {
      routeId: `demo-${r.key}`,
      routeName: r.routeName,
      routeDestName: r.destination,
      flag: 'RUN',
      buses: [makeBus(2), makeBus(2 + r.headwayPeakMin)],
    }
  })
}

export function getMockStations(keyword) {
  const pool = [
    { stationId: 'demo-yeongtong', stationName: '영통역', mobileNo: '04227', regionName: '수원' },
    { stationId: 'demo-cheongmyeong', stationName: '청명역', mobileNo: '04228', regionName: '수원' },
    { stationId: 'demo-khu', stationName: '경희대차고지', mobileNo: '04101', regionName: '용인' },
    { stationId: 'demo-ajou', stationName: '아주대학교입구', mobileNo: '03110', regionName: '수원' },
  ]
  return pool.filter((s) => s.stationName.includes(keyword))
}
