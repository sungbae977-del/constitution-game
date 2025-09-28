'use client';

import React from 'react';

export type OX = 'O' | 'X'; // ✅ export 추가
export interface Question {
  question: string;
  answer: OX;
  explanation: string;
}

export default function WrongListClient({
  wrongAnswers,
  onBack,
}: {
  wrongAnswers: Question[];
  onBack?: () => void;
}) {
  const counts = wrongAnswers.reduce<Record<string, { item: Question; count: number }>>(
    (acc, cur) => {
      const key = `${cur.question}__${cur.answer}`;
      if (!acc[key]) acc[key] = { item: cur, count: 0 };
      acc[key].count += 1;
      return acc;
    },
    {}
  );
  const rows = Object.values(counts);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4 text-gray-800">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">틀린 문제 목록</h2>

        {rows.length === 0 ? (
          <p className="text-center text-gray-600">틀린 문제가 없습니다. 🎉</p>
        ) : (
          <ul className="space-y-4">
            {rows.map(({ item, count }, idx) => (
              <li key={idx} className="border rounded-xl p-4 bg-white">
                <div className="text-sm text-gray-500 mb-1">
                  오답 횟수: <b>{count}</b>
                </div>
                <div className="font-semibold mb-2">{item.question}</div>
                <div className="text-sm mb-2">정답: <b>{item.answer}</b></div>
                <div className="bg-yellow-50 rounded p-3 text-sm">
                  💡 해설: {item.explanation}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-center">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600"
            >
              문제로 돌아가기
            </button>
          ) : (
            <a
              href="/"
              className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600"
            >
              메인으로
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
