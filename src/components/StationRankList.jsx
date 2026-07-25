// "여기서 타면 좌석 확보 확률 N%" 정류장 순위
export default function StationRankList({ ranked }) {
  return (
    <div className="rank-list">
      {ranked.map((st, i) => (
        <div key={st.seq} className={`rank-item ${i === 0 ? 'top' : ''}`}>
          <span className="rank-no">{i + 1}</span>
          <span className="rank-name">{st.name}</span>
          <span style={{ textAlign: 'right' }}>
            <div className="rank-prob">{Math.round(st.pBoard * 100)}%</div>
            <div className="rank-seat">도착 시 중앙값 {st.seatMed}석</div>
          </span>
        </div>
      ))}
    </div>
  )
}
