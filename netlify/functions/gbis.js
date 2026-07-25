// GBIS(경기버스정보) 공공데이터 API 프록시
// - serviceKey를 서버측에서만 주입 (클라이언트 노출 금지)
// - apis.data.go.kr 은 CORS 헤더가 없어 브라우저 직접 호출 불가 → 이 함수를 경유
// - op 화이트리스트 방식: 임의 URL 프록시 금지
// - /api/gbis?op=health 로 키 설정·유효성 자가진단 가능

const BASE = 'https://apis.data.go.kr/6410000'

const OPS = {
  arrivalList: {
    path: '/busarrivalservice/v2/getBusArrivalListv2',
    params: ['stationId'],
    cache: 'no-store',
  },
  arrivalItem: {
    path: '/busarrivalservice/v2/getBusArrivalItemv2',
    params: ['stationId', 'routeId', 'staOrder'],
    cache: 'no-store',
  },
  stationSearch: {
    path: '/busstationservice/v2/getBusStationListv2',
    params: ['keyword'],
    cache: 'public, s-maxage=3600',
  },
  routeSearch: {
    path: '/busrouteservice/v2/getBusRouteListv2',
    params: ['keyword'],
    cache: 'public, s-maxage=86400',
  },
  routeStations: {
    path: '/busrouteservice/v2/getBusRouteStationListv2',
    params: ['routeId'],
    cache: 'public, s-maxage=86400',
  },
  busLocation: {
    path: '/buslocationservice/v2/getBusLocationListv2',
    params: ['routeId'],
    cache: 'no-store',
  },
}

const json = (statusCode, body, cache = 'no-store') => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cache,
  },
  body: JSON.stringify(body),
})

// 공공데이터포털 키는 Encoding/Decoding 두 형태가 있다.
// URLSearchParams가 다시 인코딩하므로 Decoding 키가 필요하지만,
// 사용자가 Encoding 키(%2B, %3D 포함)를 넣어도 동작하도록 자동 보정.
function normalizeKey(raw) {
  const key = (raw || '').trim()
  if (key.includes('%')) {
    try {
      return decodeURIComponent(key)
    } catch {
      return key
    }
  }
  return key
}

async function callUpstream(path, key, extraParams) {
  const params = new URLSearchParams({ serviceKey: key, format: 'json', ...extraParams })
  const res = await fetch(`${BASE}${path}?${params.toString()}`)
  return res.text()
}

export const handler = async (event) => {
  const key = normalizeKey(process.env.GBIS_API_KEY)
  const q = event.queryStringParameters || {}

  // 자가진단: 키 설정 여부 + 실제 GBIS 호출 성공 여부
  if (q.op === 'health') {
    if (!key) {
      return json(200, {
        keyConfigured: false,
        hint: 'Netlify 환경변수 GBIS_API_KEY가 비어 있습니다. 등록 후 재배포하세요.',
      })
    }
    try {
      const text = await callUpstream(OPS.stationSearch.path, key, { keyword: '영통' })
      let upstreamOk = false
      let detail
      try {
        const data = JSON.parse(text)
        const rc = Number(data?.response?.msgHeader?.resultCode)
        upstreamOk = rc === 0 || rc === 4
        detail = `resultCode=${rc} ${data?.response?.msgHeader?.resultMessage || ''}`.trim()
      } catch {
        // 키 오류·미신청 시 XML(OpenAPI_ServiceResponse)로 응답됨
        detail = text.slice(0, 300)
      }
      return json(200, {
        keyConfigured: true,
        keyLength: key.length,
        upstreamOk,
        detail,
        hint: upstreamOk
          ? '정상입니다.'
          : 'SERVICE_KEY 오류면 Decoding 키인지 확인, 미신청 오류면 공공데이터포털에서 해당 데이터셋 활용신청 승인 여부를 확인하세요.',
      })
    } catch (err) {
      return json(200, { keyConfigured: true, upstreamOk: false, detail: String(err) })
    }
  }

  if (!key) {
    // 키 미설정 → 클라이언트가 데모 모드로 전환할 수 있게 명시적 신호
    return json(503, { error: 'NO_API_KEY', message: 'GBIS_API_KEY가 설정되지 않았습니다.' })
  }

  const op = OPS[q.op]
  if (!op) {
    return json(400, { error: 'BAD_OP', message: `지원하지 않는 op: ${q.op}` })
  }

  const extra = {}
  for (const p of op.params) {
    if (!q[p]) return json(400, { error: 'MISSING_PARAM', message: `${p} 파라미터가 필요합니다.` })
    extra[p] = q[p]
  }

  try {
    const text = await callUpstream(op.path, key, extra)

    let data
    try {
      data = JSON.parse(text)
    } catch {
      // 키 오류 등은 XML(OpenAPI_ServiceResponse)로 내려옴
      return json(502, { error: 'UPSTREAM_NOT_JSON', message: text.slice(0, 300) })
    }

    const header = data?.response?.msgHeader
    const resultCode = Number(header?.resultCode)

    // resultCode 4 = 결과 없음(에러 아님) → 빈 목록으로 정규화
    if (resultCode === 4) {
      return json(200, { resultCode: 0, resultMessage: 'EMPTY', body: {} }, op.cache)
    }
    if (resultCode !== 0) {
      return json(502, {
        error: 'GBIS_ERROR',
        resultCode,
        message: header?.resultMessage || 'GBIS 오류',
      })
    }

    return json(200, {
      resultCode: 0,
      resultMessage: header?.resultMessage || 'OK',
      body: data.response.msgBody || {},
    }, op.cache)
  } catch (err) {
    return json(502, { error: 'UPSTREAM_FAIL', message: String(err) })
  }
}
