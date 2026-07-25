// 정류장(세로) × 시간대(가로) 탑승확률 히트맵 — 의존성 없는 커스텀 SVG

const lerp = (a, b, t) => Math.round(a + (b - a) * t)
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`
const RED = [198, 40, 40]
const ORANGE = [249, 168, 37]
const GREEN = [46, 125, 50]

export function probColor(p) {
  const [from, to, t] = p <= 0.5 ? [RED, ORANGE, p / 0.5] : [ORANGE, GREEN, (p - 0.5) / 0.5]
  return rgb([lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)])
}

const CELL_W = 15
const CELL_H = 24
const LABEL_W = 104
const TOP_H = 20

export default function PatternHeatmap({ direction, selectedBin, onSelectBin }) {
  const { stations, bins, stats } = direction
  const width = LABEL_W + bins.length * CELL_W
  const height = TOP_H + stations.length * CELL_H

  return (
    <div className="heatmap-wrap">
      <svg width={width} height={height} role="img" aria-label="시간대별 탑승확률 히트맵">
        {/* 시간 라벨 (정시마다) */}
        {bins.map((b, i) =>
          b.endsWith(':00') ? (
            <text key={b} x={LABEL_W + i * CELL_W + 1} y={13} fontSize="10" fill="#6b7280">
              {b.slice(0, 2)}시
            </text>
          ) : null,
        )}
        {stations.map((st, row) => (
          <g key={st.seq}>
            <text
              x={LABEL_W - 8}
              y={TOP_H + row * CELL_H + CELL_H / 2 + 4}
              fontSize="11"
              fontWeight="600"
              textAnchor="end"
              fill="#1a1d21"
            >
              {st.name.length > 8 ? `${st.name.slice(0, 8)}…` : st.name}
            </text>
            {bins.map((_, col) => (
              <rect
                key={col}
                x={LABEL_W + col * CELL_W}
                y={TOP_H + row * CELL_H}
                width={CELL_W - 1.5}
                height={CELL_H - 1.5}
                rx={2.5}
                fill={probColor(stats[st.seq][col].pBoard)}
                opacity={selectedBin === col ? 1 : 0.82}
                onClick={() => onSelectBin?.(col)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </g>
        ))}
        {/* 선택 시간대 하이라이트 */}
        {selectedBin !== null && (
          <rect
            x={LABEL_W + selectedBin * CELL_W - 1.5}
            y={TOP_H - 2}
            width={CELL_W + 1.5}
            height={stations.length * CELL_H + 3}
            fill="none"
            stroke="#1a1d21"
            strokeWidth="2"
            rx={4}
          />
        )}
      </svg>
      <div className="heatmap-legend">
        <span className="legend-cell" style={{ background: probColor(0.05) }} />
        <span>만차</span>
        <span className="legend-cell" style={{ background: probColor(0.5) }} />
        <span>애매</span>
        <span className="legend-cell" style={{ background: probColor(0.95) }} />
        <span>여유</span>
        <span style={{ marginLeft: 'auto' }}>셀을 누르면 시간대 선택</span>
      </div>
    </div>
  )
}
