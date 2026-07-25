// 동선별 기대 총 소요시간 계산 엔진 (순수함수)
//
// 버스 leg의 기대시간 = 평균 대기(배차/2)
//                    + 만차로 보낼 기대 대수(패턴 확률 기반) × 배차간격
//                    + 정적 구간 소요시간
import { getRoute } from '../data/routes.js'
import { getDirection, defaultBinIndex, expectedBusesToBoard } from './patternStats.js'

/**
 * @param option  itineraries.js 의 option
 * @param dirKey  'commute' | 'return' — 패턴 조회 방향
 * @param date    기준 시각 (시간창 밖이면 피크 기준으로 계산됨)
 * @returns { totalMin, legs: [{...leg, computedMin, detail}], busNote }
 */
export function computeOption(option, dirKey, date = new Date()) {
  let totalMin = 0
  let busNote = null

  const legs = option.legs.map((leg) => {
    if (leg.type === 'walk') {
      totalMin += leg.min
      return { ...leg, computedMin: leg.min, detail: '도보' }
    }

    if (leg.type === 'subway') {
      const t = leg.min + (leg.wait || 0)
      totalMin += t
      return { ...leg, computedMin: t, detail: `대기 ~${leg.wait || 0}분 포함` }
    }

    // bus
    const route = getRoute(leg.routeKey)
    const direction = getDirection(leg.routeKey, dirKey)
    const headway = route.headwayPeakMin

    let pBoard = 1
    let binLabel = null
    if (direction) {
      const { binIdx } = defaultBinIndex(direction, date)
      binLabel = direction.bins[binIdx]
      const stat = direction.stats[leg.boardSeq]?.[binIdx]
      if (stat) pBoard = stat.pBoard
    }

    const expBuses = expectedBusesToBoard(pBoard)
    const waitFirst = headway / 2
    const fullPenalty = (expBuses - 1) * headway
    const t = Math.round(waitFirst + fullPenalty + leg.rideMin)
    totalMin += t

    const detailParts = [`대기 ~${Math.round(waitFirst)}분`]
    if (fullPenalty >= 1) {
      detailParts.push(`만차 예상 +${Math.round(fullPenalty)}분`)
      busNote = {
        routeName: route.routeName,
        pBoard,
        expBuses: expBuses.toFixed(1),
        penaltyMin: Math.round(fullPenalty),
        binLabel,
      }
    } else {
      detailParts.push(`좌석 확보 확률 ${Math.round(pBoard * 100)}%`)
    }
    return { ...leg, computedMin: t, detail: detailParts.join(' · ') }
  })

  return { totalMin: Math.round(totalMin), legs, busNote }
}

/** 시나리오의 모든 옵션을 계산하고 기대시간 오름차순 정렬 */
export function compareScenario(scenario, date = new Date()) {
  return scenario.options
    .map((opt) => ({ option: opt, ...computeOption(opt, scenario.direction, date) }))
    .sort((a, b) => a.totalMin - b.totalMin)
}
