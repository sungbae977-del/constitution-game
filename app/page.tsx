// app/page.tsx
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import WrongList from './wrong-list/page';

type OX = 'O' | 'X';

interface Question {
  question: string;
  answer: OX;          // 'O' | 'X'
  explanation: string;
}

export default function Home() {
  // --- state ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([]);
  const [showWrongList, setShowWrongList] = useState<boolean>(false);

  // --- helpers ---
  const normalizeAnswer = (raw: unknown): OX => {
    const s = String(raw ?? '').trim().toLowerCase();
    if (s === 'x' || s === 'false' || s === '0') return 'X';
    return 'O';
  };

  // 엑셀 업로드
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // 컬럼명이 (question/answer/explanation) 또는 (문제/정답/해설) 이어도 수용
      const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

      const cleaned: Question[] = raw.map((r) => ({
        question: String(r.question ?? r.문제 ?? '').trim(),
        explanation: String(r.explanation ?? r.해설 ?? '').trim(),
        answer: normalizeAnswer(r.answer ?? r.정답),
      }));

      setQuestions(cleaned);
      setCurrentQuestionIndex(0);
      setWrongAnswers([]);
      setShowWrongList(false);
      setIsCorrect(null);
      setShowResult(false);
      try { localStorage.removeItem('wrongAnswers'); } catch {}
    };
    reader.readAsArrayBuffer(file);
  };

  // 정답 처리
  const handleAnswer = (userAnswer: OX) => {
    const current = questions[currentQuestionIndex];
    if (!current) return; // safety guard

    const correct = userAnswer === current.answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (!correct) {
      setWrongAnswers((prev) => {
        const next = [...prev, current];
        try { localStorage.setItem('wrongAnswers', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    // 다음 문제 이동(잠깐 결과/해설 보여주기)
    setTimeout(() => {
      setShowResult(false);
      setIsCorrect(null);
      setCurrentQuestionIndex((prev) => prev + 1);
    }, 2000);
  };

  // --- render branches ---

  // 틀린 문제 목록(하위 페이지 컴포넌트 재사용)
  if (showWrongList) {
    return (
      <WrongList
        wrongAnswers={wrongAnswers}
        onBack={() => setShowWrongList(false)}
      />
    );
  }

  // 업로드 전 화면
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center text-gray-800 px-4">
        <h1 className="text-4xl font-bold mb-4">헌법 게임 🎮</h1>
        <button
          className="text-blue-600 underline mb-4"
          onClick={() => setShowWrongList(true)}
        >
          틀린 문제 목록
        </button>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="mb-2"
        />
        <p className="text-sm text-gray-600">엑셀 파일을 업로드해 주세요.</p>
      </div>
    );
  }

  // 한 사이클 종료
  if (currentQuestionIndex >= questions.length) {
    const correctCount = questions.length - wrongAnswers.length;
    const rate = ((correctCount / questions.length) * 100).toFixed(1);

    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center text-gray-800 px-4">
        <h1 className="text-3xl font-bold mb-6">헌법 게임 완료 🎉</h1>
        <p className="text-xl mb-4">
          총 {questions.length}문제 중 {correctCount}문제 맞춤 ({rate}%)
        </p>
        <button
          onClick={() => setShowWrongList(true)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
        >
          틀린 문제 목록 보기
        </button>
      </div>
    );
  }

  // 진행 화면
  const current = questions[currentQuestionIndex]; // 여기서는 존재 보장됨(위에서 종료 분기)

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4 text-gray-800">
      <h1 className="text-4xl font-bold mb-8">헌법게임 🎮</h1>

      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl text-center">
        <h2 className="text-lg font-semibold mb-6">
          Q{currentQuestionIndex + 1}. {current.question}
        </h2>

        <div className="flex justify-center gap-6">
          <button
            onClick={() => handleAnswer('O')}
            className="bg-white border px-6 py-3 rounded-lg shadow hover:bg-gray-100 text-xl"
          >
            ⭕
          </button>
          <button
            onClick={() => handleAnswer('X')}
            className="bg-white border px-6 py-3 rounded-lg shadow hover:bg-gray-100 text-xl"
          >
            ❌
          </button>
        </div>

        {showResult && (
          <div
            className={`mt-6 p-4 rounded-lg shadow ${
              isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            <p className="font-bold mb-2">
              {isCorrect ? '정답입니다!' : '오답입니다!'}
            </p>
            <div className="bg-yellow-50 p-3 rounded text-gray-800">
              💡 해설: {current.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
