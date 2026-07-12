import { describe, expect, it } from 'vitest'

import { getPluginMode, PLUGIN_MODE_REGISTRY } from '../config/pluginModeRegistry'
import { getNodeMeta } from '../config/nodeRegistry'
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

  it('creates mul query nodes with P0 multi-query protocol defaults without changing single-table defaults', () => {
    const config = getNodeMeta(WorkflowNodeType.MUL_QUERY).createDefaultConfig()

    expect(config.maxRows).toBe(20)
    expect(config.queryMode).toBe('single')
    expect(config.mode).toBe('visual')
    expect(config.queryPlan).toEqual({
      tables: [],
      joins: [],
      fields: [],
      filters: [],
      groupBy: [],
      having: [],
      orderBy: [],
      params: [],
      limit: 100,
    })
  })

  it('keeps legacy SQL node hidden from new-node entry points', () => {
    const sqlMeta = getNodeMeta(WorkflowNodeType.SQL)

    expect(sqlMeta.visibleInSidebar).toBe(false)
    expect(sqlMeta.visibleInQuickAdd).toBe(false)
    expect(sqlMeta.visibleInSettings).toBe(false)
  })

  it('accepts multi-table queryPlan without legacy sheetId', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('query_multi', WorkflowNodeType.MUL_QUERY, {
          queryMode: 'multi',
          mode: 'visual',
          targetProjectId: 'project_b',
          queryPlan: {
            tables: [{ alias: 'c', sheetId: 'sheet_customer' }],
            joins: [],
            fields: [{ tableAlias: 'c', fieldId: 'name', as: 'customer_name' }],
            filters: [],
            groupBy: [],
            having: [],
            orderBy: [],
            params: [],
            limit: 20,
          },
          maxRows: 20,
        }),
      ] as any,
      [{ id: 'e1', source: 'start_1', target: 'query_multi' }] as any
    )

    const result = validator.validate()

    expect(result.errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '查询项目表节点未配置目标表' }),
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
        expect.objectContaining({ message: '修改项目表行节点未配置要修改的字段' }),
        expect.objectContaining({ message: '删除项目表行节点未配置行 ID' }),
      ])
    )
    expect(result.errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '修改项目表行节点未配置行 ID' }),
      ])
    )
  })

  it('accepts structured update row field bindings without legacy JSON', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('update_1', WorkflowNodeType.MUL_UPDATE_ROW, {
          targetBinding: {
            projectId: 'project_b',
            sheetId: 'sheet_1',
            fieldBindings: [
              {
                targetFieldId: 'name',
                sourceTemplate: '{{payload.name}}',
              },
            ],
          },
        }),
        createNode('end_1', WorkflowNodeType.END, {}),
      ] as any,
      [
        { id: 'e1', source: 'start_1', target: 'update_1' },
        { id: 'e2', source: 'update_1', target: 'end_1' },
      ] as any
    )

    const result = validator.validate()

    expect(result.errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '修改项目表行节点未配置目标项目' }),
        expect.objectContaining({ message: '修改项目表行节点未配置目标表' }),
        expect.objectContaining({ message: '修改项目表行节点未配置要修改的字段' }),
      ])
    )
  })
})
