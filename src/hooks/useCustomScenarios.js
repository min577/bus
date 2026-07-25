import { useCallback, useState } from 'react'

const KEY = 'bus.customScenarios.v1'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

/** 사용자가 직접 만든 비교 시나리오 (localStorage 저장) */
export function useCustomScenarios() {
  const [customScenarios, setCustomScenarios] = useState(read)

  const save = useCallback((scenario) => {
    setCustomScenarios((prev) => {
      const next = [...prev.filter((s) => s.key !== scenario.key), scenario]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const remove = useCallback((key) => {
    setCustomScenarios((prev) => {
      const next = prev.filter((s) => s.key !== key)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { customScenarios, save, remove }
}
