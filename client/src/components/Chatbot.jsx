import React, { useState } from 'react'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Welcome to Redstone! I\'m here to help with onboarding.' },
    { from: 'bot', text: 'Feel free to ask any questions as you go.' }
  ])
  const [input, setInput] = useState('')

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages([...messages, { from: 'user', text: input }, { from: 'bot', text: 'Great! I\'ll note that.' }])
    setInput('')
  }

  return (
    <div className="mt-6 bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Onboarding Chatbot</h2>
      <div className="h-40 overflow-y-auto mb-2 space-y-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${m.from === 'bot' ? 'bg-brandBlue text-white self-start' : 'bg-brandGray text-gray-800 self-end'}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border p-1 mr-2 rounded"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          className="bg-brandRed text-white px-4 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  )
}