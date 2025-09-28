"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";

// Question 타입 정의
type Question = {
  문제: string;
  정답: "O" | "X";
  해설?: string;
};

export default function Page() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongList, setWrongList] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsed: Question[] = XLSX.utils.sheet_to_json(sheet);

      setQuestions(parsed);
      setCurrentIndex(0);
      setShowResult(false);
      setCorrectCount(0);
      setWrongList([]);
      setUserAnswers([]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAnswer = (answer: string) => {
    const current = questions[currentIndex];
    const correct = String(current?.정답 ?? "").toUpperCase();

    const isCorrect = answer.toUpperCase() === correct;
    setUserAnswers((prev) => [...prev, answer]);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongList((prev) => [...prev, current]);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  if (questions.length === 0) {
    return (
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-4">헌법 게임</h1>
        <Link href="/wrong-list" className="text-blue-600 underline">
          틀린 문제 목록
        </Link>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="block mt-4" />
        <p className="mt-4">엑셀 파일을 업로드해 주세요.</p>
      </main>
    );
  }

  if (showResult) {
    const rate = Math.round((correctCount / questions.length) * 100);
    return (
      <main className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">퀴즈 완료!</h1>
        <p className="text-lg">총 문항 수: {questions.length}</p>
        <p className="text-green-600 font-semibold">정답 수: {correctCount}</p>
        <p className="text-blue-600 font-semibold">정답률: {rate}%</p>
        <Link href="/" className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          처음으로 돌아가기
        </Link>
      </main>
    );
  }

  const current = questions[currentIndex];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
      <h1 className="text-3xl font-bold mb-4">헌법게임 🎮</h1>
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-4">
          Q{currentIndex + 1}. {current.문제}
        </h2>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleAnswer("O")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            O
          </button>
          <button
            onClick={() => handleAnswer("X")}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
          >
            X
          </button>
        </div>
      </div>
    </main>
  );
}