import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Download,
  FileText,
  KeyRound,
  Layers3,
  ListChecks,
  Loader2,
  Quote,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import demoLecture from "../demo/lecture_photosynthesis.txt?raw";
import {
  generateMaterials,
  LectureError,
  validateLecture,
  type Flashcard,
  type Materials,
  type QuizQuestion,
  type Thesis,
} from "./lib/generate";

type TabId = "summary" | "points" | "quiz" | "cards";

const tabs: Array<{ id: TabId; label: string; icon: typeof FileText }> = [
  { id: "summary", label: "Конспект", icon: FileText },
  { id: "points", label: "Тезисы", icon: ListChecks },
  { id: "quiz", label: "Тест", icon: ShieldCheck },
  { id: "cards", label: "Карточки", icon: Layers3 },
];

const KEY_STORAGE = "lectureai.groq-key";

function readStoredKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || import.meta.env.VITE_GROQ_API_KEY || "";
  } catch {
    return import.meta.env.VITE_GROQ_API_KEY || "";
  }
}

export default function LectureAI() {
  const [lecture, setLecture] = useState("");
  const [apiKey, setApiKey] = useState(readStoredKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [results, setResults] = useState<Materials | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const resultsRef = useRef<HTMLElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    try {
      if (apiKey) localStorage.setItem(KEY_STORAGE, apiKey);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* storage unavailable — key simply isn't remembered */
    }
  }, [apiKey]);

  const generate = async () => {
    if (isLoading) return;
    // Validate synchronously: invalid text never triggers a request or the loading state.
    try {
      validateLecture(lecture);
    } catch (err) {
      if (err instanceof LectureError) setError({ title: err.title, message: err.message });
      return;
    }
    const id = ++requestId.current;
    setError(null);
    setIsLoading(true);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const materials = await generateMaterials(lecture, apiKey);
      if (id !== requestId.current) return;
      setResults(materials);
      setActiveTab("summary");
      setQuizIndex(0);
      setAnswers({});
      setCardIndex(0);
      setIsFlipped(false);
    } catch (err) {
      if (id !== requestId.current) return;
      const e =
        err instanceof LectureError
          ? err
          : new LectureError("Что-то пошло не так", "Не удалось обработать лекцию. Попробуйте ещё раз.");
      setError({ title: e.title, message: e.message });
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  };

  const changeCard = (direction: number) => {
    if (!results) return;
    const total = results.flashcards.length;
    setCardIndex((current) => (current + direction + total) % total);
    setIsFlipped(false);
  };

  const showResults = isLoading || results !== null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <BookOpen aria-hidden="true" size={20} strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">LectureAI</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Умная подготовка к занятиям
              </p>
            </div>
          </div>

          <label className="group flex w-40 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-subtle transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 sm:w-56">
            <KeyRound
              aria-hidden="true"
              className={`shrink-0 transition group-focus-within:text-primary ${apiKey ? "text-success" : "text-muted-foreground"}`}
              size={16}
            />
            <span className="sr-only">API-ключ Groq</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                if (error) setError(null);
              }}
              placeholder="API-ключ Groq"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <section aria-labelledby="workspace-heading">
          <div className="mb-7 max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles aria-hidden="true" size={16} /> ИИ-помощник для учёбы
            </p>
            <h1
              id="workspace-heading"
              className="font-display text-4xl font-semibold leading-tight sm:text-5xl"
            >
              Превратите лекцию в понятные материалы
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Вставьте текст — LectureAI подготовит конспект, ключевые мысли и
              задания для повторения.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3 shadow-card sm:p-4">
            <textarea
              value={lecture}
              onChange={(event) => {
                setLecture(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) void generate();
              }}
              aria-label="Текст лекции"
              placeholder="Вставьте сюда полный текст лекции…"
              disabled={isLoading}
              className="min-h-56 w-full resize-y rounded-xl border border-transparent bg-muted/55 p-5 text-[15px] leading-7 outline-none transition placeholder:text-muted-foreground focus:border-primary/30 focus:bg-card focus:ring-2 focus:ring-primary/15 disabled:opacity-60 sm:min-h-64"
            />
            <div className="flex flex-col items-start justify-between gap-4 px-1 pb-1 pt-4 sm:flex-row sm:items-center">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {lecture.length.toLocaleString("ru-RU")} символов
                {lecture.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setLecture(demoLecture.trim())}
                    className="font-medium text-primary transition hover:underline focus:outline-none focus:underline"
                  >
                    Вставить пример лекции
                  </button>
                ) : (
                  !isLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        setLecture("");
                        setError(null);
                      }}
                      className="font-medium transition hover:text-foreground focus:outline-none focus:underline"
                    >
                      Очистить
                    </button>
                  )
                )}
              </span>
              <button
                type="button"
                onClick={() => void generate()}
                disabled={isLoading}
                aria-busy={isLoading}
                className="gradient-action inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-action transition hover:-translate-y-0.5 hover:shadow-action-hover focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0 sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 aria-hidden="true" size={18} className="animate-spin" />
                ) : results ? (
                  <RefreshCw aria-hidden="true" size={18} />
                ) : (
                  <Sparkles aria-hidden="true" size={18} />
                )}
                {isLoading
                  ? "Генерируем материалы…"
                  : results
                    ? "Сгенерировать заново"
                    : "Сгенерировать материалы"}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive-soft p-4 text-destructive shadow-subtle animate-fade-in"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
              <div>
                <p className="text-sm font-semibold">{error.title}</p>
                <p className="mt-0.5 text-sm text-destructive/85">{error.message}</p>
              </div>
            </div>
          )}
        </section>

        {showResults && (
          <section ref={resultsRef} aria-labelledby="results-heading" className="mt-16 scroll-mt-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">
                  {isLoading ? "ИИ анализирует лекцию" : "Готово к изучению"}
                </p>
                <h2
                  id="results-heading"
                  className="mt-1 font-display text-2xl font-semibold sm:text-3xl"
                >
                  Ваши материалы
                </h2>
              </div>
              {results && !isLoading && (
                <div className="flex items-center gap-4">
                  <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <span className="size-2 rounded-full bg-success" /> Сгенерировано в{" "}
                    {results.generatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadMarkdown(results)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
                  >
                    <Download aria-hidden="true" size={15} /> Скачать .md
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div
                role="tablist"
                aria-label="Материалы лекции"
                className="grid grid-cols-4 border-b border-border bg-muted/40 p-1.5"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  const count = results ? tabCount(results, tab.id) : null;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={isLoading}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium transition disabled:cursor-wait sm:text-sm ${active ? "bg-card text-foreground shadow-tab" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Icon aria-hidden="true" size={16} />
                      <span className="hidden min-[430px]:inline">{tab.label}</span>
                      {count !== null && !isLoading && (
                        <span className="hidden text-[11px] text-muted-foreground md:inline">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel" className="min-h-[410px] p-6 sm:p-10">
                {isLoading && <LoadingPanel />}
                {!isLoading && results && (
                  <>
                    {activeTab === "summary" && (
                      <SummaryPanel results={results} onStartQuiz={() => setActiveTab("quiz")} />
                    )}
                    {activeTab === "points" && <PointsPanel theses={results.theses} />}
                    {activeTab === "quiz" && (
                      <QuizPanel
                        questions={results.quiz}
                        index={quizIndex}
                        answers={answers}
                        onSelect={(option) =>
                          setAnswers((current) =>
                            quizIndex in current ? current : { ...current, [quizIndex]: option }
                          )
                        }
                        onNavigate={(next) => setQuizIndex(next)}
                        onRestart={() => {
                          setAnswers({});
                          setQuizIndex(0);
                        }}
                        onOpenCards={() => {
                          setActiveTab("cards");
                          setCardIndex(0);
                          setIsFlipped(false);
                        }}
                      />
                    )}
                    {activeTab === "cards" && (
                      <FlashcardsPanel
                        cards={results.flashcards}
                        index={cardIndex}
                        isFlipped={isFlipped}
                        onFlip={() => setIsFlipped((current) => !current)}
                        onChange={changeCard}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function tabCount(results: Materials, id: TabId): number | null {
  if (id === "points") return results.theses.length;
  if (id === "quiz") return results.quiz.length;
  if (id === "cards") return results.flashcards.length;
  return null;
}

function LoadingPanel() {
  const steps = ["Читаем текст лекции", "Выделяем главные мысли", "Составляем тест и карточки", "Сверяем цитаты с лекцией"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2600);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in" aria-live="polite">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Loader2 aria-hidden="true" size={14} className="animate-spin" /> {steps[step]}…
      </p>
      <div className="space-y-4">
        <div className="h-7 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2.5 pt-3">
          {[100, 96, 88, 100, 92, 70].map((w, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted/80" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <ol className="mt-9 grid gap-2 sm:grid-cols-4">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs transition ${i < step ? "border-success/30 bg-success-soft text-success-foreground" : i === step ? "border-primary/30 bg-primary-soft text-foreground" : "border-border text-muted-foreground"}`}
          >
            {i < step ? (
              <Check aria-hidden="true" size={14} strokeWidth={2.5} />
            ) : (
              <span className="grid size-3.5 place-items-center text-[10px] font-semibold">{i + 1}</span>
            )}
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function SourceQuote({ quote, verified }: { quote: string; verified: boolean }) {
  if (!quote) return null;
  if (!verified) {
    return (
      <span className="mt-1.5 block text-xs text-muted-foreground/80">
        Обобщение по лекции — дословный фрагмент не найден
      </span>
    );
  }
  return (
    <span className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
      <Quote aria-hidden="true" size={12} className="mt-1 shrink-0 text-primary/70" />
      <span>
        <span className="font-medium text-primary/90">Из лекции:</span> «{quote}»
      </span>
    </span>
  );
}

function SummaryPanel({ results, onStartQuiz }: { results: Materials; onStartQuiz: () => void }) {
  const verified = [...results.theses, ...results.quiz, ...results.flashcards].filter((i) => i.verified).length;
  const total = results.theses.length + results.quiz.length + results.flashcards.length;
  return (
    <article className="mx-auto max-w-3xl animate-fade-in">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
        Краткий конспект
      </p>
      <h3 className="font-display text-2xl font-semibold">{results.title}</h3>
      <div className="mt-6 space-y-5 text-[15px] leading-7 text-muted-foreground sm:text-base">
        {results.summary.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" size={15} className="text-success" />
          {verified} из {total} материалов подтверждены цитатой из лекции
        </span>
        <button
          type="button"
          onClick={onStartQuiz}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          Проверить знания <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </article>
  );
}

function PointsPanel({ theses }: { theses: Thesis[] }) {
  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
        Главные идеи
      </p>
      <h3 className="font-display text-2xl font-semibold">
        {theses.length} {plural(theses.length, "тезис", "тезиса", "тезисов")} лекции
      </h3>
      <ul className="mt-7 space-y-3">
        {theses.map((point, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/35 p-4 text-sm leading-6 sm:text-[15px]"
          >
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success-soft text-success">
              <Check aria-hidden="true" size={14} strokeWidth={2.5} />
            </span>
            <span className="flex-1">
              {point.text}
              <SourceQuote quote={point.quote} verified={point.verified} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuizPanel({
  questions,
  index,
  answers,
  onSelect,
  onNavigate,
  onRestart,
  onOpenCards,
}: {
  questions: QuizQuestion[];
  index: number;
  answers: Record<number, number>;
  onSelect: (value: number) => void;
  onNavigate: (index: number) => void;
  onRestart: () => void;
  onOpenCards: () => void;
}) {
  const question = questions[index];
  if (!question) return null;
  const selected = answers[index];
  const answered = selected !== undefined;
  const score = Object.entries(answers).filter(([q, a]) => questions[Number(q)]?.correctIndex === a).length;
  const answeredCount = Object.keys(answers).length;
  const finished = answeredCount === questions.length;
  const isLast = index === questions.length - 1;

  return (
    <div key={index} className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Вопрос {index + 1} из {questions.length}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          Верно: {score} из {answeredCount}
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold leading-8 sm:text-2xl">
        {question.question}
      </h3>
      <div className="mt-7 space-y-3">
        {question.options.map((answer, optionIndex) => {
          const correct = answered && optionIndex === question.correctIndex;
          const wrong = answered && optionIndex === selected && !correct;
          return (
            <button
              key={optionIndex}
              type="button"
              onClick={() => onSelect(optionIndex)}
              disabled={answered}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition sm:text-[15px] ${correct ? "border-success/35 bg-success-soft text-success-foreground" : wrong ? "border-destructive/30 bg-destructive-soft text-destructive" : answered ? "border-border bg-card opacity-70" : "border-border bg-card hover:border-primary/25 hover:bg-muted/40"}`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full border ${correct ? "border-success bg-success text-success-contrast" : wrong ? "border-destructive bg-destructive text-destructive-foreground" : "border-border"}`}
              >
                {correct && <Check aria-hidden="true" size={14} strokeWidth={3} />}
                {wrong && <X aria-hidden="true" size={14} strokeWidth={3} />}
              </span>
              <span className="flex-1">{answer}</span>
              {correct && <span className="text-xs font-semibold">Верно</span>}
              {wrong && <span className="text-xs font-semibold">Неверно</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-5 rounded-xl border border-border/70 bg-muted/35 p-4 text-sm leading-6 animate-fade-in">
          {question.explanation && <p>{question.explanation}</p>}
          <SourceQuote quote={question.quote} verified={question.verified} />
        </div>
      )}

      {finished && isLast && (
        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary-soft p-4 animate-fade-in sm:flex-row sm:items-center">
          <p className="text-sm font-medium">
            Результат: {score} из {questions.length}.{" "}
            {score === questions.length ? "Отлично!" : "Повторите сложные темы по карточкам."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium transition hover:bg-muted"
            >
              <RefreshCw aria-hidden="true" size={14} /> Пройти снова
            </button>
            <button
              type="button"
              onClick={onOpenCards}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Layers3 aria-hidden="true" size={14} /> К карточкам
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:hover:bg-card"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Назад
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {questions.map((q, itemIndex) => {
            const a = answers[itemIndex];
            const tone =
              itemIndex === index
                ? "w-5 bg-primary"
                : a === undefined
                  ? "w-1.5 bg-border"
                  : a === q.correctIndex
                    ? "w-1.5 bg-success"
                    : "w-1.5 bg-destructive";
            return <span key={itemIndex} className={`h-1.5 rounded-full transition-all ${tone}`} />;
          })}
        </div>
        <button
          type="button"
          onClick={() => onNavigate(index + 1)}
          disabled={isLast}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:hover:bg-card"
        >
          Вперёд <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}

function FlashcardsPanel({
  cards,
  index,
  isFlipped,
  onFlip,
  onChange,
}: {
  cards: Flashcard[];
  index: number;
  isFlipped: boolean;
  onFlip: () => void;
  onChange: (direction: number) => void;
}) {
  const card = cards[index];
  if (!card) return null;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Карточка {index + 1} из {cards.length}
        </p>
        <p className="text-xs text-muted-foreground">Нажмите, чтобы перевернуть</p>
      </div>
      <button
        type="button"
        onClick={onFlip}
        className="flashcard-perspective block h-64 w-full focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-4 sm:h-72"
        aria-label={isFlipped ? "Показать вопрос" : "Показать ответ"}
      >
        <span
          className={`flashcard-inner relative block size-full ${isFlipped ? "is-flipped" : ""}`}
        >
          <span className="flashcard-face absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-2xl border border-border bg-muted/45 p-8 text-center shadow-subtle">
            <span className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Вопрос
            </span>
            <span className="font-display text-2xl font-semibold leading-9 sm:text-3xl">
              {card.front}
            </span>
          </span>
          <span className="flashcard-face flashcard-back absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-2xl border border-primary/20 bg-primary-soft p-8 text-center shadow-subtle">
            <span className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">
              Ответ
            </span>
            <span className="text-lg font-medium leading-8 sm:text-xl">{card.back}</span>
            {card.verified && (
              <span className="mt-4 max-w-lg text-xs leading-5 text-muted-foreground">
                Из лекции: «{card.quote}»
              </span>
            )}
          </span>
        </span>
      </button>
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onChange(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Назад
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {cards.map((_, itemIndex) => (
            <span
              key={itemIndex}
              className={`h-1.5 rounded-full transition-all ${itemIndex === index ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange(1)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          Вперёд <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function downloadMarkdown(results: Materials) {
  const letters = ["А", "Б", "В", "Г", "Д", "Е"];
  const lines = [
    `# ${results.title}`,
    "",
    "## Конспект",
    "",
    ...results.summary.flatMap((p) => [p, ""]),
    "## Тезисы",
    "",
    ...results.theses.map((t) => `- ${t.text}`),
    "",
    "## Тест",
    "",
    ...results.quiz.flatMap((q, i) => [
      `**${i + 1}. ${q.question}**`,
      "",
      ...q.options.map((o, j) => `- ${letters[j] ?? j + 1}) ${o}`),
      "",
      `Ответ: ${letters[q.correctIndex] ?? q.correctIndex + 1}) ${q.options[q.correctIndex]}`,
      "",
    ]),
    "## Карточки",
    "",
    ...results.flashcards.flatMap((c) => [`**${c.front}**`, `${c.back}`, ""]),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lectureai-materials.md";
  link.click();
  URL.revokeObjectURL(url);
}
