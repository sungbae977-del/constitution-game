"use client";

import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState<boolean[]>([]);
  const [wrongCounts, setWrongCounts] = useState<{ [key: string]: number }>({});

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
      setQuestions(jsonData);
      setCurrentIndex(0);
      setShowAnswer(false);
      setUserAnswers([]);
      setWrongCounts({});
    };

    reader.readAsArrayBuffer(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleAnswer = (answer: boolean) => {
    if (questions.length === 0) return;
    const correctAnswer = questions[currentIndex]?.answer === "O";
    const isCorrect = answer === correctAnswer;

    if (!isCorrect) {
      const questionText = questions[currentIndex]?.question;
      setWrongCounts((prev) => ({
        ...prev,
        [questionText]: (prev[questionText] || 0) + 1,
      }));
    }

    setUserAnswers((prev) => [...prev, isCorrect]);
    setShowAnswer(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("퀴즈가 완료되었습니다.");
    }
  };

  const currentQuestion = questions[currentIndex];
  const isCorrect = userAnswers[currentIndex];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <nav className="mb-4 flex gap-4">
        <Link href="/">홈</Link>
        <Link href="/review">틀린 문제 목록</Link>
      </nav>

      {questions.length === 0 ? (
        <div
          {...getRootProps()}
          className="border-2 border-dashed p-4 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          <p>엑셀 파일을 여기에 드래그하거나 클릭하여 업로드하세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-lg font-semibold">
            {currentIndex + 1}. {currentQuestion?.question}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              O
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              X
            </button>
          </div>
          {showAnswer && (
            <div
              className={`p-2 rounded text-white ${
                isCorrect ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {isCorrect ? "정답입니다!" : `틀렸습니다. 정답은 ${currentQuestion?.answer}입니다.`}
            </div>
          )}
          <button
            onClick={handleNext}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            다음 문제
          </button>
        </div>
      )}
    </div>
  );
}