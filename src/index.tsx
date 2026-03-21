import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { setAiFlowRuntime } from '@/utils/runtime'

let root: ReactDOM.Root | null = null;

// 渲染函数
function render(props: any) {
  const container = document.getElementById('root');
  if (!container) return;

  setAiFlowRuntime({
    id: props?.id,
    teamId: props?.teamId,
    projectId: props?.projectId,
    token: props?.token,
    baseURL: props?.baseURL,
    type: props?.type,
  });

  const url = new URL(window.location.href);
  if (props?.id !== undefined && props?.id !== null) {
    url.searchParams.set('id', String(props.id));
  }
  if (props?.projectId) {
    url.searchParams.set('projectId', String(props.projectId));
  }
  if (props?.teamId) {
    url.searchParams.set('teamId', String(props.teamId));
  }
  if (props?.type) {
    url.searchParams.set('type', String(props.type));
  }
  window.history.replaceState({}, '', url.toString());

  root = ReactDOM.createRoot(container);
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

export async function unmount(props: any) {
  destroy();
}

export async function update(props: any) {
  console.log('update props', props);
}
