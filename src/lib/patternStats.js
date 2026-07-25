// patterns.json 조회 + 탑승확률 관련 계산
import patterns from '../data/patterns.json'

export const PATTERN_SOURCE = patterns.source // 'simulated' | 'observed'

export function getPatternRoute(key) {
  return patterns.routes.find((r) => r.key === key) || null
}

export function getDirection(key, dir) {
  const route = getPatternRoute(key)
  return route ? route.directions[dir] : null
}

const binToMinutes = (bin) => {
  const [h, m] = bin.split(':').map(Number)
  return h * 60 + m
}

/** 현재 시각과 가장 가까운 bin 인덱스. 시간창 밖이면 피크 bin으로 폴백 */
export function defaultBinIndex(direction, date = new Date()) {
  const nowMin = date.getHours() * 60 + date.getMinutes()
  const mins = direction.bins.map(binToMinutes)
  const first = mins[0]
  const last = mins[mins.length - 1]
  if (nowMin >= first && nowMin <= last) {
    let best = 0
    mins.forEach((m, i) => {
      if (Math.abs(m - nowMin) < Math.abs(mins[best] - nowMin)) best = i
    })
    return { binIdx: best, isNow: true }
  }
  // 시간창 밖 → 가장 혼잡한(전체 평균 pBoard 최저) bin = 피크
  let peak = 0
  let peakAvg = Infinity
  direction.bins.forEach((_, i) => {
    const avg = avgBoardProb(direction, i)
    if (avg < peakAvg) {
      peakAvg = avg
      peak = i
    }
  })
  return { binIdx: peak, isNow: false }
}

export function avgBoardProb(direction, binIdx) {
  const ps = direction.stations.map((st) => direction.stats[st.seq][binIdx].pBoard)
  return ps.reduce((s, v) => s + v, 0) / ps.length
}

/** 선택 시간대 기준 정류장 순위 (탑승확률 내림차순) */
export function rankStations(direction, binIdx) {
  return direction.stations
    .map((st) => ({
      seq: st.seq,
      name: st.name,
      ...direction.stats[st.seq][binIdx],
    }))
    .sort((a, b) => b.pBoard - a.pBoard || a.seq - b.seq)
}

/**
 * "한두 정류장 거슬러 가면 얼마나 유리한가" 제안.
 * targetSeq(내 정류장)보다 앞선 정류장 중 확률 이득이 가장 큰 곳을 찾는다.
 */
export function backtrackSuggestion(direction, binIdx, targetSeq) {
  const target = direction.stations.find((s) => s.seq === targetSeq)
  if (!target) return null
  const targetP = direction.stats[targetSeq][binIdx].pBoard
  let best = null
  for (const st of direction.stations) {
    if (st.seq >= targetSeq) continue
    const p = direction.stats[st.seq][binIdx].pBoard
    const gain = p - targetP
    if (gain > 0.05 && (!best || p > best.pBoard)) {
      best = { name: st.name, seq: st.seq, pBoard: p, gainPp: Math.round(gain * 100) }
    }
  }
  return best
}

/** 만차 확률 기반, 탑승까지 보내야 하는 기대 버스 대수 (첫 차 포함) */
export function expectedBusesToBoard(pBoard) {
  const p = Math.max(0.05, Math.min(1, pBoard))
  return 1 / p
}
