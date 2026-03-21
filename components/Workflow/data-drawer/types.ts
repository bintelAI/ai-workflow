export interface TimelineLogView {
  id: string
  nodeId: string
  nodeType: string
  nodeLabel: string
  status: 'success' | 'failed' | 'running' | 'pending' | 'skipped' | 'info'
  timestampText: string
  duration: number
  input?: any
  output?: any
  errorMessage?: string
  content?: string
  toolCalls?: Array<{ name: string; type: 'start' | 'end'; timestamp?: number }>
  sessionId?: string
  isThinking?: boolean
  inputSummary?: string
  outputSummary?: string
  diffSummary?: string[]
  diffGroups?: {
    added?: string[]
    removed?: string[]
    changed?: string[]
    notes?: string[]
  }
  diffDetails?: {
    added?: Array<{ key: string; value: string }>
    removed?: Array<{ key: string; value: string }>
    changed?: Array<{ key: string; before: string; after: string }>
  }
}
