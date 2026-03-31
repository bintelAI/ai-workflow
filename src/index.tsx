import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { setAiFlowRuntime } from '@/utils/runtime'

let root: ReactDOM.Root | null = null;

const applyRuntimeFromProps = (props: any) => {
  setAiFlowRuntime({
    id: props?.id,
    teamId: props?.teamId,
    projectId: props?.projectId,
    token: props?.token,
    baseURL: props?.baseURL,
    type: props?.type,
  });
};

// 渲染函数
function render(props: any = {}) {
  const container = document.getElementById('root');
  if (!container) return;

  applyRuntimeFromProps(props);

  if (!root) {
    root = ReactDOM.createRoot(container);
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// 销毁函数
function destroy() {
  if (root) {
    root.unmount();
    root = null;
  }
}

// 独立运行时直接渲染
if (!window.__POWERED_BY_WUJIE__) {
  render({});
}

// 导出无界生命周期钩子
export async function mount(props: any) {
  render(props);
}

export async function unmount() {
  destroy();
}

export async function update(props: any) {
  render(props);
}
