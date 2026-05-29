const messages = [
  {
    role: 'assistant',
    content:
      'Low stock risk detected in Warehouse A.',
  },

  {
    role: 'assistant',
    content:
      'Production throughput increased by 12% today.',
  },

  {
    role: 'assistant',
    content:
      'Supplier delivery delay may impact Project PJ-002.',
  },

  {
    role: 'assistant',
    content:
      'QC anomaly pattern detected in Welding Stage.',
  },
]

export function CopilotConversation() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-fuchsia-400">
          AI Runtime Conversation
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational intelligence stream
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className="
              rounded-2xl
              border
              border-fuchsia-500/20
              bg-zinc-950
              p-4
            "
          >
            <div className="text-xs uppercase tracking-[0.2em] text-fuchsia-400">
              AI Assistant
            </div>

            <div className="mt-2 text-sm text-white">
              {message.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
