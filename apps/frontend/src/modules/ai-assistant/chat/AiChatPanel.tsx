import { useState } from 'react'

import {
  useAssistantStore,
} from '../store/assistant.store'

export function AiChatPanel() {
  const [input, setInput] =
    useState('')

  const {
    messages,
    addMessage,
  } = useAssistantStore()

  function sendMessage() {
    if (!input) return

    addMessage({
      role: 'user',
      content: input,
    })

    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content:
          'AI analyzed factory telemetry and found matching operational data.',
      })
    }, 500)

    setInput('')
  }

  return (
    <div className="flex h-[700px] flex-col rounded-3xl border border-zinc-800 bg-zinc-900">

      {/* HEADER */}
      <div className="border-b border-zinc-800 p-5">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              SteelTrack AI
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Operational Intelligence Assistant
            </p>

          </div>

          <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2">

            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

            <span className="text-xs font-medium text-emerald-400">
              ONLINE
            </span>

          </div>

        </div>

      </div>

      {/* CHAT */}
      <div className="flex-1 space-y-4 overflow-auto p-5">

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user'
                ? 'justify-end'
                : 'justify-start'
            }`}
          >

            <div
              className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-zinc-800 text-zinc-200'
              }`}
            >
              {message.content}
            </div>

          </div>
        ))}

      </div>

      {/* INPUT */}
      <div className="border-t border-zinc-800 p-5">

        <div className="flex gap-3">

          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Ask SteelTrack AI..."
            className="h-12 flex-1 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 text-white outline-none"
          />

          <button
            onClick={sendMessage}
            className="rounded-2xl bg-cyan-600 px-6 text-sm font-medium text-white"
          >
            Send
          </button>

        </div>

      </div>

    </div>
  )
}
