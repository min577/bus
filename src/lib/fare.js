// 요금 계산 (교통카드 성인 기준 예시값 — 여기 상수만 고치면 전체 반영)
//
// 대중교통은 수도권 통합환승할인을 근사 적용:
//   총요금 ≈ 구간 중 가장 비싼 기본요금 1회 + 각 구간 거리 추가요금 합
// 택시는 환승할인 대상이 아니므로 별도 합산.

export const FARES = {
  busExpress: 3050, // 광역급행(M)·직행좌석
  busLocal: 1500, // 일반시내·마을버스
  subwayBase: 1550, // 지하철 기본(10km 이내)
  subwayPer5km: 100, // 10km 초과 5km마다
  taxiBase: 4800, // 중형택시 기본요금 (1.6km까지)
  taxiPerKm: 800, // 거리요금 근사 (거리+시간 병산 뭉뚱그림)
  taxiPerMin: 50, // 저속·정체 시간요금 근사
}

const roundTo100 = (v) => Math.round(v / 100) * 100

/** leg 하나의 (기본요금, 거리추가요금) — 대중교통만 */
function transitFareOf(leg) {
  if (leg.type === 'bus') {
    return { base: leg.busClass === 'local' ? FARES.busLocal : FARES.busExpress, extra: 0 }
  }
  if (leg.type === 'subway') {
    const km = leg.km || 0
    const extra = km > 10 ? Math.ceil((km - 10) / 5) * FARES.subwayPer5km : 0
    return { base: FARES.subwayBase, extra }
  }
  return null
}

export function taxiFare(leg) {
  const km = leg.km || 0
  const extraKm = Math.max(0, km - 1.6)
  return roundTo100(FARES.taxiBase + extraKm * FARES.taxiPerKm + (leg.min || 0) * FARES.taxiPerMin)
}

/**
 * 옵션 전체 요금.
 * @returns { totalKrw, transitKrw, taxiKrw, hasTaxi }
 */
export function computeFare(legs) {
  let maxBase = 0
  let extras = 0
  let taxiKrw = 0
  for (const leg of legs) {
    if (leg.type === 'taxi') {
      taxiKrw += taxiFare(leg)
      continue
    }
    const f = transitFareOf(leg)
    if (f) {
      maxBase = Math.max(maxBase, f.base)
      extras += f.extra
    }
  }
  const transitKrw = maxBase + extras
  return { totalKrw: transitKrw + taxiKrw, transitKrw, taxiKrw, hasTaxi: taxiKrw > 0 }
}

export const formatKrw = (v) => `${v.toLocaleString('ko-KR')}원`
