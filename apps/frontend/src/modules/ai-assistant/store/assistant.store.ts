import { create } from 'zustand'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type AssistantState = {
  messages: Message[]

  addMessage: (
    message: Message
  ) => void
}

export const useAssistantStore =
  create<AssistantState>((set) => ({
    messages: [
      {
        role: 'assistant',
        content:
          'SteelTrack AI online. How can I help?',
      },
    ],

    addMessage: (message) =>
      set((state) => ({
        messages: [
          ...state.messages,
          message,
        ],
      })),
  }))
