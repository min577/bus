# 무한대기 🚌 — 경기도 광역버스 출퇴근 도우미

출퇴근길 광역버스가 앱에 항상 **잔여좌석 0**으로 떠서 무한 대기하게 되는 문제를 풀기 위한 모바일 웹앱 프로토타입입니다.

| 탭 | 기능 |
|---|---|
| 실시간 | 정류장별 버스 도착시간 + 잔여좌석 (GBIS 공공데이터 실시간 API) |
| 탑승 패턴 | 평일 시간대×정류장 좌석 확보 확률 히트맵 — "어디서 타야 앉을까" |
| 동선 비교 | 직행 대기 vs 거슬러 타기 vs 지하철 환승, 만차 확률까지 넣은 기대시간 비교 |

예시 노선: **M5107 · 5100 · 1112** (영통/경희대 → 서울역·강남역·강변역)

## 로컬 실행

```bash
npm install
npm run dev            # UI만 (API는 데모 모드)
npx netlify dev        # Netlify Functions 포함 (실시간 API 연동 시)
```

API 키 없이도 **데모 모드**(시뮬레이션 도착정보)로 전체 화면이 동작합니다.

## 실시간 API 연동

1. [공공데이터포털](https://www.data.go.kr) 가입 후 아래 4개 활용신청 (자동승인, ~1시간)
   - 경기도_버스도착정보, 경기도_정류소정보, 경기도_노선정보조회, 경기도_버스위치정보
2. 발급된 인증키(Decoding)를 `.env`에 입력:
   ```
   GBIS_API_KEY=발급받은키
   ```
3. `npx netlify dev`로 실행 → 정류장 검색·실시간 도착이 실데이터로 표시

노선 실제 ID 채우기(선택): `/api/gbis?op=routeSearch&keyword=M5107`로 `routeId`를 조회해
`src/data/routes.js`의 `routeId`/`stationId`를 채우면 딥링크 정확도가 올라갑니다.

## Netlify 배포

1. GitHub `min577/bus`에 push
2. Netlify → **Import from GitHub** → 이 저장소 선택 (빌드 설정은 `netlify.toml` 자동 인식)
3. Site settings → **Environment variables** → `GBIS_API_KEY` 등록 후 재배포

API 키는 Netlify Functions(`netlify/functions/gbis.js`)에서만 사용되며 클라이언트에 노출되지 않습니다.

## 탑승 패턴 데이터

현재 패턴은 `npm run generate:patterns`로 만든 **시뮬레이션 데이터**입니다
(가우시안 출퇴근 수요 × 정류장 가중치 × 60일 포아송 노이즈 — "뒤 정류장일수록 만차" 재현).

`src/data/patterns.json`의 스키마는 실측 데이터와 공용입니다. 추후 GitHub Actions로
도착정보를 주기 수집·집계해 `source: "observed"`로 교체하면 화면 수정 없이 실측 패턴이 됩니다.

## 구조

```
netlify/functions/gbis.js   # GBIS 프록시 (키 보호 + CORS 해결, op 화이트리스트)
scripts/generate-patterns.mjs
src/
  api/        gbis.js(클라이언트) · mock.js(데모 모드)
  hooks/      useArrivals(20초 폴링+가시성 정지) · useFavorites
  data/       routes.js(큐레이션 노선) · patterns.json · itineraries.js(비교 시나리오)
  lib/        patternStats.js · compare.js(기대시간 엔진)
  pages/      HomePage · PatternPage · ComparePage
  components/ TabBar · StationPicker · ArrivalCard · SeatBadge ·
              PatternHeatmap(SVG) · StationRankList · ItineraryCard
```
