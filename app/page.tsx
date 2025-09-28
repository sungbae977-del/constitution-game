'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wrongList, setWrongList] = useState<{ id: number; count: number }[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setQuestions(jsonData as any[]);
      setCurrentIndex(0);
      setWrongList([]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAnswer = (userAnswer: string) => {
    const current = questions[currentIndex];
    if (!current) return;

    const correctAnswer = current['answer'];
    const questionId = current['id'];

    if (userAnswer !== correctAnswer) {
      setWrongList((prev) => {
        const existing = prev.find((item) => item.id === questionId);
        if (existing) {
          return prev.map((item) =>
            item.id === questionId ? { ...item, count: item.count + 1 } : item
          );
        } else {
          return [...prev, { id: questionId, count: 1 }];
        }
      });
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const currentQuestion = questions[currentIndex];

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold mb-4">헌법 게임</h1>
      <a href="/wrong-list" className="text-blue-600 underline mb-4 inline-block">
        틀린 문제 목록
      </a>

      {questions.length === 0 ? (
        <div>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="mb-4"
          />
          <p>엑셀 파일을 업로드해 주세요.</p>
        </div>
      ) : currentQuestion ? (
        <div>
          <p className="mb-2">문제 ID: {currentQuestion['id']}</p>
          <p className="mb-4">{currentQuestion['question']}</p>
          <div className="flex space-x-4 mb-4">
            <button
              className="bg-gray-200 px-4 py-2"
              onClick={() => handleAnswer('O')}
            >
              O
            </button>
            <button
              className="bg-gray-200 px-4 py-2"
              onClick={() => handleAnswer('X')}
            >
              X
            </button>
          </div>
          <button
            className="border border-black px-3 py-1"
            onClick={() => setCurrentIndex((prev) => prev + 1)}
          >
            다음 문제
          </button>
        </div>
      ) : (
        <p>모든 문제를 완료했습니다.</p>
      )}
    </main>
  );
}
