// 동선 비교 시나리오 정의 (프로토타입: 정적 후보 동선 + 실시간/패턴 기반 동적 계산)
//
// leg 종류
//  - walk:   도보 이동 (min 고정)
//  - bus:    광역버스 탑승. routeKey + boardSeq 가 있으면 compare 엔진이
//            대기시간(배차/2) + 만차로 보낼 기대 대수 페널티를 패턴에서 계산해 더함.
//            busClass: 'local' 이면 일반/마을버스 요금 적용
//  - subway: 지하철 (min 고정 + 평균 대기 wait, km 는 거리 추가요금 계산용)
//  - taxi:   택시 (min 고정 + 호출 대기, km 로 요금 추정)
//
// 소요시간·거리는 예시값입니다. ODsay 등 길찾기 API 연동 시 이 파일만 교체하면 됩니다.

export const SCENARIOS = [
  {
    key: 'yt-gangnam',
    title: '영통역 → 강남역',
    direction: 'commute',
    options: [
      {
        key: 'direct',
        title: '5100 직행 (영통역 승차)',
        legs: [
          { type: 'walk', label: '영통역 정류장까지 도보', min: 3 },
          { type: 'bus', label: '5100 → 강남역', routeKey: '5100', boardSeq: 4, rideMin: 48 },
        ],
      },
      {
        key: 'backtrack',
        title: '거슬러 타기 (경희대차고지 승차)',
        legs: [
          { type: 'walk', label: '경희대차고지까지 이동 (마을버스/도보)', min: 14 },
          { type: 'bus', label: '5100 → 강남역', routeKey: '5100', boardSeq: 1, rideMin: 56 },
        ],
      },
      {
        key: 'subway',
        title: '지하철 환승 (수인분당선 + 2호선)',
        legs: [
          { type: 'walk', label: '영통역까지 도보', min: 4 },
          { type: 'subway', label: '수인분당선 영통 → 선릉', min: 41, wait: 4, km: 28 },
          { type: 'subway', label: '2호선 환승 선릉 → 강남', min: 6, wait: 3, km: 3 },
        ],
      },
      {
        key: 'taxi',
        title: '택시',
        legs: [{ type: 'taxi', label: '택시 영통 → 강남역', min: 50, km: 33 }],
      },
    ],
  },
  {
    key: 'yt-seoulstation',
    title: '영통역 → 서울역',
    direction: 'commute',
    options: [
      {
        key: 'direct',
        title: 'M5107 직행 (영통역 승차)',
        legs: [
          { type: 'walk', label: '영통역 정류장까지 도보', min: 3 },
          { type: 'bus', label: 'M5107 → 서울역', routeKey: 'M5107', boardSeq: 4, rideMin: 62 },
        ],
      },
      {
        key: 'backtrack',
        title: '거슬러 타기 (경희대차고지 승차)',
        legs: [
          { type: 'walk', label: '경희대차고지까지 이동 (마을버스/도보)', min: 14 },
          { type: 'bus', label: 'M5107 → 서울역', routeKey: 'M5107', boardSeq: 1, rideMin: 70 },
        ],
      },
      {
        key: 'subway',
        title: '지하철 환승 (수인분당선 + 2·1호선)',
        legs: [
          { type: 'walk', label: '영통역까지 도보', min: 4 },
          { type: 'subway', label: '수인분당선 영통 → 왕십리', min: 55, wait: 4, km: 36 },
          { type: 'subway', label: '2호선 → 1호선 환승, 시청 경유 서울역', min: 18, wait: 4, km: 6 },
        ],
      },
      {
        key: 'taxi',
        title: '택시',
        legs: [{ type: 'taxi', label: '택시 영통 → 서울역', min: 60, km: 41 }],
      },
    ],
  },
  {
    key: 'mp-gangbyeon',
    title: '망포역 → 강변역',
    direction: 'commute',
    options: [
      {
        key: 'direct',
        title: '1112 직행 (망포역 승차)',
        legs: [
          { type: 'walk', label: '망포역 정류장까지 도보', min: 2 },
          { type: 'bus', label: '1112 → 강변역', routeKey: '1112', boardSeq: 6, rideMin: 58 },
        ],
      },
      {
        key: 'backtrack',
        title: '거슬러 타기 (영통역 승차)',
        legs: [
          { type: 'walk', label: '영통역까지 이동 (수인분당선 한 정거장)', min: 9 },
          { type: 'bus', label: '1112 → 강변역', routeKey: '1112', boardSeq: 4, rideMin: 63 },
        ],
      },
      {
        key: 'subway',
        title: '지하철 환승 (수인분당선 + 2호선)',
        legs: [
          { type: 'walk', label: '망포역까지 도보', min: 3 },
          { type: 'subway', label: '수인분당선 망포 → 선릉', min: 47, wait: 4, km: 31 },
          { type: 'subway', label: '2호선 환승 선릉 → 강변', min: 16, wait: 3, km: 9 },
        ],
      },
      {
        key: 'taxi',
        title: '택시',
        legs: [{ type: 'taxi', label: '택시 망포 → 강변역', min: 55, km: 38 }],
      },
    ],
  },
]
