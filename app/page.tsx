'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

/** ---------------- 유틸/타입 ---------------- */

type OX = 'O' | 'X';
type Question = {
  id: string;
  q: string;
  answer: OX;
  explanation?: string;
};

type PartsIndex = Record<string, { title: string; createdAt: number }>;
type WrongMap = Record<string, number>;
type Mode = 'HOME' | 'PART' | 'EXAM' | 'WRONG';

/** 로컬스토리지 키 */
const LS = {
  PARTS: 'parts_index',
  PART_Q: (pk: string) => `questions_${pk}`,
  PART_ORDER: (pk: string) => `order_${pk}`,
  PART_CURSOR: (pk: string) => `cursor_${pk}`,
  PART_WRONG: (pk: string) => `wrong_${pk}`,
  EXAM_Q: 'exam_questions',
  EXAM_ORDER: 'exam_order',
  EXAM_CURSOR: 'exam_cursor',
  EXAM_WRONG: 'exam_wrong',
  EXAM_CORRECT: 'exam_correct_ids',
} as const;

/** JSON 저장/로드 */
const saveJSON = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v));
const loadJSON = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** 자연 정렬(숫자 인식) */
const collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });

/** 피셔–예이츠 */
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** 배열에서 n개 무작위 추출(인덱스 기반) */
const pickRandomIndices = (length: number, n: number) => {
  if (n >= length) return shuffle(Array.from({ length }, (_, i) => i));
  const idx = shuffle(Array.from({ length }, (_, i) => i));
  return idx.slice(0, n);
};

/** 엑셀 -> Question[] 파싱 */
function toQuestions(fileName: string, ws: XLSX.WorkSheet): Question[] {
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rows
    .map((r, i) => {
      const q = String(r['문제'] ?? '').trim();
      const ansCell = String(r['답'] ?? '').trim();
      const exp = String(r['해설'] ?? '').trim();
      const answer: OX = ansCell === 'O' || ansCell === 'o' ? 'O' : 'X';
      const id = `${fileName}__row_${i}`;
      return q ? { id, q, answer, explanation: exp } : null;
    })
    .filter(Boolean) as Question[];
}

/** 파일명으로 파트 키 생성 */
const toPartKey = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');

/** ---------------- 메인 컴포넌트 ---------------- */

