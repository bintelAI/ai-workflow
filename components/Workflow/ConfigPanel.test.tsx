import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfigPanel } from './ConfigPanel';
import { useWorkflowStore } from './store/useWorkflowStore';

// Mock the store
jest.mock('./store/useWorkflowStore', () => ({
  useWorkflowStore: jest.fn(),
}));

describe('ConfigPanel Component', () => {
  beforeEach(() => {
    // Reset mock before each test
    (useWorkflowStore as jest.Mock).mockReturnValue({
      nodes: [],
      selectedNodeId: null,
      updateNodeData: jest.fn(),
      setSelectedNode: jest.fn(),
      deleteNode: jest.fn(),
      aiAutocompleteConfig: jest.fn(),
    });
  });

  test('renders without crashing', () => {
    render(<ConfigPanel />);
    // Add test cases here
  });

  // Add more test cases as needed
});
