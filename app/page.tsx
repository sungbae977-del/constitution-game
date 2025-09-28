'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [index, setIndex] = useState(0);
  const [wrongCounts, setWrongCounts] = useState<{ [key: number]: number }>({
    0: 3,
    1: 1,
    2: 2,
  });

  const wrongQuestionIds = Object.keys(wrongCounts)
    .filter((key) => wrongCounts[parseInt(key)] > 0)
    .map((key) => parseInt(key));

  const currentId = wrongQuestionIds[index];

  const handleNext = () => {
    if (index < wrongQuestionIds.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      alert('마지막 문제입니다.');
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!isCorrect) {
      alert('틀렸습니다.');
    } else {
      alert('정답입니다.');
    }
    handleNext();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* 상단 메뉴 */}
      <nav className="mb-8 flex space-x-6 text-lg font-semibold">
        <Link href="/" className="hover:underline">
          홈
        </Link>
        <Link href="/wrong" className="hover:underline">
          틀린 문제 목록
        </Link>
      </nav>

      {/* 틀린 문제 보기 영역 */}
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">틀린 문제 목록</h1>

        <div className="mb-4">
          <p className="mb-2 text-lg font-medium">문제 ID: {currentId}</p>
          <p className="text-sm text-gray-400">틀린 횟수: {wrongCounts[currentId]}</p>
        </div>

        {/* O / X 버튼 */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => handleAnswer(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            O
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            X
          </button>
        </div>

        {/* 다음 문제 버튼 */}
        <button
          onClick={handleNext}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          다음 문제
        </button>
      </div>
    </div>
  );
}
