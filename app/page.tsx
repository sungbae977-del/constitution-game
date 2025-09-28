// app/page.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

// 기존 OX 퀴즈 컴포넌트 로직
export default function Home() {
  const [questionId, setQuestionId] = useState(0)
  const [wrongList, setWrongList] = useState<{ id: number; count: number }[]>([])

  const handleAnswer = (correct: boolean) => {
    if (!correct) {
      setWrongList(prev => {
        const existing = prev.find(q => q.id === questionId)
        if (existing) {
          return prev.map(q =>
            q.id === questionId ? { ...q, count: q.count + 1 } : q
          )
        } else {
          return [...prev, { id: questionId, count: 1 }]
        }
      })
    }

    setQuestionId(prev => prev + 1)
  }

  return (
    <main className="p-4">
      <Link href="/wrong-list" className="text-blue-600 underline">
        틀린 문제 목록
      </Link>

      <h1 className="text-2xl font-bold mb-4">헌법 게임</h1>
      <p>문제 ID: {questionId}</p>

      <div className="flex gap-2 my-4">
        <button onClick={() => handleAnswer(true)} className="border px-4 py-1">O</button>
        <button onClick={() => handleAnswer(false)} className="border px-4 py-1">X</button>
      </div>

      <button
        onClick={() => setQuestionId(q => q + 1)}
        className="bg-gray-200 px-4 py-1"
      >
        다음 문제
      </button>
    </main>
  )
}
