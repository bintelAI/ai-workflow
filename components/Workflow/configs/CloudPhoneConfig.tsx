import React, { useState, useEffect } from 'react'
import { Smartphone, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { CloudPhoneConfig as CloudPhoneConfigType } from '../types'
import { VariableTextArea } from './common'

interface CloudPhoneConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
}

const defaultConfig: CloudPhoneConfigType = {
  phoneId: '',
  operationContent: '',
  timeout: 30000,
}

interface CloudPhone {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  model?: string
}

const mockCloudPhones: CloudPhone[] = [
  { id: 'phone_001', name: '云手机-001', status: 'online', model: 'iPhone 14 Pro' },
  { id: 'phone_002', name: '云手机-002', status: 'online', model: 'iPhone 13' },
  { id: 'phone_003', name: '云手机-003', status: 'busy', model: 'iPhone 12' },
  { id: 'phone_004', name: '云手机-004', status: 'offline', model: 'iPhone 14' },
  { id: 'phone_005', name: '云手机-005', status: 'online', model: 'Samsung S23' },
]

export const CloudPhoneConfig: React.FC<CloudPhoneConfigProps> = ({ config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState<CloudPhoneConfigType>(defaultConfig)
  const [expandedSections, setExpandedSections] = useState({
    advanced: false,
  })
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    data?: any
    error?: string
  }>({ status: 'idle' })

  useEffect(() => {
    setLocalConfig({
      ...defaultConfig,
      ...config,
    })
  }, [config])

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onConfigChange(key, value)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getSelectedPhone = () => {
    return mockCloudPhones.find(p => p.id === localConfig.phoneId)
  }

  const getStatusColor = (status: CloudPhone['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'busy':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const handleTest = async () => {
    if (!localConfig.phoneId) {
      setTestResult({ status: 'error', error: '请先选择云手机' })
      return
    }

    if (!localConfig.operationContent) {
      setTestResult({ status: 'error', error: '请输入操作内容' })
      return
    }

    setTestResult({ status: 'testing' })

    setTimeout(() => {
      setTestResult({
        status: 'success',
        data: {
          success: true,
          phoneId: localConfig.phoneId,
          phoneName: getSelectedPhone()?.name,
          operation: localConfig.operationContent,
          result: {
            status: 'completed',
            timestamp: new Date().toISOString(),
            output: '操作执行成功',
            screenshot: 'https://example.com/screenshot.png',
          },
        },
      })
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-500 uppercase flex items-center gap-1.5">
          <Smartphone size={12} className="text-indigo-500" />
          选择云手机
        </label>

        <div className="relative">
          <div
            onClick={() => setPhoneDropdownOpen(!phoneDropdownOpen)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white cursor-pointer flex items-center justify-between hover:border-indigo-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {getSelectedPhone() ? (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(getSelectedPhone()!.status)}`} />
                  <span className="font-medium text-slate-700">{getSelectedPhone()!.name}</span>
                  {getSelectedPhone()!.model && (
                    <span className="text-xs text-slate-400">({getSelectedPhone()!.model})</span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400">请选择云手机...</span>
              )}
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${phoneDropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>

          {phoneDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {mockCloudPhones.map(phone => (
                <div
                  key={phone.id}
                  onClick={() => {
                    handleConfigChange('phoneId', phone.id)
                    setPhoneDropdownOpen(false)
                  }}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2 border-b border-slate-100 last:border-0"
                >
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(phone.status)}`} />
                  <div className="flex-1">
                    <div className="font-medium text-slate-700 text-sm">{phone.name}</div>
                    {phone.model && <div className="text-xs text-slate-400">{phone.model}</div>}
                  </div>
                  {phone.id === localConfig.phoneId && (
                    <div className="text-indigo-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-500 uppercase">操作内容</label>
        <VariableTextArea
          value={localConfig.operationContent}
          onChange={val => handleConfigChange('operationContent', val)}
          placeholder="输入要执行的操作内容，支持变量引用..."
          rows={6}
        />
        <div className="text-xs text-slate-400">
          提示：支持使用变量引用，如 {'{{upstream_node.output}}'}
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('advanced')}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-500" />
            高级配置
          </span>
          {expandedSections.advanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.advanced && (
          <div className="p-4 bg-white space-y-3">
            <div className="w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
                超时时间 (ms)
              </label>
              <input
                type="number"
                className="w-full px-2 py-2 border border-slate-300 rounded-md text-sm font-mono"
                value={localConfig.timeout}
                onChange={e => handleConfigChange('timeout', parseInt(e.target.value) || 30000)}
                min={1000}
                step={1000}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={handleTest}
          disabled={testResult.status === 'testing'}
          className="w-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-sm font-medium text-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testResult.status === 'testing' ? '测试中...' : '测试操作'}
        </button>

        {testResult.status === 'success' && (
          <div className="p-4 bg-green-50 border-t border-green-100">
            <div className="text-xs font-medium text-green-700 mb-2">测试结果：</div>
            <pre className="text-xs text-green-600 font-mono bg-green-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        )}

        {testResult.status === 'error' && (
          <div className="p-4 bg-red-50 border-t border-red-100">
            <div className="text-xs font-medium text-red-700 mb-1">错误：</div>
            <div className="text-xs text-red-600">{testResult.error}</div>
          </div>
        )}
      </div>
    </div>
  )
}
