/*
[1] layout.tsx - 상단 메뉴 바 포함
*/

// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "헌법게임",
  description: "대한민국 헌법 퀴즈",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-green-50 text-black">
        <nav className="bg-white shadow-md p-4 flex justify-center space-x-8">
          <Link href="/" className="font-semibold hover:text-blue-600">홈</Link>
          <Link href="/review" className="font-semibold hover:text-blue-600">틀린 문제 목록</Link>
        </nav>
        <main className="p-6 flex justify-center items-center min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </body>
    </html>
  );
}

/*
[2] page.tsx - 기존 헌법게임 + 틀린 문제 로컬스토리지 저장 포함
*/

// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

export default function ConstitutionGame() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState<"O" | "X" | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [wrongQuestions, setWrongQuestions] = useState<any[]>([]);
  const [mode, setMode] = useState<"normal" | "review">("normal");

  useEffect(() => {
    const saved = localStorage.getItem("wrongQuestions");
    if (saved) setWrongQuestions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("wrongQuestions", JSON.stringify(wrongQuestions));
  }, [wrongQuestions]);

  const shuffleArray = (arr: any[]) => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const onDrop = (acceptedFiles: File[]) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      const shuffled = shuffleArray(json);
      setQuestions(shuffled);
      setCurrent(0);
      setAnswer(null);
      setIsCorrect(null);
      setShowExplanation(false);
      setWrongQuestions([]);
      setMode("normal");
    };
    reader.readAsArrayBuffer(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleAnswer = (choice: "O" | "X") => {
    const correct = questions[current]["답"];
    setAnswer(choice);
    setIsCorrect(choice === correct);
    setShowExplanation(true);

    if (choice !== correct && mode === "normal") {
      setWrongQuestions((prev) => [...prev, questions[current]]);
    }
  };

  const nextQuestion = () => {
    setCurrent((prev) => (prev + 1) % questions.length);
    setAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
  };

  const startReview = () => {
    if (wrongQuestions.length === 0) return;
    setQuestions(shuffleArray(wrongQuestions));
    setCurrent(0);
    setAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setWrongQuestions([]);
    setMode("review");
  };

  return (
    <div className="text-black w-full max-w-xl">
      {questions.length === 0 ? (
        <div {...getRootProps()} className="border-2 border-dashed p-10 rounded-xl bg-white cursor-pointer shadow-md">
          <input {...getInputProps()} />
          <p className="text-lg font-medium">
            엑셀 파일을 업로드하세요 (.xlsx)
            <br />(문제 / 답 / 해설)
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
          <div className="text-xl font-semibold">
            Q{current + 1}. {questions[current]["문제"]}
          </div>

          {answer === null ? (
            <div className="flex justify-center space-x-4">
              <button onClick={() => handleAnswer("O")} className="px-6 py-2 bg-green-500 text-white rounded-lg">
                ⭕ O
              </button>
              <button onClick={() => handleAnswer("X")} className="px-6 py-2 bg-red-500 text-white rounded-lg">
                ❌ X
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`text-lg font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                {isCorrect ? "정답입니다!" : "틀렸습니다."}
              </div>
              <div className="bg-yellow-100 p-3 rounded-md font-medium">
                💡 해설: {questions[current]["해설"]}
              </div>
              <button onClick={nextQuestion} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
                다음 문제 ▶️
              </button>
            </div>
          )}
        </div>
      )}

      {questions.length > 0 && mode === "normal" && wrongQuestions.length > 0 && answer !== null && (
        <button
          onClick={startReview}
          className="mt-6 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-sm"
        >
          틀린 문제 복습하기 🔁
        </button>
      )}

      {mode === "review" && (
        <p className="mt-4 text-sm font-medium">
          현재는 틀린 문제 복습 모드입니다.
        </p>
      )}
    </div>
  );
}

/*
[3] review/page.tsx - 틀린 문제 목록 페이지
*/

// app/review/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function ReviewList() {
  const [wrongQuestions, setWrongQuestions] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("wrongQuestions");
    if (saved) setWrongQuestions(JSON.parse(saved));
  }, []);

  return (
    <div className="w-full max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">틀린 문제 목록 🔁</h2>
      {wrongQuestions.length === 0 ? (
        <p className="text-gray-600">저장된 틀린 문제가 없습니다.</p>
      ) : (
        wrongQuestions.map((q, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow">
            <p className="font-semibold">Q. {q["문제"]}</p>
            <p className="mt-2 text-sm text-gray-700">💡 해설: {q["해설"]}</p>
          </div>
        ))
      )}
    </div>
  );
}