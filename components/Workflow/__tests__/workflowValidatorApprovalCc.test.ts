import { describe, expect, it } from 'vitest'

import { WorkflowValidator } from '../validators/workflowValidator'
import { WorkflowNodeType } from '../types'

const createNode = (id: string, type: WorkflowNodeType, config: Record<string, any>) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    label: id,
    config,
  },
})

describe('WorkflowValidator approval / cc structured selections', () => {
  it('does not report approver missing when participantRules contains team departments and project members', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('approval_1', WorkflowNodeType.APPROVAL, {
          participantRules: [
            {
              sourceType: 'user',
              sourceValue: 'user_1',
              sourceName: '张三',
            },
            {
              sourceType: 'department',
              sourceValue: 'dept_1',
              sourceName: '研发部',
            },
          ],
          approvalType: 'single',
        }),
      ] as any,
      [
        {
          id: 'e1',
          source: 'start_1',
          target: 'approval_1',
        },
      ] as any
    )

    const result = validator.validate()

    expect(
      result.errors.some(error => error.message.includes('审批节点未配置审批人'))
    ).toBe(false)
  })

  it('does not report approver missing when participantRules contains project role owner', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('approval_1', WorkflowNodeType.APPROVAL, {
          participantRules: [
            {
              sourceType: 'project_role_owner',
              sourceValue: 'role_1',
              sourceName: '财务负责人',
            },
          ],
          approvalType: 'single',
        }),
      ] as any,
      [
        {
          id: 'e1',
          source: 'start_1',
          target: 'approval_1',
        },
      ] as any
    )

    const result = validator.validate()

    expect(
      result.errors.some(error => error.message.includes('审批节点未配置审批人'))
    ).toBe(false)
  })

  it('does not report cc recipients missing when structured recipients contain team departments and project members', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('cc_1', WorkflowNodeType.CC, {
          recipientUsers: [{ id: 'user_1', name: '张三', departmentId: 'dept_1' }],
          recipientDepartments: [{ id: 'dept_1', name: '研发部' }],
        }),
      ] as any,
      [
        {
          id: 'e1',
          source: 'start_1',
          target: 'cc_1',
        },
      ] as any
    )

    const result = validator.validate()

    expect(
      result.errors.some(error => error.message.includes('抄送节点未配置接收人'))
    ).toBe(false)
  })

  it('reports decision variable missing when AI auto approval is enabled', () => {
    const validator = new WorkflowValidator(
      [
        createNode('start_1', WorkflowNodeType.START, { devMode: true }),
        createNode('approval_1', WorkflowNodeType.APPROVAL, {
          participantRules: [
            {
              sourceType: 'user',
              sourceValue: 'user_1',
              sourceName: '张三',
            },
          ],
          approvalType: 'single',
          autoApproval: {
            enabled: true,
          },
        }),
      ] as any,
      [
        {
          id: 'e1',
          source: 'start_1',
          target: 'approval_1',
        },
      ] as any
    )

    const result = validator.validate()

    expect(
      result.errors.some(error => error.message.includes('启用 AI 自动审批时必须配置决策值来源'))
    ).toBe(true)
  })
})
