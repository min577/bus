import { useEffect, useMemo, useState } from 'react'
import { SCENARIOS } from '../data/itineraries.js'
import { compareScenario } from '../lib/compare.js'
import { useCustomScenarios } from '../hooks/useCustomScenarios.js'
import ItineraryCard from '../components/ItineraryCard.jsx'
import CustomRouteBuilder from '../components/CustomRouteBuilder.jsx'

export default function ComparePage() {
  const { customScenarios, save, remove } = useCustomScenarios()
  const allScenarios = [...SCENARIOS, ...customScenarios]

  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key)
  const [building, setBuilding] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // 1분마다 재계산 (시간대가 바뀌면 만차 확률도 바뀜)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const scenario = allScenarios.find((s) => s.key === scenarioKey) || SCENARIOS[0]
  const results = useMemo(() => compareScenario(scenario, now), [scenario, now])
  const cheapest = Math.min(...results.map((r) => r.fare.totalKrw))

  const handleSave = (s) => {
    save(s)
    setScenarioKey(s.key)
    setBuilding(false)
  }

  const handleRemove = () => {
    remove(scenario.key)
    setScenarioKey(SCENARIOS[0].key)
  }

  return (
    <>
      <h1 className="page-title">동선 비교</h1>
      <p className="page-sub">
        직행을 기다릴까, 거슬러 탈까, 환승할까, 택시 탈까 — 만차 확률과 요금까지 넣어 비교해요
      </p>

      <div className="chip-row" style={{ marginBottom: 14 }}>
        {allScenarios.map((s) => (
          <button
            key={s.key}
            className={`chip ${s.key === scenarioKey ? 'active' : ''}`}
            onClick={() => { setScenarioKey(s.key); setBuilding(false) }}
          >
            {s.title}
          </button>
        ))}
        <button className={`chip ${building ? 'active' : ''}`} onClick={() => setBuilding(true)}>
          ＋ 내 경로
        </button>
      </div>

      {building ? (
        <CustomRouteBuilder onSave={handleSave} onCancel={() => setBuilding(false)} />
      ) : (
        <>
          {scenario.custom && (
            <div className="refresh-row">
              <span className="updated">내가 만든 경로</span>
              <button className="btn-refresh" onClick={handleRemove}>이 경로 삭제</button>
            </div>
          )}

          {results.map((r, i) => (
            <ItineraryCard
              key={r.option.key}
              result={r}
              isBest={i === 0}
              isCheapest={r.fare.totalKrw === cheapest}
            />
          ))}

          <div className="notice">
            기대시간 = 도보 + 평균 대기(배차간격/2) +{' '}
            <strong>만차로 보낼 기대 대수 × 배차간격</strong> + 구간 소요시간. 만차 확률은 탑승
            패턴(현재 시뮬레이션 데이터)에서 가져옵니다. 요금은 교통카드 성인 기준 예시값이며
            대중교통 환승할인은 근사 적용, 구간 소요시간·거리는 예시값입니다.
          </div>
        </>
      )}
    </>
  )
}
