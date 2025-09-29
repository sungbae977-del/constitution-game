'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

type OX = 'O' | 'X';

interface Question {
  question: string;
  answer: OX;
  explanation: string;
}

// 배열 셔플 함수 (Fisher–Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Page() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([]);
  const [showWrongList, setShowWrongList] = useState(false);

  // 파일 업로드 핸들러
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

      const cleaned: Question[] = raw.map((r) => {
        const rawAnswer = String(r.answer ?? r.정답 ?? r.답 ?? '').trim().toUpperCase();

        let ans: OX = 'O';
        if (rawAnswer === 'X') ans = 'X';
        else if (rawAnswer === 'O') ans = 'O';

        return {
          question: String(r.question ?? r.문제 ?? '').trim(),
          explanation: String(r.explanation ?? r.해설 ?? '').trim(),
          answer: ans,
        };
      });

      // ✅ 문제를 무작위로 섞어서 세팅
      const shuffled = shuffleArray(cleaned);

      setQuestions(shuffled);
      setCurrentQuestionIndex(0);
      setWrongAnswers([]);
      setShowWrongList(false);
      setIsCorrect(null);
      setShowResult(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // 정답 체크
  const handleAnswer = (userAnswer: OX) => {
    const current = questions[currentQuestionIndex];
    if (!current) return;

    const correct = userAnswer === current.answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (!correct) {
      setWrongAnswers((prev) => [...prev, current]);
    }
  };

  // 다음 문제로 이동
  const handleNextQuestion = () => {
    setShowResult(false);
    setIsCorrect(null);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  // 퀴즈 완료 여부
  const isFinished = currentQuestionIndex >= questions.length;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card rounded-2xl shadow-lg w-full max-w-xl p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">헌법 퀴즈</h1>

        {/* 엑셀 업로드 화면 */}
        {!questions.length && (
          <div className="flex flex-col items-center space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="border p-2 rounded"
            />
            <p className="text-sm text-text">엑셀 파일을 업로드하세요 (문제, 답, 해설)</p>
          </div>
        )}

        {/* 문제 풀이 화면 */}
        {questions.length > 0 && !isFinished && !showWrongList && (
          <>
            <div className="mb-6 text-lg text-text">
              {/* ✅ 문제 번호를 문제 앞에 붙여서 표시 */}
              {currentQuestionIndex + 1}. {questions[currentQuestionIndex].question}
            </div>

            <div className="flex justify-center space-x-6 mb-6">
              <button
                onClick={() => handleAnswer('O')}
                className="px-6 py-2 bg-green-500 text-white rounded-xl shadow hover:bg-green-600"
              >
                O
              </button>
              <button
                onClick={() => handleAnswer('X')}
                className="px-6 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600"
              >
                X
              </button>
            </div>

            {showResult && (
              <div className="space-y-3 text-center">
                <p className={isCorrect ? 'text-correct font-semibold' : 'text-incorrect font-semibold'}>
                  {isCorrect ? '정답입니다!' : '틀렸습니다!'}
                </p>
                <div className="bg-explanation rounded-lg p-3 text-sm">
                  {questions[currentQuestionIndex].explanation}
                </div>
                {currentQuestionIndex < questions.length - 1 && (
                  <button
                    onClick={handleNextQuestion}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600"
                  >
                    다음 문제
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowWrongList(true)}
                className="text-blue-600 underline text-sm"
              >
                틀린 문제 목록 보기
              </button>
            </div>
          </>
        )}

        {/* 퀴즈 완료 화면 */}
        {isFinished && !showWrongList && (
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-text">퀴즈 완료!</p>
            <p className="text-text">
              총 {questions.length}문제 중 {questions.length - wrongAnswers.length}개 정답
              (정답률 {questions.length > 0
                ? Math.round(((questions.length - wrongAnswers.length) / questions.length) * 100)
                : 0}%)
            </p>
            <button
              onClick={() => setShowWrongList(true)}
              className="px-4 py-2 bg-yellow-400 text-white rounded-xl shadow hover:bg-yellow-500"
            >
              틀린 문제 목록 보기
            </button>
          </div>
        )}

        {/* 틀린 문제 목록 화면 */}
        {showWrongList && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-center">틀린 문제 목록</h2>
            {wrongAnswers.length === 0 ? (
              <p className="text-text text-center">틀린 문제가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {wrongAnswers.map((q, idx) => (
                  <li key={idx} className="bg-explanation p-3 rounded-lg">
                    <p className="font-semibold">{idx + 1}. {q.question}</p>
                    <p>정답: {q.answer}</p>
                    <p className="text-sm mt-1">{q.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowWrongList(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600"
              >
                돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
