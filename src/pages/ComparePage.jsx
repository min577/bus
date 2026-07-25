import { useEffect, useMemo, useState } from 'react'
import { SCENARIOS } from '../data/itineraries.js'
import { compareScenario } from '../lib/compare.js'
import ItineraryCard from '../components/ItineraryCard.jsx'

export default function ComparePage() {
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key)
  const [now, setNow] = useState(() => new Date())

  // 1분마다 재계산 (시간대가 바뀌면 만차 확률도 바뀜)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const scenario = SCENARIOS.find((s) => s.key === scenarioKey)
  const results = useMemo(() => compareScenario(scenario, now), [scenario, now])

  return (
    <>
      <h1 className="page-title">동선 비교</h1>
      <p className="page-sub">
        직행을 기다릴까, 거슬러 탈까, 환승할까 — 만차 확률까지 넣어 기대시간을 비교해요
      </p>

      <div className="chip-row" style={{ marginBottom: 14 }}>
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            className={`chip ${s.key === scenarioKey ? 'active' : ''}`}
            onClick={() => setScenarioKey(s.key)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {results.map((r, i) => (
        <ItineraryCard key={r.option.key} result={r} isBest={i === 0} />
      ))}

      <div className="notice">
        기대시간 = 도보 + 평균 대기(배차간격/2) + <strong>만차로 보낼 기대 대수 × 배차간격</strong> +
        구간 소요시간. 만차 확률은 탑승 패턴(현재 시뮬레이션 데이터)에서 가져옵니다. 구간
        소요시간은 예시값이며, 길찾기 API 연동 시 실측값으로 교체할 수 있어요.
      </div>
    </>
  )
}
