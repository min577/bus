// 큐레이션 광역버스 노선 (영통·경희대 → 서울 방면 예시)
//
// routeId / stationId 는 GBIS 실제 ID가 들어갈 자리입니다.
// 공공데이터포털 키 발급 후 아래 API로 조회해 채우면 실시간 연동이 붙습니다.
//   /api/gbis?op=routeSearch&keyword=M5107          → routeId
//   /api/gbis?op=routeStations&routeId=<routeId>     → stationId, stationSeq
// null 인 동안에도 정류장 검색(키워드)과 데모 모드는 정상 동작합니다.

export const ROUTES = [
  {
    key: 'M5107',
    routeName: 'M5107',
    routeType: '광역급행',
    routeId: null,
    origin: '경희대차고지',
    destination: '서울역',
    capacity: 45,
    headwayPeakMin: 10, // 출근 피크 배차간격(분)
    headwayOffMin: 15,
    // 상행(서울 방면) 승차 구간 주요 정류장 — seq 순서대로 버스가 지나감
    boardingStations: [
      { seq: 1, name: '경희대차고지', stationId: null, weight: 1.6 },
      { seq: 2, name: '경희대학교입구', stationId: null, weight: 1.2 },
      { seq: 3, name: '살구골동아아파트', stationId: null, weight: 0.9 },
      { seq: 4, name: '영통역', stationId: null, weight: 2.2 },
      { seq: 5, name: '청명역', stationId: null, weight: 1.4 },
      { seq: 6, name: '황골마을주공1단지', stationId: null, weight: 1.1 },
      { seq: 7, name: '아주대학교입구', stationId: null, weight: 1.5 },
      { seq: 8, name: '우만동주공아파트', stationId: null, weight: 0.8 },
    ],
    // 하행(퇴근, 경기 방면) 승차 정류장
    returnStations: [
      { seq: 1, name: '서울역버스환승센터', stationId: null, weight: 2.6 },
      { seq: 2, name: '명동입구', stationId: null, weight: 1.4 },
      { seq: 3, name: '순천향대학병원', stationId: null, weight: 1.0 },
    ],
  },
  {
    key: '5100',
    routeName: '5100',
    routeType: '직행좌석',
    routeId: null,
    origin: '경희대차고지',
    destination: '강남역',
    capacity: 45,
    headwayPeakMin: 8,
    headwayOffMin: 12,
    boardingStations: [
      { seq: 1, name: '경희대차고지', stationId: null, weight: 1.5 },
      { seq: 2, name: '경희대학교입구', stationId: null, weight: 1.3 },
      { seq: 3, name: '살구골동아아파트', stationId: null, weight: 0.9 },
      { seq: 4, name: '영통역', stationId: null, weight: 2.4 },
      { seq: 5, name: '청명역', stationId: null, weight: 1.5 },
      { seq: 6, name: '황골마을주공1단지', stationId: null, weight: 1.0 },
      { seq: 7, name: '아주대학교입구', stationId: null, weight: 1.4 },
    ],
    returnStations: [
      { seq: 1, name: '신논현역', stationId: null, weight: 1.5 },
      { seq: 2, name: '강남역', stationId: null, weight: 2.6 },
      { seq: 3, name: '뱅뱅사거리', stationId: null, weight: 1.0 },
      { seq: 4, name: '시민의숲.양재꽃시장', stationId: null, weight: 0.7 },
    ],
  },
  {
    key: '1112',
    routeName: '1112',
    routeType: '직행좌석',
    routeId: null,
    origin: '경희대차고지',
    destination: '강변역',
    capacity: 45,
    headwayPeakMin: 12,
    headwayOffMin: 18,
    boardingStations: [
      { seq: 1, name: '경희대차고지', stationId: null, weight: 1.4 },
      { seq: 2, name: '경희대학교입구', stationId: null, weight: 1.2 },
      { seq: 3, name: '살구골동아아파트', stationId: null, weight: 0.8 },
      { seq: 4, name: '영통역', stationId: null, weight: 2.0 },
      { seq: 5, name: '청명역', stationId: null, weight: 1.3 },
      { seq: 6, name: '망포역', stationId: null, weight: 1.6 },
    ],
    returnStations: [
      { seq: 1, name: '강변역', stationId: null, weight: 2.8 },
      { seq: 2, name: '구의사거리', stationId: null, weight: 0.9 },
    ],
  },
]

export function getRoute(key) {
  return ROUTES.find((r) => r.key === key)
}

// 홈 화면 데모 모드용 기본 정류장
export const DEFAULT_STATION = { stationId: 'demo-yeongtong', stationName: '영통역', regionName: '수원' }
