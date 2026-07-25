import { useState } from 'react'
import { ROUTES } from '../data/routes.js'

// 사용자가 도보/광역버스/지하철/택시 구간을 조합해 비교 시나리오를 만드는 폼

const stationsFor = (routeKey, direction) => {
  const route = ROUTES.find((r) => r.key === routeKey)
  if (!route) return []
  return direction === 'return' ? route.returnStations : route.boardingStations
}

const newLeg = (type, direction) => {
  switch (type) {
    case 'walk':
      return { type, label: '도보 이동', min: 5 }
    case 'bus': {
      const routeKey = ROUTES[0].key
      const st = stationsFor(routeKey, direction)[0]
      return { type, routeKey, boardSeq: st.seq, rideMin: 50, label: '' }
    }
    case 'subway':
      return { type, label: '지하철', min: 30, wait: 4, km: 20 }
    case 'taxi':
      return { type, label: '택시', min: 40, km: 30 }
    default:
      throw new Error(type)
  }
}

const busLabel = (leg, direction) => {
  const st = stationsFor(leg.routeKey, direction).find((s) => s.seq === leg.boardSeq)
  return `${leg.routeKey} (${st ? st.name : ''} 승차)`
}

function LegEditor({ leg, direction, onChange, onRemove }) {
  const set = (patch) => onChange({ ...leg, ...patch })
  return (
    <div className="leg-editor">
      <div className="leg-editor-head">
        <span className="leg-editor-type">
          <span className={`leg-mode ${leg.type}`}>
            {{ walk: '도보', bus: '버스', subway: '지하철', taxi: '택시' }[leg.type]}
          </span>
          {{ walk: '도보 이동', bus: '광역버스', subway: '지하철', taxi: '택시' }[leg.type]}
        </span>
        <button type="button" className="btn-mini danger" onClick={onRemove}>삭제</button>
      </div>

      {leg.type === 'bus' ? (
        <div className="form-grid">
          <label>
            노선
            <select
              value={leg.routeKey}
              onChange={(e) => {
                const routeKey = e.target.value
                set({ routeKey, boardSeq: stationsFor(routeKey, direction)[0].seq })
              }}
            >
              {ROUTES.map((r) => (
                <option key={r.key} value={r.key}>{r.routeName} ({r.origin}→{r.destination})</option>
              ))}
            </select>
          </label>
          <label>
            승차 정류장
            <select value={leg.boardSeq} onChange={(e) => set({ boardSeq: Number(e.target.value) })}>
              {stationsFor(leg.routeKey, direction).map((s) => (
                <option key={s.seq} value={s.seq}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            구간 소요(분)
            <input type="number" min="1" value={leg.rideMin}
              onChange={(e) => set({ rideMin: Number(e.target.value) })} />
          </label>
        </div>
      ) : (
        <div className="form-grid">
          <label>
            구간 이름
            <input type="text" value={leg.label} onChange={(e) => set({ label: e.target.value })} />
          </label>
          <label>
            소요(분)
            <input type="number" min="1" value={leg.min}
              onChange={(e) => set({ min: Number(e.target.value) })} />
          </label>
          {leg.type === 'subway' && (
            <label>
              평균 대기(분)
              <input type="number" min="0" value={leg.wait}
                onChange={(e) => set({ wait: Number(e.target.value) })} />
            </label>
          )}
          {(leg.type === 'subway' || leg.type === 'taxi') && (
            <label>
              거리(km)
              <input type="number" min="0" value={leg.km}
                onChange={(e) => set({ km: Number(e.target.value) })} />
            </label>
          )}
        </div>
      )}
    </div>
  )
}

export default function CustomRouteBuilder({ onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [direction, setDirection] = useState(new Date().getHours() < 12 ? 'commute' : 'return')
  const [options, setOptions] = useState([{ title: '동선 1', legs: [] }])
  const [error, setError] = useState(null)

  const setOption = (i, patch) =>
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)))

  const submit = () => {
    if (!title.trim()) return setError('경로 이름을 입력해주세요 (예: 우리집 → 회사)')
    if (options.some((o) => o.legs.length === 0)) return setError('구간이 비어 있는 동선이 있어요')
    const scenario = {
      key: `custom-${Date.now()}`,
      title: title.trim(),
      direction,
      custom: true,
      options: options.map((o, i) => ({
        key: `opt-${i}`,
        title: o.title.trim() || `동선 ${i + 1}`,
        legs: o.legs.map((leg) =>
          leg.type === 'bus' ? { ...leg, label: busLabel(leg, direction) } : leg,
        ),
      })),
    }
    onSave(scenario)
  }

  return (
    <div className="card builder">
      <div className="itin-head">
        <span className="itin-title">내 경로 만들기</span>
        <button type="button" className="btn-mini" onClick={onCancel}>닫기</button>
      </div>

      <div className="form-grid" style={{ marginBottom: 10 }}>
        <label>
          경로 이름
          <input type="text" placeholder="예: 우리집 → 회사" value={title}
            onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>

      <div className="seg" style={{ marginBottom: 12 }}>
        <button type="button" className={direction === 'commute' ? 'active' : ''}
          onClick={() => setDirection('commute')}>출근 (서울 방면)</button>
        <button type="button" className={direction === 'return' ? 'active' : ''}
          onClick={() => setDirection('return')}>퇴근 (경기 방면)</button>
      </div>

      {options.map((opt, i) => (
        <div key={i} className="builder-option">
          <div className="form-grid">
            <label>
              동선 이름
              <input type="text" value={opt.title}
                onChange={(e) => setOption(i, { title: e.target.value })} />
            </label>
          </div>
          {opt.legs.map((leg, j) => (
            <LegEditor
              key={j}
              leg={leg}
              direction={direction}
              onChange={(next) =>
                setOption(i, { legs: opt.legs.map((l, k) => (k === j ? next : l)) })
              }
              onRemove={() => setOption(i, { legs: opt.legs.filter((_, k) => k !== j) })}
            />
          ))}
          <div className="chip-row" style={{ marginTop: 8 }}>
            {['walk', 'bus', 'subway', 'taxi'].map((t) => (
              <button key={t} type="button" className="chip"
                onClick={() => setOption(i, { legs: [...opt.legs, newLeg(t, direction)] })}>
                + {{ walk: '도보', bus: '광역버스', subway: '지하철', taxi: '택시' }[t]}
              </button>
            ))}
            {options.length > 1 && (
              <button type="button" className="chip"
                onClick={() => setOptions((prev) => prev.filter((_, k) => k !== i))}>
                동선 삭제
              </button>
            )}
          </div>
        </div>
      ))}

      <button type="button" className="btn-block ghost"
        onClick={() => setOptions((prev) => [...prev, { title: `동선 ${prev.length + 1}`, legs: [] }])}>
        + 비교할 동선 추가
      </button>

      {error && <div className="error-box" style={{ padding: '10px 0 0' }}>{error}</div>}

      <button type="button" className="btn-block" onClick={submit}>저장하고 비교하기</button>
    </div>
  )
}
