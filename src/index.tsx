import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

let root: ReactDOM.Root | null = null;

// 渲染函数
function render(props: any) {
  const container = document.getElementById('root');
  if (!container) return;
  
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
