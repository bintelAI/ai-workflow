import React from 'react'
import { render } from '@testing-library/react'
import { WorkflowCanvas } from './WorkflowCanvas'
import { ReactFlowProvider } from 'reactflow'

// Mock reactflow
jest.mock('reactflow', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  // Add other necessary mocks here
}))

describe('WorkflowCanvas Component', () => {
  test('renders without crashing', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas />
      </ReactFlowProvider>
    )
    // Add test cases here
  })

  // Add more test cases as needed
})
