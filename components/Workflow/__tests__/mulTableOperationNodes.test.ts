import { describe, expect, it } from 'vitest'

import { getPluginMode, PLUGIN_MODE_REGISTRY } from '../config/pluginModeRegistry'
import { WorkflowNodeType } from '../types'
import { WorkflowValidator } from '../validators/workflowValidator'

const createNode = (id: string, type: WorkflowNodeType, config: Record<string, any>) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    label: id,
    config,
  },
})

describe('mul table operation workflow nodes', () => {
  it('exposes project table operation nodes in automation, AI, approval and all modes', () => {
    const projectTableNodes = [
      WorkflowNodeType.MUL_QUERY,
      WorkflowNodeType.MUL_UPDATE_ROW,
      WorkflowNodeType.MUL_DELETE_ROW,
    ]

    expect(PLUGIN_MODE_REGISTRY.automation.allowedNodeTypes).toEqual(
      expect.arrayContaining(projectTableNodes)
    )
    expect(PLUGIN_MODE_REGISTRY.ai.allowedNodeTypes).toEqual(
      expect.arrayContaining(projectTableNodes)
    )
    expect(PLUGIN_MODE_REGISTRY.approval.allowedNodeTypes).toEqual(
      expect.arrayContaining(projectTableNodes)
    )
    expect(getPluginMode('all').allowedNodeTypes).toEqual(
      expect.arrayContaining(projectTableNodes)
    )
  })

  it('validates required project table query configuration', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('query_1', WorkflowNodeType.MUL_QUERY, { maxRows: 0 }),
      ] as any,
      [{ id: 'e1', source: 'start_1', target: 'query_1' }] as any
    )

    const result = validator.validate()

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '查询项目表节点未配置目标项目' }),
        expect.objectContaining({ message: '查询项目表节点未配置目标表' }),
        expect.objectContaining({ message: '查询项目表节点返回行数必须在 1-1000 之间' }),
      ])
    )
  })

  it('validates update and delete row identity configuration', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('update_1', WorkflowNodeType.MUL_UPDATE_ROW, {
          targetProjectId: 'project_b',
          sheetId: 'sheet_1',
          fieldMappingsJson: '{}',
        }),
        createNode('delete_1', WorkflowNodeType.MUL_DELETE_ROW, {
          targetProjectId: 'project_b',
          sheetId: 'sheet_1',
        }),
        createNode('end_1', WorkflowNodeType.END, {}),
      ] as any,
      [
        { id: 'e1', source: 'start_1', target: 'update_1' },
        { id: 'e2', source: 'update_1', target: 'delete_1' },
        { id: 'e3', source: 'delete_1', target: 'end_1' },
      ] as any
    )

    const result = validator.validate()

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '修改项目表行节点未配置行 ID' }),
        expect.objectContaining({ message: '修改项目表行节点未配置要修改的字段' }),
        expect.objectContaining({ message: '删除项目表行节点未配置行 ID' }),
      ])
    )
  })
})
