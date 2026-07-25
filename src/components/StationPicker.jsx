import { useEffect, useRef, useState } from 'react'
import { searchStations, NoApiKeyError } from '../api/gbis.js'
import { getMockStations } from '../api/mock.js'

/** 정류장 키워드 검색 (300ms 디바운스, 키 없으면 데모 정류장) */
export default function StationPicker({ onSelect }) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    const q = keyword.trim()
    if (q.length < 2) {
      setResults(null)
      return
    }
    timerRef.current = setTimeout(async () => {
      try {
        setResults(await searchStations(q))
      } catch (err) {
        setResults(err instanceof NoApiKeyError ? getMockStations(q) : [])
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [keyword])

  const pick = (station) => {
    setKeyword('')
    setResults(null)
    onSelect(station)
  }

  return (
    <div className="station-search">
      <input
        type="search"
        placeholder="정류장 이름 검색 (예: 영통역)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        enterKeyHint="search"
      />
      {results && (
        <div className="search-results">
          {results.length === 0 ? (
            <button disabled>검색 결과 없음</button>
          ) : (
            results.slice(0, 20).map((s) => (
              <button key={s.stationId} onClick={() => pick(s)}>
                {s.stationName}
                <span className="st-region">
                  {[s.regionName, s.mobileNo].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
