import React, { useState } from 'react'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! How was your day 1 at Redstone?' }
  ])
  const [input, setInput] = useState('')

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages([...messages, { from: 'user', text: input }])
    setMessages(m => [...m, { from: 'bot', text: 'Thanks for sharing!' }])
    setInput('')
  }

  return (
    <div className="mt-4 p-2 border rounded bg-white">
      <h2 className="text-xl font-semibold mb-2">Chatbot</h2>
      <div className="h-40 overflow-y-auto mb-2">
        {messages.map((m, i) => (
          <div key={i} className={m.from === 'bot' ? 'text-brandBlue' : 'text-brandRed'}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border p-1 mr-2"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="bg-brandBlue text-white px-4" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  )
}