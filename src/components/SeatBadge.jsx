// 잔여좌석 뱃지: 0=만차(빨강), 1~5=임박(주황), 6+=여유(초록), null=정보없음(회색)
export default function SeatBadge({ remainSeat }) {
  if (remainSeat === null || remainSeat === undefined) {
    return <span className="seat-badge na">좌석 정보없음</span>
  }
  if (remainSeat === 0) return <span className="seat-badge full">만차 0석</span>
  if (remainSeat <= 5) return <span className="seat-badge few">잔여 {remainSeat}석</span>
  return <span className="seat-badge ok">잔여 {remainSeat}석</span>
}
