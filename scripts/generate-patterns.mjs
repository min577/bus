// 시간대별 탑승 패턴 시뮬레이션 데이터 생성기
//
// 실제 이력 데이터가 쌓이기 전까지 프로토타입에서 쓸 패턴을 만든다.
// 모델: 정류장별 승차 수요 = 가우시안 출퇴근 시간 프로파일 × 정류장 가중치 × 일자 요인 × 포아송 노이즈
//       버스는 seq 순서로 정류장을 지나며 좌석이 누적 소진 → "뒤 정류장일수록 만차" 재현
// 출력 스키마는 source 필드로 구분되므로, 추후 실측 데이터를 같은 스키마로 집계해 교체하면 된다.
//
// 실행: npm run generate:patterns  →  src/data/patterns.json

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ROUTES } from '../src/data/routes.js'

const SIM_DAYS = 60 // 가상 평일 수
const BIN_MIN = 10 // 10분 단위

// 재현 가능한 시드 RNG (mulberry32)
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(20260725)

// 포아송 샘플 (Knuth)
function poisson(lambda) {
  if (lambda <= 0) return 0
  if (lambda > 30) {
    // 정규 근사
    const n = Math.round(lambda + Math.sqrt(lambda) * (rng() * 2 - 1) * 1.2)
    return Math.max(0, n)
  }
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= rng()
  } while (p > L)
  return k - 1
}

const gauss = (h, center, width) => Math.exp(-((h - center) ** 2) / (2 * width ** 2))

// 방향별 시간창과 수요 프로파일 (0~1, 피크에서 1)
const DIRECTIONS = {
  commute: {
    label: '출근 (서울 방면)',
    startH: 5.5,
    endH: 10.5,
    profile: (h) => 0.12 + 0.88 * gauss(h, 7.9, 0.75), // 07:30~08:30 피크
    stationsKey: 'boardingStations',
    headwayKey: 'headwayPeakMin',
  },
  return: {
    label: '퇴근 (경기 방면)',
    startH: 16.5,
    endH: 23.0,
    profile: (h) => 0.12 + 0.88 * gauss(h, 18.4, 0.9), // 18:00~19:00 피크
    stationsKey: 'returnStations',
    headwayKey: 'headwayPeakMin',
  },
}

const fmt = (h) => {
  const hh = String(Math.floor(h)).padStart(2, '0')
  const mm = String(Math.round((h % 1) * 60)).padStart(2, '0')
  return `${hh}:${mm}`
}

const quantile = (sortedArr, q) => {
  const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.round(q * (sortedArr.length - 1))))
  return sortedArr[idx]
}

function simulateDirection(route, dir) {
  const stations = route[dir.stationsKey]
  const bins = []
  for (let h = dir.startH; h < dir.endH - 1e-9; h += BIN_MIN / 60) bins.push(h)

  const sumWeight = stations.reduce((s, st) => s + st.weight, 0)
  // 피크에 총 수요가 정원의 ~1.35배가 되도록 보정 → 피크엔 중후반 정류장에서 만차 발생
  const demandPerWeightAtPeak = (route.capacity * 1.35) / sumWeight

  // stats[seq][binIdx] = { seatsBefore: [], boardProb: [] }
  const samples = stations.map(() => bins.map(() => ({ seats: [], pBoard: [] })))

  for (let day = 0; day < SIM_DAYS; day++) {
    const dayFactor = 0.8 + rng() * 0.45 // 요일·날씨 등 일자 요인
    bins.forEach((binH, binIdx) => {
      const level = dir.profile(binH + BIN_MIN / 120) * dayFactor
      let seats = route.capacity
      stations.forEach((st, i) => {
        const lambda = demandPerWeightAtPeak * st.weight * level
        const demand = poisson(lambda)
        const seatsBefore = seats
        const boarded = Math.min(seats, demand)
        seats -= boarded
        // 이 정류장에서 줄 선 사람 1명이 좌석을 얻을 확률 근사
        const p = demand === 0 ? (seatsBefore > 0 ? 1 : 0) : Math.min(1, seatsBefore / demand)
        samples[i][binIdx].seats.push(seatsBefore)
        samples[i][binIdx].pBoard.push(p)
      })
    })
  }

  const stats = {}
  stations.forEach((st, i) => {
    stats[st.seq] = {}
    bins.forEach((_, binIdx) => {
      const cell = samples[i][binIdx]
      const sortedSeats = [...cell.seats].sort((a, b) => a - b)
      stats[st.seq][binIdx] = {
        pBoard: Number((cell.pBoard.reduce((s, v) => s + v, 0) / cell.pBoard.length).toFixed(3)),
        seatMed: quantile(sortedSeats, 0.5),
        seatP10: quantile(sortedSeats, 0.1),
        seatP90: quantile(sortedSeats, 0.9),
        n: cell.seats.length,
      }
    })
  })

  return {
    label: dir.label,
    bins: bins.map(fmt),
    stations: stations.map((st) => ({ seq: st.seq, name: st.name, stationId: st.stationId })),
    stats,
  }
}

const out = {
  schemaVersion: 1,
  source: 'simulated',
  simDays: SIM_DAYS,
  binMinutes: BIN_MIN,
  routes: ROUTES.map((r) => ({
    key: r.key,
    routeName: r.routeName,
    capacity: r.capacity,
    headwayPeakMin: r.headwayPeakMin,
    headwayOffMin: r.headwayOffMin,
    directions: {
      commute: simulateDirection(r, DIRECTIONS.commute),
      return: simulateDirection(r, DIRECTIONS.return),
    },
  })),
}

const dest = join(dirname(fileURLToPath(import.meta.url)), '../src/data/patterns.json')
writeFileSync(dest, JSON.stringify(out))
console.log(`patterns.json 생성 완료 → ${dest}`)
for (const r of out.routes) {
  const c = r.directions.commute
  const peakIdx = c.bins.indexOf('08:00')
  const first = c.stats[c.stations[0].seq][peakIdx]
  const last = c.stats[c.stations[c.stations.length - 1].seq][peakIdx]
  console.log(
    `${r.routeName} 08:00 — ${c.stations[0].name} p=${first.pBoard} / ${c.stations.at(-1).name} p=${last.pBoard}`,
  )
}
