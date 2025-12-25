import React, { useState, useEffect } from 'react'
import { HardDrive, Cloud, Globe, Folder, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { StorageConfig, StorageProvider } from '../types'

interface StorageConfigProps {
  config: any
  onConfigChange: (key: string, value: any) => void
}

const defaultConfig: StorageConfig = {
  provider: 'local',
  fileExtension: 'jpg',
  aliyunConfig: {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    region: 'oss-cn-hangzhou',
    endpoint: '',
  },
  tencentConfig: {
    secretId: '',
    secretKey: '',
    bucket: '',
    region: 'ap-guangzhou',
  },
  qiniuConfig: {
    accessKey: '',
    secretKey: '',
    bucket: '',
    domain: '',
  },
}

const providerOptions: { value: StorageProvider; label: string; icon: any; color: string }[] = [
  { value: 'local', label: '本地存储', icon: HardDrive, color: 'text-slate-600' },
  { value: 'aliyun', label: '阿里云 OSS', icon: Cloud, color: 'text-orange-500' },
  { value: 'tencent', label: '腾讯云 COS', icon: Globe, color: 'text-blue-500' },
  { value: 'qiniu', label: '七牛云', icon: Folder, color: 'text-cyan-500' },
]

const extensionOptions = [
  { value: 'jpg', label: 'JPG 图片' },
  { value: 'jpeg', label: 'JPEG 图片' },
  { value: 'png', label: 'PNG 图片' },
  { value: 'gif', label: 'GIF 图片' },
  { value: 'webp', label: 'WebP 图片' },
  { value: 'pdf', label: 'PDF 文档' },
  { value: 'doc', label: 'Word 文档' },
  { value: 'docx', label: 'Word 文档' },
  { value: 'xls', label: 'Excel 表格' },
  { value: 'xlsx', label: 'Excel 表格' },
  { value: 'txt', label: '文本文件' },
  { value: 'zip', label: 'ZIP 压缩包' },
  { value: 'mp4', label: 'MP4 视频' },
  { value: 'mp3', label: 'MP3 音频' },
]

const AliyunConfigForm = ({ config, onChange }: { config: any; onChange: (config: any) => void }) => {
  const handleChange = (field: string, value: string) => {
    onChange({ ...config, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Access Key ID</label>
          <input
            type="text"
            value={config.accessKeyId || ''}
            onChange={e => handleChange('accessKeyId', e.target.value)}
            placeholder="LTAI..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Access Key Secret</label>
          <input
            type="password"
            value={config.accessKeySecret || ''}
            onChange={e => handleChange('accessKeySecret', e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Bucket 名称</label>
          <input
            type="text"
            value={config.bucket || ''}
            onChange={e => handleChange('bucket', e.target.value)}
            placeholder="my-bucket"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Region</label>
          <select
            value={config.region || 'oss-cn-hangzhou'}
            onChange={e => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-white"
          >
            <option value="oss-cn-hangzhou">华东1（杭州）</option>
            <option value="oss-cn-shanghai">华东2（上海）</option>
            <option value="oss-cn-qingdao">华北1（青岛）</option>
            <option value="oss-cn-beijing">华北2（北京）</option>
            <option value="oss-cn-zhangjiakou">华北3（张家口）</option>
            <option value="oss-cn-shenzhen">华南1（深圳）</option>
            <option value="oss-cn-guangzhou">华南2（广州）</option>
            <option value="oss-cn-chengdu">西南1（成都）</option>
            <option value="oss-cn-hongkong">中国香港</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Endpoint（可选）</label>
        <input
          type="text"
          value={config.endpoint || ''}
          onChange={e => handleChange('endpoint', e.target.value)}
          placeholder="https://oss-cn-hangzhou.aliyuncs.com"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
        />
      </div>
    </div>
  )
}

const TencentConfigForm = ({ config, onChange }: { config: any; onChange: (config: any) => void }) => {
  const handleChange = (field: string, value: string) => {
    onChange({ ...config, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Secret ID</label>
          <input
            type="text"
            value={config.secretId || ''}
            onChange={e => handleChange('secretId', e.target.value)}
            placeholder="AKID..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Secret Key</label>
          <input
            type="password"
            value={config.secretKey || ''}
            onChange={e => handleChange('secretKey', e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Bucket 名称</label>
          <input
            type="text"
            value={config.bucket || ''}
            onChange={e => handleChange('bucket', e.target.value)}
            placeholder="my-bucket-1234567890"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Region</label>
          <select
            value={config.region || 'ap-guangzhou'}
            onChange={e => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-white"
          >
            <option value="ap-guangzhou">广州</option>
            <option value="ap-shanghai">上海</option>
            <option value="ap-beijing">北京</option>
            <option value="ap-chengdu">成都</option>
            <option value="ap-chongqing">重庆</option>
            <option value="ap-nanjing">南京</option>
            <option value="ap-hongkong">中国香港</option>
            <option value="ap-singapore">新加坡</option>
          </select>
        </div>
      </div>
    </div>
  )
}

const QiniuConfigForm = ({ config, onChange }: { config: any; onChange: (config: any) => void }) => {
  const handleChange = (field: string, value: string) => {
    onChange({ ...config, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Access Key</label>
          <input
            type="text"
            value={config.accessKey || ''}
            onChange={e => handleChange('accessKey', e.target.value)}
            placeholder="AK..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Secret Key</label>
          <input
            type="password"
            value={config.secretKey || ''}
            onChange={e => handleChange('secretKey', e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Bucket 名称</label>
          <input
            type="text"
            value={config.bucket || ''}
            onChange={e => handleChange('bucket', e.target.value)}
            placeholder="my-bucket"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">访问域名</label>
          <input
            type="text"
            value={config.domain || ''}
            onChange={e => handleChange('domain', e.target.value)}
            placeholder="https://cdn.example.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
          />
        </div>
      </div>
    </div>
  )
}

export const StorageConfigPanel: React.FC<StorageConfigProps> = ({ config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState<StorageConfig>(defaultConfig)
  const [expandedSections, setExpandedSections] = useState({
    extensions: true,
    providerConfig: true,
  })

  useEffect(() => {
    setLocalConfig({
      ...defaultConfig,
      ...config,
      aliyunConfig: { ...defaultConfig.aliyunConfig, ...config?.aliyunConfig },
      tencentConfig: { ...defaultConfig.tencentConfig, ...config?.tencentConfig },
      qiniuConfig: { ...defaultConfig.qiniuConfig, ...config?.qiniuConfig },
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

  const selectedProvider = providerOptions.find(p => p.value === localConfig.provider)
  const ProviderIcon = selectedProvider?.icon || HardDrive

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">存储节点说明</p>
            <p>此节点用于文件存储，支持本地存储和多种云存储服务。文件上传后，将返回可访问的下载地址。</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">存储服务提供商</label>
        <div className="grid grid-cols-1 gap-2">
          {providerOptions.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleConfigChange('provider', option.value)}
                className={`flex items-center gap-3 px-4 py-3 border rounded-lg transition-all ${
                  localConfig.provider === option.value
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${option.color}`} />
                <span className="text-sm font-medium text-slate-700">{option.label}</span>
                {localConfig.provider === option.value && (
                  <div className="ml-auto">
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('extensions')}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
        >
          <span>文件类型限制</span>
          {expandedSections.extensions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.extensions && (
          <div className="p-4 bg-white">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">选择文件类型</label>
            <select
              value={localConfig.fileExtension || 'jpg'}
              onChange={e => handleConfigChange('fileExtension', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            >
              {extensionOptions.map(ext => (
                <option key={ext.value} value={ext.value}>
                  {ext.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {localConfig.provider !== 'local' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('providerConfig')}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ProviderIcon className={`w-4 h-4 ${selectedProvider?.color}`} />
              {selectedProvider?.label} 配置
            </span>
            {expandedSections.providerConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expandedSections.providerConfig && (
            <div className="p-4 bg-white">
              {localConfig.provider === 'aliyun' && (
                <AliyunConfigForm
                  config={localConfig.aliyunConfig}
                  onChange={config => handleConfigChange('aliyunConfig', config)}
                />
              )}
              {localConfig.provider === 'tencent' && (
                <TencentConfigForm
                  config={localConfig.tencentConfig}
                  onChange={config => handleConfigChange('tencentConfig', config)}
                />
              )}
              {localConfig.provider === 'qiniu' && (
                <QiniuConfigForm
                  config={localConfig.qiniuConfig}
                  onChange={config => handleConfigChange('qiniuConfig', config)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {localConfig.provider === 'local' && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-slate-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">本地存储模式</p>
              <p className="text-xs text-slate-500">
                文件将存储在服务器的本地文件系统中。请确保服务器有足够的磁盘空间。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