export default function Home() {
  /** 전역 모드/UI */
  const [mode, setMode] = useState<Mode>('HOME');

  /** 파트 인덱스 */
  const [parts, setParts] = useState<PartsIndex>({});
  const sortedPartKeys = useMemo(
    () => Object.keys(parts).sort((a, b) => collator.compare(parts[a].title, parts[b].title)),
    [parts]
  );

  /** 현재 활성 파트/세션 공용 상태 */
  const [activePart, setActivePart] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const [wrongMap, setWrongMap] = useState<WrongMap>({});
  const [correctSet, setCorrectSet] = useState<Set<string>>(new Set()); // EXAM 전용
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  /** 진행률/정답률 */
  const [answered, setAnswered] = useState(0);
  const [correctCnt, setCorrectCnt] = useState(0);

  /** ‘틀린 문제만’ 토글 */
  const [onlyWrong, setOnlyWrong] = useState(false);

  /** 현재 문제 */
  const current = useMemo(
    () => (order.length ? questions[order[cursor]] : null),
    [questions, order, cursor]
  );

  /** 초기화 */
  useEffect(() => {
    const idx = loadJSON<PartsIndex>(LS.PARTS, {});
    setParts(idx);
  }, []);

  /** ---------- 파일 업로드 ---------- */

  const handleUploadPart = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const qs = toQuestions(file.name, sheet);
    if (!qs.length) { alert('엑셀에서 문제를 찾지 못했습니다.'); return; }

    const partKey = toPartKey(file.name);

    saveJSON(LS.PART_Q(partKey), qs);
    saveJSON(LS.PART_ORDER(partKey), []);
    saveJSON(LS.PART_CURSOR(partKey), 0);
    const wrong = loadJSON<WrongMap>(LS.PART_WRONG(partKey), {});
    saveJSON(LS.PART_WRONG(partKey), wrong);

    const next = { ...parts, [partKey]: { title: toDisplayTitle(file.name), createdAt: Date.now() } };
    setParts(next);
    saveJSON(LS.PARTS, next);

    alert(`업로드 완료: ${toDisplayTitle(file.name)} (문제 ${qs.length}개)`);
    e.target.value = '';
  };

  const handleUploadExam = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const qs = toQuestions(file.name, sheet);
    if (!qs.length) { alert('엑셀에서 문제를 찾지 못했습니다.'); return; }

    saveJSON(LS.EXAM_Q, qs);
    alert(`종합평가 문제 업데이트 완료 (총 ${qs.length}문제)`);
    e.target.value = '';
  };

  /** ---------- 세션 시작/재시작 유틸 ---------- */

  const buildOrderForPart = (qs: Question[], wm: WrongMap) => {
    if (onlyWrong) {
      const wrongIdx = qs
        .map((q, i) => ({ i, c: wm[q.id] ?? 0 }))
        .filter(x => x.c > 0)
        .sort((a, b) => b.c - a.c)
        .map(x => x.i);
      return wrongIdx.length ? wrongIdx : Array.from({ length: 0 }, () => 0); // 비어있으면 빈 세션
    }
    // 오답 우선 → 나머지 랜덤
    const wrongIdsDesc = Object.entries(wm)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => qs.findIndex((q) => q.id === id))
      .filter((i) => i >= 0);

    const remain = Array.from({ length: qs.length }, (_, i) => i).filter((i) => !wrongIdsDesc.includes(i));
    return [...wrongIdsDesc, ...shuffle(remain)];
  };

  const startPart = (partKey: string) => {
    const qs = loadJSON<Question[]>(LS.PART_Q(partKey), []);
    if (!qs.length) { alert('먼저 해당 파트 파일을 업로드해주세요.'); return; }

    const wm = loadJSON<WrongMap>(LS.PART_WRONG(partKey), {});
    let curOrder = buildOrderForPart(qs, wm);

    if (onlyWrong && curOrder.length === 0) {
      alert('해당 파트에 기록된 오답이 없습니다.');
      return;
    }

    setQuestions(qs);
    setOrder(curOrder);
    setCursor(0);
    setWrongMap(wm);
    setCorrectSet(new Set());
    setShowResult(false);
    setIsCorrect(null);
    setActivePart(partKey);
    setMode('PART');

    // 진행률 초기화
    setAnswered(0);
    setCorrectCnt(0);
  };

  const restartCurrentPart = () => {
    if (!activePart) return;
    startPart(activePart);
  };

  const enterExam = () => {
    const qs = loadJSON<Question[]>(LS.EXAM_Q, []);
    if (!qs.length) { alert('먼저 종합평가 전용 파일을 업로드해주세요.'); return; }

    const curWrong = loadJSON<WrongMap>(LS.EXAM_WRONG, {});
    const correctIds = new Set(loadJSON<string[]>(LS.EXAM_CORRECT, []));

    let indices: number[] = [];
    if (onlyWrong) {
      indices = qs
        .map((q, i) => ({ i, c: curWrong[q.id] ?? 0 }))
        .filter(x => x.c > 0)
        .sort((a, b) => b.c - a.c)
        .map(x => x.i);
      if (!indices.length) { alert('종합평가 오답 기록이 없습니다.'); return; }
    } else {
      const savedOrder = loadJSON<number[]>(LS.EXAM_ORDER, []);
      indices = savedOrder;
      if (indices.length === 0) {
        const candidates = qs.map((q, i) => ({ q, i })).filter(({ q }) => !correctIds.has(q.id));
        indices = candidates.length
          ? shuffle(candidates.map((c) => c.i)).slice(0, 100)
          : pickRandomIndices(qs.length, 100);
        saveJSON(LS.EXAM_ORDER, indices);
        saveJSON(LS.EXAM_CURSOR, 0);
      }
    }

    setQuestions(qs);
    setOrder(indices);
    setCursor(0);
    setWrongMap(curWrong);
    setCorrectSet(correctIds);
    setShowResult(false);
    setIsCorrect(null);
    setMode('EXAM');
    setActivePart(null);

    setAnswered(0);
    setCorrectCnt(0);
  };

  /** 진행 자동 저장 */
  useEffect(() => {
    if (mode === 'PART' && activePart) {
      saveJSON(LS.PART_ORDER(activePart), order);
      saveJSON(LS.PART_CURSOR(activePart), cursor);
      saveJSON(LS.PART_WRONG(activePart), wrongMap);
    }
    if (mode === 'EXAM') {
      saveJSON(LS.EXAM_ORDER, order);
      saveJSON(LS.EXAM_CURSOR, cursor);
      saveJSON(LS.EXAM_WRONG, wrongMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, order, cursor, wrongMap, activePart]);

  /** ---------- 정답 처리 ---------- */

  const handleAnswer = (user: OX) => {
    if (!current || showResult) return; // 한 문제 1회만 처리
    const correct = user === current.answer;
    setIsCorrect(correct);
    setShowResult(true);

    // 진행/정답률
    setAnswered((a) => a + 1);
    if (correct) setCorrectCnt((c) => c + 1);

    if (mode === 'PART') {
      const w = { ...wrongMap };
      if (!correct) w[current.id] = (w[current.id] ?? 0) + 1;
      setWrongMap(w);
    } else if (mode === 'EXAM') {
      const w = { ...wrongMap };
      if (!correct) {
        w[current.id] = (w[current.id] ?? 0) + 1;
      } else {
        const nextCorrect = new Set(correctSet);
        nextCorrect.add(current.id);
        setCorrectSet(nextCorrect);
        saveJSON(LS.EXAM_CORRECT, Array.from(nextCorrect));
      }
      setWrongMap(w);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setIsCorrect(null);
    if (cursor < order.length - 1) {
      setCursor((c) => c + 1);
    } else {
      alert('세션 완료!');
    }
  };

  /** ---------- 오답 목록 ---------- */

  const [wrongViewPart, setWrongViewPart] = useState<string | null>(null);

  const wrongParts = useMemo(() => {
    const entries = Object.keys(parts).map((pk) => ({
      key: pk,
      title: parts[pk].title,
      count: Object.values(loadJSON<WrongMap>(LS.PART_WRONG(pk), {})).reduce((a, b) => a + b, 0),
      type: 'PART' as const,
    }));
    const examCount = Object.values(loadJSON<WrongMap>(LS.EXAM_WRONG, {})).reduce((a, b) => a + b, 0);
    return [
      ...entries.sort((a, b) => collator.compare(a.title, b.title)),
      { key: '__EXAM__', title: '종합평가', count: examCount, type: 'EXAM' as const },
    ];
  }, [parts, mode, showResult]);

  const openWrong = () => { setMode('WRONG'); setWrongViewPart(null); };

  const wrongListOf = (key: string) => {
    if (key === '__EXAM__') {
      const qs = loadJSON<Question[]>(LS.EXAM_Q, []);
      const wm = loadJSON<WrongMap>(LS.EXAM_WRONG, {});
      return Object.entries(wm)
        .sort((a, b) => b[1] - a[1])
        .map(([id, c]) => ({ q: qs.find((x) => x.id === id), count: c }))
        .filter((x) => !!x.q) as { q: Question; count: number }[];
    }
    const qs = loadJSON<Question[]>(LS.PART_Q(key), []);
    const wm = loadJSON<WrongMap>(LS.PART_WRONG(key), {});
    return Object.entries(wm)
      .sort((a, b) => b[1] - a[1])
      .map(([id, c]) => ({ q: qs.find((x) => x.id === id), count: c }))
      .filter((x) => !!x.q) as { q: Question; count: number }[];
  };

  /** ---------- 파생 수치 ---------- */

  const total = order.length;
  const progress = total ? Math.min(100, Math.round(((cursor + (showResult ? 1 : 0)) / total) * 100)) : 0;
  const accuracy = answered ? Math.round((correctCnt / answered) * 100) : 0;

  /** ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-teal-50 text-slate-800">
      {/* 상단 컨테이너 */}
      <header className="w-full max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            헌법 게임 <span className="ml-1">🎮</span>
          </h1>

          <div className="flex items-center gap-3">
            {/* 틀린 문제만 토글 */}
            <label className="inline-flex items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-600"
                checked={onlyWrong}
                onChange={(e) => setOnlyWrong(e.target.checked)}
              />
              <span className="font-medium">틀린 문제만 풀기</span>
            </label>

            {mode !== 'HOME' && (
              <button
                className="hidden sm:inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-white text-sm font-semibold shadow hover:bg-emerald-700"
                onClick={restartCurrentPart}
                disabled={mode !== 'PART' || !activePart}
                title="현재 파트를 토글 조건으로 재시작"
              >
                현재 파트 재시작
              </button>
            )}

            <button
              className="inline-flex items-center rounded-lg bg-rose-500 px-3 py-1.5 text-white text-sm font-semibold shadow hover:bg-rose-600"
              onClick={openWrong}
            >
              틀린 문제 목록 보기
            </button>
          </div>
        </div>

        {/* 업로드/액션 */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm inline-flex items-center gap-2">
            <span className="font-semibold">새 파트 업로드</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadPart}
              className="rounded-md border px-3 py-1 text-sm bg-white"
            />
          </label>

          <label className="text-sm inline-flex items-center gap-2">
            <span className="font-semibold">종합평가 전용 업로드</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadExam}
              className="rounded-md border px-3 py-1 text-sm bg-white"
            />
          </label>

          <button
            className="rounded-md border px-3 py-1.5 text-sm bg-white shadow hover:bg-gray-50"
            onClick={enterExam}
          >
            종합평가 시작 (100문제)
          </button>
        </div>
      </header>

      {/* 중앙 카드 래퍼 */}
      <main className="w-full">
        <div className="max-w-4xl mx-auto px-4 pb-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {mode === 'HOME' && (
              <HomeView
                parts={parts}
                sortedPartKeys={sortedPartKeys}
                onStartPart={startPart}
              />
            )}

            {(mode === 'PART' || mode === 'EXAM') && current && (
              <>
                {/* 진행률/정답률 헤더 */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>진행률 {progress}%</span>
                    <span>정답률 {accuracy}% <span className="text-slate-400">({correctCnt}/{answered})</span></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <QuestionView
                  title={mode === 'PART' ? parts[activePart!]?.title ?? '' : '종합평가'}
                  index={cursor + 1}
                  total={order.length}
                  question={current}
                  showResult={showResult}
                  isCorrect={isCorrect}
                  onAnswer={handleAnswer}
                  onNext={nextQuestion}
                />
              </>
            )}

            {mode === 'WRONG' && (
              <WrongView
                wrongParts={wrongParts}
                wrongViewPart={wrongViewPart}
                setWrongViewPart={setWrongViewPart}
                wrongListOf={wrongListOf}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** ---------------- 보조 컴포넌트 ---------------- */

function HomeView({
  parts,
  sortedPartKeys,
  onStartPart,
}: {
  parts: PartsIndex;
  sortedPartKeys: string[];
  onStartPart: (k: string) => void;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">저장된 파트</h2>
      {sortedPartKeys.length === 0 ? (
        <p className="text-sm text-gray-600">아직 업로드된 파트가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedPartKeys.map((pk) => (
            <button
              key={pk}
              className="text-left p-4 rounded-xl border bg-white shadow hover:bg-gray-50"
              onClick={() => onStartPart(pk)}
            >
              <div className="font-medium">{parts[pk].title}</div>
              <div className="text-xs text-gray-500 mt-1">클릭하여 시작</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function QuestionView({
  title,
  index,
  total,
  question,
  showResult,
  isCorrect,
  onAnswer,
  onNext,
}: {
  title: string;
  index: number;
  total: number;
  question: Question;
  showResult: boolean;
  isCorrect: boolean | null;
  onAnswer: (ox: OX) => void;
  onNext: () => void;
}) {
  return (
    <section>
      <div className="text-center text-sm text-gray-500 mb-2">{title}</div>
      <h3 className="text-lg sm:text-xl font-bold text-center mb-5 leading-relaxed">
        문제 {index} / {total}
        <span className="mx-2">•</span>
        {question.q}
      </h3>

      <div className="flex justify-center gap-4 sm:gap-6">
        <button
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-lg font-semibold text-white bg-green-600 hover:bg-green-700 shadow disabled:opacity-50"
          onClick={() => onAnswer('O')}
          disabled={showResult}
        >
          O
        </button>
        <button
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-lg font-semibold text-white bg-red-600 hover:bg-red-700 shadow disabled:opacity-50"
          onClick={() => onAnswer('X')}
          disabled={showResult}
        >
          X
        </button>
      </div>

      {showResult && (
        <div
          className={`mt-6 p-4 rounded-xl shadow border ${
            isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <p className="font-bold mb-2">{isCorrect ? '정답입니다!' : '오답입니다!'}</p>

          {!!question.explanation && (
            <div className="mt-3 rounded-xl border text-amber-900 bg-amber-50 border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <span className="text-amber-500">💡</span>
                <div className="leading-relaxed">해설: {question.explanation}</div>
              </div>
            </div>
          )}

          <div className="mt-3 text-right">
            <button
              className="rounded-md border px-3 py-1.5 text-sm bg-white shadow hover:bg-gray-50"
              onClick={onNext}
            >
              다음 문제 ▶
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function WrongView({
  wrongParts,
  wrongViewPart,
  setWrongViewPart,
  wrongListOf,
}: {
  wrongParts: { key: string; title: string; count: number; type: 'PART' | 'EXAM' }[];
  wrongViewPart: string | null;
  setWrongViewPart: (k: string | null) => void;
  wrongListOf: (k: string) => { q: Question; count: number }[];
}) {
  if (!wrongViewPart) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">틀린 문제 (파트 선택)</h2>
        {wrongParts.every((p) => p.count === 0) ? (
          <p className="text-sm text-gray-600">기록된 오답이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wrongParts.map((p) => (
              <button
                key={p.key}
                className="text-left p-4 rounded-xl border bg-white shadow hover:bg-gray-50 disabled:opacity-50"
                disabled={p.count === 0}
                onClick={() => setWrongViewPart(p.key)}
              >
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-gray-500 mt-1">오답 {p.count}회</div>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  const list = wrongListOf(wrongViewPart);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">오답 목록</h2>
        <button
          className="rounded-md border px-3 py-1.5 text-sm bg-white shadow hover:bg-gray-50"
          onClick={() => setWrongViewPart(null)}
        >
          ◀ 파트 선택으로
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-gray-600">해당 파트의 오답 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {list.map(({ q, count }) => (
            <li key={q.id} className="p-3 rounded-xl border bg-white shadow">
              <div className="font-medium">{q.q}</div>
              <div className="text-sm mt-1">
                정답: <span className="font-semibold">{q.answer}</span>
                <span className="ml-3 text-rose-600">오답 {count}회</span>
              </div>
              {!!q.explanation && (
                <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 p-2 text-sm text-amber-900">
                  💡 해설: {q.explanation}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** ---------------- 기타 헬퍼 ---------------- */

function toDisplayTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}
