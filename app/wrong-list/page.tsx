// app/wrong-list/page.tsx
'use client'

import Link from 'next/link'

export default function WrongListPage() {
  const wrongList = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('wrongList') || '[]')
    : []

  return (
    <main className="p-4">
      <Link href="/" className="text-blue-600 underline">홈</Link>
      <h1 className="text-2xl font-bold mb-4">틀린 문제 목록</h1>

      {wrongList.length === 0 ? (
        <p>틀린 문제가 없습니다.</p>
      ) : (
        <ul className="list-disc pl-6">
          {wrongList.map((item: any) => (
            <li key={item.id}>
              문제 ID: {item.id}, 틀린 횟수: {item.count}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
