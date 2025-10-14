'use client';

import React, { useMemo, useState } from 'react';

export type OX = 'O' | 'X';

export interface Question {
  id: string;              // 해시로 부여되는 문항 고유 ID
  question: string;
  answer: OX;
  explanation: string;
}

type WrongCountMap = Record<string, number>; // { [questionId]: count }

interface Props {
  // partKey -> { questions, wrongCount }
  partsData: Record<string, { title: string; questions: Question[]; wrongCount: WrongCountMap }>;
  onBack?: () => void;
}

export default function WrongListClient({ partsData, onBack }: Props) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const partKeysSorted = useMemo(() => {
    // "자연 정렬(숫자+한글)" 간단 구현: 숫자와 비숫자 분리 후 비교
    const collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });
    return Object.keys(partsData).sort((a, b) => collator.compare(partsData[a].title, partsData[b].title));
  }, [partsData]);

  if (!selectedPart) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-3xl bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-4">틀린 문제 목록</h2>
          {partKeysSorted.length === 0 ? (
            <p className="text-center">아직 업로드된 파트가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partKeysSorted.map((k) => {
                const label = partsData[k].title;
                const totalWrong = Object.values(partsData[k].wrongCount).reduce((a, b) => a + b, 0);
                return (
                  <button
                    key={k}
                    className="rounded-xl border bg-white shadow hover:shadow-md p-4 text-left"
                    onClick={() => setSelectedPart(k)}
                  >
                    <div className="font-semibold">{label}</div>
                    <div className="text-sm mt-1">오답 총합: <b>{totalWrong}</b></div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 text-center">
            {onBack ? (
              <button onClick={onBack} className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600">
                뒤로
              </button>
            ) : (
              <a href="/" className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600">
                메인으로
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { questions, wrongCount, title } = partsData[selectedPart] ?? { questions: [], wrongCount: {}, title: selectedPart };

  // wrongCount > 0 인 질문만 보여줌
  const rows = questions
    .filter((q) => (wrongCount[q.id] ?? 0) > 0)
    .map((q) => ({ q, count: wrongCount[q.id] ?? 0 }));

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-card rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-4">틀린 문제 목록 — {title}</h2>

        {rows.length === 0 ? (
          <p className="text-center">해당 파트에서 틀린 문제가 없습니다. 🎉</p>
        ) : (
          <ul className="space-y-4">
            {rows.map(({ q, count }) => (
              <li key={q.id} className="border rounded-xl p-4 bg-white">
                <div className="text-sm text-gray-600 mb-1">
                  오답 횟수: <b>{count}</b>
                </div>
                <div className="font-semibold mb-2 whitespace-pre-wrap">{q.question}</div>
                <div className="text-sm mb-2">정답: <b>{q.answer}</b></div>
                <div className="bg-explanation rounded p-3 text-sm whitespace-pre-wrap">
                  💡 해설: {q.explanation}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setSelectedPart(null)} className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            파트 선택으로
          </button>
          {onBack ? (
            <button onClick={onBack} className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600">
              메인으로
            </button>
          ) : (
            <a href="/" className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600">
              메인으로
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
