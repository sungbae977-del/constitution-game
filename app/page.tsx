"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

type OX = "O" | "X";

interface Question {
  question: string;
  answer: OX;
  explanation: string;
}

// Fisher–Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Home() {
  const [availableSets, setAvailableSets] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // 오답 관련
  const [showWrongList, setShowWrongList] = useState(false);
  const [selectedWrongSet, setSelectedWrongSet] = useState<string | null>(null);

  // 📌 저장된 파트 목록 불러오기
  useEffect(() => {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("questions_")
    );
    const setNames = keys.map((k) => k.replace("questions_", ""));
    setNames.sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));
    setAvailableSets(setNames);
  }, []);

  // 📌 파일 업로드 → 문제 그대로 저장
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, "");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

      const cleaned: Question[] = raw.map((r) => {
        const rawAnswer = String(r.answer ?? r.정답 ?? r.답 ?? "")
          .trim()
          .toUpperCase();
        let ans: OX = "O";
        if (rawAnswer === "X") ans = "X";
        else if (rawAnswer === "O") ans = "O";

        return {
          question: String(r.question ?? r.문제 ?? "").trim(),
          explanation: String(r.explanation ?? r.해설 ?? "").trim(),
          answer: ans,
        };
      });

      localStorage.setItem(`questions_${fileName}`, JSON.stringify(cleaned));
      setAvailableSets((prev) =>
        [...new Set([...prev, fileName])].sort((a, b) =>
          a.localeCompare(b, "ko", { numeric: true })
        )
      );
    };
    reader.readAsArrayBuffer(file);
  };

  // 📌 시작하기 → 문제 불러와 무작위 섞기
  const handleStartQuiz = () => {
    if (!selectedSet) return;
    const saved = localStorage.getItem(`questions_${selectedSet}`);
    if (saved) {
      const q: Question[] = JSON.parse(saved) as Question[];
      const shuffled: Question[] = shuffleArray<Question>(q);
      setQuestions(shuffled);
      setCurrentIndex(0);
      setIsQuizStarted(true);
    }
  };

  // 📌 정답 처리
  const handleAnswer = (userAnswer: OX) => {
    const current = questions[currentIndex];
    const correct = userAnswer === current.answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (!correct && selectedSet) {
      const wrongKey = `wrong_${selectedSet}`;
      const saved = JSON.parse(localStorage.getItem(wrongKey) || "[]") as Question[];
      const updated = [...saved, current];
      localStorage.setItem(wrongKey, JSON.stringify(updated));
    }
  };

  // 📌 다음 문제
  const handleNext = () => {
    setShowResult(false);
    setIsCorrect(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      alert("헌법 게임이 끝났습니다!");
    }
  };

  // 📌 오답 초기화
  const handleResetWrongAnswers = () => {
    const wrongKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith("wrong_")
    );
    wrongKeys.forEach((key) => localStorage.removeItem(key));
    setSelectedWrongSet(null);
    alert("모든 틀린 문제 기록이 초기화되었습니다.");
  };

  // 📌 오답 목록 화면
  if (showWrongList) {
    const wrongKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith("wrong_")
    );
    const wrongSets = wrongKeys
      .map((k) => {
        const name = k.replace("wrong_", "");
        const data = JSON.parse(localStorage.getItem(k) || "[]") as Question[];
        return { name, questions: data };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ko", { numeric: true }));

    // 1단계: 파트 선택
    if (!selectedWrongSet) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center p-6">
          <h1 className="text-2xl font-bold mb-6">틀린 문제 목록</h1>
          {wrongSets.length === 0 ? (
            <p>틀린 문제가 없습니다.</p>
          ) : (
            <ul className="space-y-3 max-w-xl w-full">
              {wrongSets.map((set) => (
                <li key={set.name}>
                  <button
                    onClick={() => setSelectedWrongSet(set.name)}
                    className="w-full px-4 py-3 bg-card rounded-lg shadow flex justify-between items-center hover:bg-blue-50"
                  >
                    <span className="font-semibold">{set.name}</span>
                    <span className="text-sm text-gray-600">
                      {set.questions.length}문제
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setShowWrongList(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              돌아가기
            </button>
            <button
              onClick={handleResetWrongAnswers}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              전체 초기화
            </button>
          </div>
        </div>
      );
    } else {
      // 2단계: 특정 파트 상세
      const part = wrongSets.find((s) => s.name === selectedWrongSet);
      return (
        <div className="min-h-screen bg-background flex flex-col items-center p-6">
          <h1 className="text-2xl font-bold">
            {selectedWrongSet} - 틀린 문제
          </h1>
          {part?.questions.length === 0 ? (
            <p>이 파트에서 틀린 문제가 없습니다.</p>
          ) : (
            <ul className="space-y-4 max-w-xl w-full mt-4">
              {part?.questions.map((q, i) => (
                <li key={i} className="bg-card p-4 rounded-xl shadow">
                  <p className="font-semibold mb-2">
                    {i + 1}. {q.question}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    정답: {q.answer}
                  </p>
                  <div className="p-2 bg-explanation rounded">
                    <p className="text-sm">{q.explanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setSelectedWrongSet(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg"
            >
              파트 목록으로
            </button>
            <button
              onClick={handleResetWrongAnswers}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              전체 초기화
            </button>
          </div>
        </div>
      );
    }
  }

  // 📌 퀴즈 화면
  if (isQuizStarted) {
    const current = questions[currentIndex];
    return (
      <div className="min-h-screen bg-background flex flex-col items-center p-6">
        {/* 상단 */}
        <div className="flex justify-between w-full max-w-xl mb-4">
          <h1 className="text-2xl font-bold">헌법 게임</h1>
          <button
            onClick={() => setShowWrongList(true)}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
          >
            틀린 문제 목록 보기
          </button>
        </div>

        {/* 문제 카드 */}
        <div className="bg-card p-6 rounded-2xl shadow-lg max-w-xl w-full">
          <p className="text-lg font-medium mb-4">
            문제 {currentIndex + 1} / {questions.length}
          </p>
          <p className="text-xl font-semibold mb-6">{current.question}</p>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => handleAnswer("O")}
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
              disabled={showResult}
            >
              O
            </button>
            <button
              onClick={() => handleAnswer("X")}
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
              disabled={showResult}
            >
              X
            </button>
          </div>

          {showResult && (
            <div className="mt-4">
              <p
                className={`font-bold mb-2 ${
                  isCorrect ? "text-correct" : "text-incorrect"
                }`}
              >
                {isCorrect ? "정답입니다!" : "틀렸습니다!"}
              </p>
              <div className="p-3 bg-explanation rounded-lg">
                <p className="text-sm">{current.explanation}</p>
              </div>
              <button
                onClick={handleNext}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                다음 문제
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 📌 초기 화면
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-8">
      {/* 업로드 */}
      <div className="flex flex-col items-center space-y-2">
        <label className="text-lg font-semibold">새 파트 업로드</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {/* 저장된 파트 */}
      <div className="flex flex-col items-center space-y-3">
        <h2 className="text-xl font-bold">저장된 파트</h2>
        {availableSets.length === 0 ? (
          <p className="text-gray-500">저장된 파트가 없습니다.</p>
        ) : (
          availableSets.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedSet(name)}
              className={`px-4 py-2 rounded-xl shadow ${
                selectedSet === name
                  ? "bg-blue-600 text-white"
                  : "bg-blue-300 text-black hover:bg-blue-400"
              }`}
            >
              {name}
            </button>
          ))
        )}
      </div>

      {/* 시작하기 */}
      {selectedSet && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-lg">
            선택된 파트: <b>{selectedSet}</b>
          </p>
          <button
            onClick={handleStartQuiz}
            className="px-6 py-2 bg-green-500 text-white rounded-xl shadow hover:bg-green-600"
          >
            시작하기
          </button>
        </div>
      )}
    </div>
  );
}
