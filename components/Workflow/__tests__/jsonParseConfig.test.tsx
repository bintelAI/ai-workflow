import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import JSONParseConfig from '../configs/JSONParseConfig'

vi.mock('../configs/common/index', () => ({
  InputParams: () => <div data-testid="input-params" />,
}))

describe('JSONParseConfig', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()
  })

  it('patches mode and output params together when stringify switch is clicked', async () => {
    const onConfigPatch = vi.fn()

    await act(async () => {
      root.render(
        <JSONParseConfig
          config={{ mode: 'parse' }}
          onConfigChange={vi.fn()}
          onConfigPatch={onConfigPatch}
        />
      )
    })

    const switchButton = container.querySelector<HTMLButtonElement>('button[role="switch"]')

    await act(async () => {
      switchButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onConfigPatch).toHaveBeenCalledWith({
      mode: 'stringify',
      outputParams: [{ field: 'json', type: 'string' }],
    })
  })
})
