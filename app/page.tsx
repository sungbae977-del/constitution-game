'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import WrongListClient, { OX, Question } from './components/WrongListClient';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([]);
  const [showWrongList, setShowWrongList] = useState<boolean>(false);

  const normalizeAnswer = (raw: unknown): OX => {
    const s = String(raw ?? '').trim();
    return s === 'X' ? 'X' : 'O';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
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
      try {
        localStorage.removeItem('wrongAnswers');
      } catch {}
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAnswer = (userAnswer: OX) => {
    const current = questions[currentQuestionIndex];
    if (!current) return;

    const correct = userAnswer === current.answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (!correct) {
      setWrongAnswers((prev) => {
        const next = [...prev, current];
        try {
          localStorage.setItem('wrongAnswers', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setIsCorrect(null);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  if (showWrongList) {
    return (
      <WrongListClient
        wrongAnswers={wrongAnswers}
        onBack={() => setShowWrongList(false)}
      />
    );
  }

  // 초기 화면 (엑셀 업로드)
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-gray-800 px-4">
        <div className="bg-card p-8 rounded-2xl shadow-lg w-full max-w-xl text-center">
          <h1 className="text-4xl font-bold mb-6">헌법 게임 🎮</h1>
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
      </div>
    );
  }

  // 모든 문제 풀이 완료
  if (currentQuestionIndex >= questions.length) {
    const correctCount = questions.length - wrongAnswers.length;
    const rate = ((correctCount / questions.length) * 100).toFixed(1);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-gray-800 px-4">
        <div className="bg-card p-8 rounded-2xl shadow-lg w-full max-w-xl text-center">
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
      </div>
    );
  }

  // 문제 풀이 중
  const current = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-gray-800 px-4">
      <div className="bg-card p-6 rounded-2xl shadow-lg w-full max-w-2xl text-center relative">
        {/* 상단 제목 + 틀린 문제 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">헌법게임 🎮</h1>
          <button
            onClick={() => setShowWrongList(true)}
            className="text-sm text-blue-600 underline"
          >
            틀린 문제 목록
          </button>
        </div>

        {/* 문제 */}
        <h2 className="text-lg font-semibold mb-6">
          Q{currentQuestionIndex + 1}. {current.question}
        </h2>

        {/* OX 버튼 */}
        <div className="flex justify-center gap-6 mb-6">
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

        {/* 정답/오답 결과 */}
        {showResult && (
          <div
            className={`mt-6 p-4 rounded-lg shadow ${
              isCorrect ? 'bg-green-100 text-correct' : 'bg-red-100 text-incorrect'
            }`}
          >
            <p className="font-bold mb-2">
              {isCorrect ? '정답입니다!' : '오답입니다!'}
            </p>
            <div className="bg-explanation p-3 rounded text-gray-800 mb-4">
              💡 해설: {current.explanation}
            </div>
            <button
              onClick={handleNextQuestion}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            >
              다음 문제 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
