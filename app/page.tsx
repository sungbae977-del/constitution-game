"use client";

import React, { useState } from "react";
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
  const [wrongCounts, setWrongCounts] = useState<{ [key: string]: number }>({});

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
      setWrongCounts({});
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
      const questionText = questions[current]["문제"];
      setWrongQuestions((prev) => [...prev, questions[current]]);
      setWrongCounts((prev) => ({
        ...prev,
        [questionText]: (prev[questionText] || 0) + 1,
      }));
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
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4 text-center"
      style={{ color: "#000000" }}
    >
      <h1
        className="text-3xl font-bold mb-6"
        style={{ color: "#000000", fontWeight: "700" }}
      >
        헌법게임 🎮
      </h1>

      {questions.length === 0 ? (
        <div
          {...getRootProps()}
          className="border-2 border-dashed p-10 rounded-xl bg-white cursor-pointer shadow-md"
        >
          <input {...getInputProps()} />
          <p
            className="text-lg"
            style={{ color: "#000000", fontWeight: "500" }}
          >
            엑셀 파일을 업로드하세요 (.xlsx)
            <br />
            (문제 / 답 / 해설)
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow-lg space-y-4">
          <div
            className="text-xl font-semibold"
            style={{ color: "#000000", fontWeight: "700" }}
          >
            Q{current + 1}. {questions[current]["문제"]}
          </div>

          {answer === null ? (
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleAnswer("O")}
                className="px-6 py-2 bg-green-500 text-white rounded-lg"
              >
                ⭕ O
              </button>
              <button
                onClick={() => handleAnswer("X")}
                className="px-6 py-2 bg-red-500 text-white rounded-lg"
              >
                ❌ X
              </button>
            </div>
          ) : (
            <div className="space-y-3" style={{ color: "#000000" }}>
              <div
                className={`text-lg font-bold ${
                  isCorrect ? "text-green-600" : "text-red-600"
                }`}
              >
                {isCorrect ? "정답입니다!" : "틀렸습니다."}
              </div>
              <div
                className="bg-yellow-100 p-3 rounded-md"
                style={{ color: "#000000", fontWeight: "500" }}
              >
                💡 해설: {questions[current]["해설"]}
              </div>
              <button
                onClick={nextQuestion}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                다음 문제 ▶️
              </button>
            </div>
          )}
        </div>
      )}

      {questions.length > 0 &&
        mode === "normal" &&
        wrongQuestions.length > 0 &&
        answer !== null && (
          <button
            onClick={startReview}
            className="mt-6 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-sm"
          >
            틀린 문제 복습하기 🔁
          </button>
        )}

      {mode === "review" && (
        <p
          className="mt-4 text-sm"
          style={{ color: "#000000", fontWeight: "500" }}
        >
          현재는 틀린 문제 복습 모드입니다.
        </p>
      )}

      {Object.keys(wrongCounts).length > 0 && (
        <div className="mt-8 w-full max-w-xl bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-2 text-black">📊 틀린 문제 통계</h2>
          <ul className="list-disc list-inside text-black text-sm">
            {Object.entries(wrongCounts).map(([question, count]) => (
              <li key={question}>
                <strong>{question}</strong> — <span>{count}회 틀림</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
