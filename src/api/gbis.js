// GBIS 프록시(/api/gbis) 클라이언트 + 응답 정규화

export class NoApiKeyError extends Error {
  constructor() {
    super('API 키가 설정되지 않았습니다.')
    this.code = 'NO_API_KEY'
  }
}

async function call(op, params = {}) {
  const qs = new URLSearchParams({ op, ...params })
  const res = await fetch(`/api/gbis?${qs}`)
  let data = null
  try {
    data = await res.json()
  } catch {
    /* 아래에서 처리 */
  }
  if (res.status === 503 && data?.error === 'NO_API_KEY') throw new NoApiKeyError()
  if (!res.ok || !data || data.resultCode !== 0) {
    throw new Error(data?.message || `GBIS 호출 실패 (${res.status})`)
  }
  return data.body
}

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// 잔여좌석: -1 = 정보없음 → null
const seat = (v) => {
  const n = num(v)
  return n === null || n < 0 ? null : n
}

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])

/** 정류장 키워드 검색 */
export async function searchStations(keyword) {
  const body = await call('stationSearch', { keyword })
  return asList(body.busStationList).map((s) => ({
    stationId: String(s.stationId),
    stationName: s.stationName,
    mobileNo: s.mobileNo ? String(s.mobileNo).trim() : null,
    regionName: s.regionName || '',
  }))
}

/** 정류장 도착정보 (노선별 1·2번째 버스) */
export async function getArrivals(stationId) {
  const body = await call('arrivalList', { stationId })
  return asList(body.busArrivalList).map((a) => ({
    routeId: String(a.routeId),
    routeName: a.routeName ? String(a.routeName) : String(a.routeId),
    routeDestName: a.routeDestName || '',
    flag: a.flag || 'RUN',
    buses: [
      {
        predictTimeMin: num(a.predictTime1),
        locationNo: num(a.locationNo1),
        remainSeat: seat(a.remainSeatCnt1),
        plateNo: a.plateNo1 || null,
      },
      {
        predictTimeMin: num(a.predictTime2),
        locationNo: num(a.locationNo2),
        remainSeat: seat(a.remainSeatCnt2),
        plateNo: a.plateNo2 || null,
      },
    ].filter((b) => b.predictTimeMin !== null),
  }))
}

/** 노선번호 검색 (routeId 확보용) */
export async function searchRoutes(keyword) {
  const body = await call('routeSearch', { keyword })
  return asList(body.busRouteList).map((r) => ({
    routeId: String(r.routeId),
    routeName: String(r.routeName),
    regionName: r.regionName || '',
  }))
}
