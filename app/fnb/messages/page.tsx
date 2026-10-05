'use client'

import { useState } from 'react'

type Message = {
  id: number
  to: string
  subject: string
  body: string
  time: string
  status: 'sent' | 'delivered'
}

const DEPARTMENTS = [
  'Kitchen',
  'Bar',
  'Store',
  'Purchaser',
  'Admin',
  'All Departments',
]

const initialMessages: Message[] = [
  {
    id: 1,
    to: 'Kitchen',
    subject: 'Recipe update – Chicken Alfredo',
    body: 'Please use the updated portion sizes starting tonight.',
    time: '2026-10-04 18:20',
    status: 'delivered',
  },
  {
    id: 2,
    to: 'Store',
    subject: 'Low stock alert – Romaine',
    body: 'Romaine lettuce is below minimum. Please restock before lunch service.',
    time: '2026-10-04 14:05',
    status: 'delivered',
  },
  {
    id: 3,
    to: 'Bar',
    subject: 'Shared cream stock',
    body: 'We transferred 2L of heavy cream to bar fridge. Confirm received.',
    time: '2026-10-03 11:40',
    status: 'sent',
  },
]

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [to, setTo] = useState('Kitchen')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sentFlash, setSentFlash] = useState(false)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return

    const now = new Date()
    const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setMessages((prev) => [
      {
        id: Date.now(),
        to,
        subject: subject.trim(),
        body: body.trim(),
        time,
        status: 'sent',
      },
      ...prev,
    ])
    setSubject('')
    setBody('')
    setSentFlash(true)
    setTimeout(() => setSentFlash(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Compose */}
      <section className="rounded-2xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Send Message
          </h2>
          {sentFlash && (
            <span className="text-xs font-medium text-emerald-400 animate-pulse">
              Message sent
            </span>
          )}
        </div>

        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              To department
            </label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Brief subject…"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              placeholder="Write your message to the department…"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Message
          </button>
        </form>
      </section>

      {/* Sent history */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--muted)] px-1">
          Sent ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-8">
            No messages yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 sm:p-4 space-y-1.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400 font-medium">
                    To: {m.to}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      m.status === 'delivered'
                        ? 'bg-sky-600/20 text-sky-400'
                        : 'bg-[var(--btn-hover)] text-[var(--muted)]'
                    }`}
                  >
                    {m.status}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] ml-auto">
                    {m.time}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {m.subject}
                </p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {m.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
