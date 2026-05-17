import { describe, expect, it } from 'vitest'

import { resolveVariableSelection } from '../utils/variableSelection'

describe('variableSelection', () => {
  it('resolves selected template back to InputParams field metadata', () => {
    const selection = resolveVariableSelection('{{nodes.llm_1.text}}', [
      {
        id: 'llm_1',
        type: 'llm',
        label: 'AI 分析',
        params: [
          { field: 'text', name: 'text', type: 'string', label: 'text' },
        ],
        variables: [
          {
            key: 'node:llm_1:text',
            scope: 'node',
            path: 'nodes.llm_1.text',
            template: '{{nodes.llm_1.text}}',
            name: 'text',
            label: 'text',
            type: 'string',
            nodeId: 'llm_1',
            nodeType: 'llm',
            nodeLabel: 'AI 分析',
          },
        ],
      },
    ])

    expect(selection).toEqual({
      field: 'text',
      nodeId: 'llm_1',
      nodeType: 'llm',
      value: '',
      name: 'text',
      template: '{{nodes.llm_1.text}}',
      refPath: 'nodes.llm_1.text',
      label: 'text',
    })
  })

  it('keeps custom values as plain InputParams values', () => {
    expect(resolveVariableSelection('fixed text', [])).toEqual({
      field: '',
      nodeId: '',
      nodeType: '',
      value: 'fixed text',
    })
  })
})
