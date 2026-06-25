import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket.js'

export function useDebate() {
  const isQuerying = ref(false)
  const currentPhase = ref(0)
  const currentConversation = ref(null)
  const currentPhase1 = ref(null)
  const currentPhase2 = ref(null)
  const currentPhase3 = ref(null)
  const currentVote = ref(null)

  let phase3FinalizeTimer = null

  function clearPhase3FinalizeTimer() {
    if (phase3FinalizeTimer) {
      clearTimeout(phase3FinalizeTimer)
      phase3FinalizeTimer = null
    }
  }

  function normalizeAgentName(name) {
    const normalized = (name || '').toString().trim().toUpperCase()
    if (normalized === 'BALTHASAR' || normalized === 'CASPER' || normalized === 'MELCHIOR') {
      return normalized
    }
    return 'MELCHIOR'
  }

  function appendPhase3Chunk(aiName, chunk) {
    const safeChunk = typeof chunk === 'string' ? chunk : ''
    if (!safeChunk) return

    const agentName = normalizeAgentName(aiName)
    if (!currentPhase3.value) currentPhase3.value = {}
    currentPhase3.value[agentName] = (currentPhase3.value[agentName] || '') + safeChunk
  }

  function schedulePhase3FinalizeFallback() {
    clearPhase3FinalizeTimer()
    phase3FinalizeTimer = setTimeout(() => {
      const hasPhase3Content =
        !!currentPhase3.value?.MELCHIOR ||
        !!currentPhase3.value?.BALTHASAR ||
        !!currentPhase3.value?.CASPER

      if (currentPhase.value === 3 && hasPhase3Content) {
        finalizeToResult()
      }
    }, 6000)
  }

  function finalizeToResult(payload = {}) {
    isQuerying.value = false
    currentPhase.value = 0

    if (payload.votes) {
      currentVote.value = payload.votes
    }

    const fallbackConsensus =
      payload.consensus ||
      currentPhase3.value?.MELCHIOR ||
      currentPhase3.value?.BALTHASAR ||
      currentPhase3.value?.CASPER ||
      ''

    if (!currentConversation.value) {
      currentConversation.value = {
        consensus: fallbackConsensus,
        votes: payload.votes || currentVote.value || {}
      }
    } else {
      currentConversation.value = {
        ...currentConversation.value,
        consensus: currentConversation.value.consensus || fallbackConsensus,
        votes: payload.votes || currentConversation.value.votes || currentVote.value || {}
      }
    }
  }

  function handleWebSocketMessage(data) {
    const { type } = data

    switch (type) {
      case 'phase_start':
        currentPhase.value = data.phase
        if (data.phase === 3) {
          clearPhase3FinalizeTimer()
        }
        break

      case 'ai_stream':
        if (data.phase === 1) {
          if (!currentPhase1.value) currentPhase1.value = {}
          currentPhase1.value[data.ai] = (currentPhase1.value[data.ai] || '') + data.chunk
        } else if (data.phase === 2) {
          if (!currentPhase2.value) currentPhase2.value = {}
          currentPhase2.value[data.ai] = (currentPhase2.value[data.ai] || '') + data.chunk
        } else if (data.phase === 3) {
          appendPhase3Chunk(data.ai, data.chunk)
          schedulePhase3FinalizeFallback()
        }
        break

      case 'phase_complete':
        if (data.phase === 3) {
          clearPhase3FinalizeTimer()
          finalizeToResult({ votes: data.votes })
        }
        break

      case 'consensus_reached':
        clearPhase3FinalizeTimer()
        finalizeToResult({
          consensus: data.consensus,
          votes: currentVote.value || currentConversation.value?.votes || {}
        })
        break

      case 'conversation_complete':
        clearPhase3FinalizeTimer()
        currentConversation.value = data
        currentVote.value = data.votes
        isQuerying.value = false
        currentPhase.value = 0
        break

      case 'error':
        isQuerying.value = false
        currentPhase.value = 0
        break
    }
  }

  function submitQuestion(question) {
    clearPhase3FinalizeTimer()
    isQuerying.value = true
    currentPhase.value = 0
    currentPhase1.value = {}
    currentPhase2.value = {}
    currentPhase3.value = {}
    currentConversation.value = null
    currentVote.value = null

    return { type: 'query', question }
  }

  function reset() {
    clearPhase3FinalizeTimer()
    isQuerying.value = false
    currentPhase.value = 0
    currentPhase1.value = null
    currentPhase2.value = null
    currentPhase3.value = null
    currentConversation.value = null
    currentVote.value = null
  }

  const phase3ByAgent = computed(() => ({
    BALTHASAR: currentPhase3.value?.BALTHASAR || '',
    CASPER: currentPhase3.value?.CASPER || '',
    MELCHIOR: currentPhase3.value?.MELCHIOR || ''
  }))

  return {
    // State
    isQuerying,
    currentPhase,
    currentConversation,
    currentPhase1,
    currentPhase2,
    currentPhase3,
    currentVote,
    phase3ByAgent,

    // Actions
    handleWebSocketMessage,
    submitQuestion,
    reset,
    finalizeToResult,
  }
}
