"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useParty } from "@/lib/useParty";
import { t, resolveAvatarColor, resolveEmoji } from "@/lib/theme";
import type { Player, Prompt } from "@/lib/types";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PlayerAvatar({ player, disconnected }: { player: Player; disconnected: boolean }) {
  const color = resolveAvatarColor(player.nickname, player.emoji);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className={`${color} w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg`}>
          {resolveEmoji(player.nickname, player.emoji)}
        </div>
        <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#0a1628] ${disconnected ? "bg-gray-500" : "bg-green-400"}`} />
      </div>
      <span className="text-[#7a96c8] text-base font-medium truncate max-w-[72px]">{player.nickname}</span>
      {player.isHost && <span className={`${t.textYellow} text-sm font-bold -mt-1`}>HOST</span>}
    </div>
  );
}

const HOST_SESSION_KEY = "consensus_host_session";

const QUESTION_OPTIONS = [5, 10, 15, 20, 25];
const TIME_OPTIONS = [15, 20, 30, 45, 60];

function SettingRow({ label, value, options, onChange }: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white text-sm font-medium whitespace-nowrap w-24 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              value === opt
                ? "bg-[#7862FF] text-white"
                : `${t.btnGhost} ${t.textMuted}`
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- CSV parsing ----

type ParsedRow = { ok: true; prompt: Prompt } | { ok: false; line: number; error: string };

function parseCSV(raw: string): ParsedRow[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const lineNum = idx + 1;
    // Split on comma but not within quoted fields
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const type = cols[0]?.toLowerCase();

    if (type === "binary") {
      const text = cols[1];
      if (!text || text.length === 0) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: missing question text` };
      if (text.length > 60) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: question too long (max 60 chars)` };
      return { ok: true as const, prompt: { id: `hq_${Date.now()}_${lineNum}`, text, type: "binary" } };
    }

    if (type === "scale") {
      const text = cols[1];
      if (!text || text.length === 0) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: missing question text` };
      if (text.length > 60) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: question too long (max 60 chars)` };
      const labelLow = cols[6]?.trim() || undefined;
      const labelHigh = cols[7]?.trim() || undefined;
      return { ok: true as const, prompt: { id: `hq_${Date.now()}_${lineNum}`, text, type: "scale", ...(labelLow ? { labelLow } : {}), ...(labelHigh ? { labelHigh } : {}) } };
    }

    if (type === "mc" || type === "multiple_choice") {
      const text = cols[1];
      if (!text || text.length === 0) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: missing question text` };
      if (text.length > 60) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: question too long (max 60 chars)` };
      const options = [cols[2], cols[3], cols[4], cols[5]].filter((o) => o && o.trim().length > 0);
      if (options.length < 2) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: multiple choice needs at least 2 options (cols 3–6)` };
      const dupes = options.filter((o, i) => options.indexOf(o) !== i);
      if (dupes.length > 0) return { ok: false as const, line: lineNum, error: `Row ${lineNum}: duplicate options "${dupes[0]}"` };
      return { ok: true as const, prompt: { id: `hq_${Date.now()}_${lineNum}`, text, type: "multiple_choice", options } };
    }

    return { ok: false as const, line: lineNum, error: `Row ${lineNum}: unknown type "${cols[0]}" — use binary, scale, or mc` };
  });
}

// ---- Form for a single question ----

function SingleQuestionForm({ onAdd }: { onAdd: (p: Prompt) => void }) {
  const [qType, setQType] = useState<"binary" | "multiple_choice" | "scale">("binary");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [labelLow, setLabelLow] = useState("");
  const [labelHigh, setLabelHigh] = useState("");

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 60) return;
    if (qType === "multiple_choice" && (options.length < 2 || options.some((o) => !o.trim()))) return;

    const id = `hq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prompt: Prompt = { id, text: trimmed, type: qType };
    if (qType === "multiple_choice") prompt.options = options.map((o) => o.trim());
    if (qType === "scale") {
      if (labelLow.trim()) prompt.labelLow = labelLow.trim();
      if (labelHigh.trim()) prompt.labelHigh = labelHigh.trim();
    }
    onAdd(prompt);
    setText("");
    setOptions(["", ""]);
    setLabelLow("");
    setLabelHigh("");
  }

  const trimmedOptions = options.map((o) => o.trim());
  const hasDupe = qType === "multiple_choice" && trimmedOptions.some((o, i) => o.length > 0 && trimmedOptions.indexOf(o) !== i);
  const isValid = text.trim().length > 0 && text.trim().length <= 60 &&
    (qType !== "multiple_choice" || (options.length >= 2 && options.every((o) => o.trim().length > 0) && !hasDupe));

  const inputCls = `w-full px-3 py-2 rounded-lg bg-[#0f2660] border border-[#2a4a8a] text-white text-sm placeholder:italic placeholder:text-[#4a6a9a] outline-none focus:border-[#7862FF]`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {(["binary", "scale", "multiple_choice"] as const).map((type) => (
          <button key={type} onClick={() => setQType(type)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${qType === type ? "bg-[#7862FF] text-white" : `${t.btnGhost} ${t.textMuted}`}`}>
            {type === "binary" ? "Yes/No" : type === "scale" ? "Scale" : "Multi"}
          </button>
        ))}
      </div>

      <input type="text" value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && isValid && handleAdd()}
        placeholder={qType === "binary" ? "e.g. Can you swim?" : qType === "scale" ? "e.g. How much do you like EDM?" : "e.g. Best pizza topping?"}
        maxLength={60}
        className={inputCls + (text.trim().length > 60 ? " border-[#c94f7a]" : "")}
      />
      {text.trim().length > 60 && <p className="text-[#c94f7a] text-xs">Max 60 characters</p>}

      {qType === "scale" && (
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={labelLow} onChange={(e) => setLabelLow(e.target.value)}
            placeholder="Label for 1 (optional)" maxLength={10} className={inputCls} />
          <input type="text" value={labelHigh} onChange={(e) => setLabelHigh(e.target.value)}
            placeholder="Label for 10 (optional)" maxLength={10} className={inputCls} />
        </div>
      )}

      {qType === "multiple_choice" && (
        <div className="flex flex-col gap-1.5">
          {options.map((opt, i) => {
            const isDupe = opt.trim().length > 0 && trimmedOptions.indexOf(opt.trim()) !== i;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`${t.textMuted} text-sm font-bold w-4 shrink-0`}>{String.fromCharCode(65 + i)}</span>
                <input type="text" value={opt}
                  onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                  placeholder={["e.g. Pepperoni", "Mushrooms", "Pineapple", "Plain"][i]}
                  maxLength={25}
                  className={`flex-1 px-3 py-2 rounded-lg bg-[#0f2660] border text-white text-sm placeholder:italic placeholder:text-[#4a6a9a] outline-none focus:border-[#7862FF] ${isDupe ? "border-[#c94f7a]" : "border-[#2a4a8a]"}`}
                />
              </div>
            );
          })}
          {hasDupe && <p className="text-[#c94f7a] text-xs">Duplicate options</p>}
          <div className="flex justify-between mt-0.5">
            {options.length < 4
              ? <button onClick={() => setOptions([...options, ""])} className={`${t.textMuted} hover:text-white text-xs font-bold`}>+ Add option {String.fromCharCode(65 + options.length)}</button>
              : <span />}
            {options.length > 2 && (
              <button onClick={() => setOptions(options.slice(0, -1))} className={`${t.textMuted} hover:text-[#c94f7a] text-xs font-bold`}>− Remove {String.fromCharCode(64 + options.length)}</button>
            )}
          </div>
        </div>
      )}

      <button onClick={handleAdd} disabled={!isValid}
        className={`w-full py-2 rounded-lg ${t.btnPrimary} text-sm font-bold disabled:opacity-40`}>
        Add Question
      </button>
    </div>
  );
}

// ---- CSV paste panel ----

function CSVPanel({ slots, onAdd }: { slots: number; onAdd: (prompts: Prompt[]) => void }) {
  const [raw, setRaw] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<Prompt[]>([]);
  const [overflowCount, setOverflowCount] = useState(0);

  const TEMPLATE = `binary,Can you swim?
scale,How spicy do you like food?,,,,,Mild,Nuclear
mc,Best pizza topping?,Pepperoni,Mushrooms,Pineapple,Plain`;

  function handleParse() {
    if (!raw.trim()) return;
    const results = parseCSV(raw);
    const errs = results.filter((r): r is Extract<ParsedRow, { ok: false }> => !r.ok).map((r) => r.error);
    const ok = results.filter((r): r is Extract<ParsedRow, { ok: true }> => r.ok).map((r) => r.prompt);
    setErrors(errs);
    setPreview(ok);
    setOverflowCount(0);
  }

  function handleImport() {
    if (preview.length === 0) return;
    const toImport = preview.slice(0, slots);
    const dropped = preview.length - toImport.length;
    onAdd(toImport);
    setOverflowCount(dropped);
    setRaw("");
    setPreview([]);
    setErrors([]);
  }

  const importDisabled = preview.length === 0;
  const importLabel = preview.length > 0
    ? `Import (${Math.min(preview.length, slots)} of ${preview.length})`
    : "Import";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className={`${t.textMuted} text-xs mb-1`}>Format: <code className="text-[#4dd9d2]">type, text, opt1, opt2, opt3, opt4, labelLow, labelHigh</code></p>
        <p className={`${t.textFaint} text-xs`}>Types: <code>binary</code> · <code>scale</code> · <code>mc</code></p>
      </div>
      <button onClick={() => setRaw(TEMPLATE)}
        className={`self-start text-xs ${t.textMuted} hover:text-white underline underline-offset-2`}>
        Load example
      </button>
      <textarea
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setPreview([]); setErrors([]); setOverflowCount(0); }}
        placeholder={"binary,Can you swim?\nscale,How spicy do you like food?,,,,,Mild,Nuclear\nmc,Best pizza topping?,Pepperoni,Mushrooms,Pineapple,Plain"}
        rows={6}
        className={`w-full px-3 py-2 rounded-lg bg-[#0f2660] border border-[#2a4a8a] text-white text-sm font-mono placeholder:text-[#4a6a9a] outline-none focus:border-[#7862FF] resize-none`}
      />
      {errors.length > 0 && (
        <div className="bg-[#9a3558]/20 border border-[#9a3558]/40 rounded-lg p-3 flex flex-col gap-1">
          {errors.map((e, i) => <p key={i} className="text-[#c94f7a] text-xs">{e}</p>)}
        </div>
      )}
      {preview.length > 0 && (
        <div className="bg-[#1a3580]/40 border border-[#2a4a8a] rounded-lg p-3">
          <p className={`${t.textMuted} text-xs mb-2`}>{preview.length} question{preview.length !== 1 ? "s" : ""} parsed</p>
          {preview.map((p, i) => (
            <p key={i} className={`text-xs truncate ${i >= slots ? "text-[#4a6a9a] line-through" : "text-white"}`}>
              <span className={`${t.textMuted} mr-1`}>{i + 1}.</span>{p.text}
              <span className={`${t.textFaint} ml-1`}>({p.type})</span>
            </p>
          ))}
          {preview.length > slots && (
            <p className={`${t.textYellow} text-xs mt-2`}>
              {preview.length - slots} question{preview.length - slots !== 1 ? "s" : ""} will be discarded — only {slots} slot{slots !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      )}
      {overflowCount > 0 && (
        <p className={`${t.textYellow} text-xs`}>
          {overflowCount} question{overflowCount !== 1 ? "s" : ""} discarded — queue was full
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={handleParse} disabled={!raw.trim()}
          className={`flex-1 py-2 rounded-lg ${t.btnGhost} text-sm font-bold disabled:opacity-40`}>
          Validate
        </button>
        <div className="flex-1 flex flex-col gap-1">
          <button onClick={handleImport} disabled={importDisabled}
            className={`w-full py-2 rounded-lg ${t.btnPrimary} text-sm font-bold disabled:opacity-40`}>
            {importLabel}
          </button>
          {importDisabled && raw.trim() && preview.length === 0 && (
            <p className={`${t.textYellow} text-xs text-center`}>Validate first</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Host question panel (wraps form + CSV + queue) ----

function HostQuestionPanel({ needed, questions, onAdd, onDelete }: {
  needed: number;
  questions: Prompt[];
  onAdd: (prompts: Prompt[]) => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<"form" | "csv">("form");

  const typeLabel: Record<string, string> = { binary: "Y/N", scale: "Scale", multiple_choice: "MC" };

  return (
    <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} shadow-xl p-6 mb-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${t.textMuted} text-sm uppercase tracking-widest`}>Your Questions</h3>
        <span className={`text-sm font-bold font-mono ${questions.length >= needed ? "text-green-400" : t.textYellow}`}>
          {questions.length} / {needed}
        </span>
      </div>

      {/* Queue */}
      {questions.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-4">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start gap-2 bg-[#0f2660] rounded-lg px-3 py-2">
              <span className={`${t.textFaint} text-xs font-mono w-5 shrink-0 mt-0.5`}>{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{q.text}</p>
                {q.type === "multiple_choice" && q.options && (
                  <p className={`${t.textFaint} text-xs truncate`}>{q.options.join(" · ")}</p>
                )}
                {q.type === "scale" && (q.labelLow || q.labelHigh) && (
                  <p className={`${t.textFaint} text-xs`}>{q.labelLow || "1"} → {q.labelHigh || "10"}</p>
                )}
              </div>
              <span className={`${t.textFaint} text-xs font-bold shrink-0 mt-0.5`}>{typeLabel[q.type]}</span>
              <button onClick={() => onDelete(q.id)} className={`${t.textMuted} hover:text-[#c94f7a] text-base leading-none shrink-0`}>×</button>
            </div>
          ))}
        </div>
      )}

      {questions.length < needed && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab("form")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "form" ? "bg-[#7862FF] text-white" : `${t.btnGhost} ${t.textMuted}`}`}>
              Form
            </button>
            <button onClick={() => setTab("csv")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "csv" ? "bg-[#7862FF] text-white" : `${t.btnGhost} ${t.textMuted}`}`}>
              CSV Paste
            </button>
          </div>

          {tab === "form"
            ? <SingleQuestionForm onAdd={(p) => onAdd([p])} />
            : <CSVPanel slots={needed - questions.length} onAdd={onAdd} />
          }
        </>
      )}

      {questions.length >= needed && (
        <p className="text-green-400 text-sm font-semibold text-center">All {needed} questions ready!</p>
      )}
    </div>
  );
}

function HostContent({ roomCode }: { roomCode: string }) {
  const router = useRouter();

  // Game settings — restore from last game if available
  const [numQuestions, setNumQuestions] = useState(() => parseInt(typeof window !== "undefined" ? sessionStorage.getItem(`${roomCode}_numQ`) ?? "" : "") || 10);
  const [phase1Time, setPhase1Time] = useState(() => parseInt(typeof window !== "undefined" ? sessionStorage.getItem(`${roomCode}_p1t`) ?? "" : "") || 20);
  const [phase2Time, setPhase2Time] = useState(() => parseInt(typeof window !== "undefined" ? sessionStorage.getItem(`${roomCode}_p2t`) ?? "" : "") || 30);
  const [gameMode, setGameMode] = useState<"game_questions" | "player_questions" | "host_questions">(() => (typeof window !== "undefined" ? sessionStorage.getItem(`${roomCode}_mode`) : null) as "game_questions" | "player_questions" | "host_questions" ?? "game_questions");
  const [hostPrompts, setHostPrompts] = useState<Prompt[]>([]);
  const [randomizeHostOrder, setRandomizeHostOrder] = useState(false);

  const [isDuplicateTab, setIsDuplicateTab] = useState(false);

  // Menu state
  type MenuState = "closed" | "main" | "kick" | "disband_confirm";
  const [menuState, setMenuState] = useState<MenuState>("closed");

  const hostName = typeof window !== "undefined"
    ? (localStorage.getItem("consensus_host_name") ?? "Host")
    : "Host";
  const hostToken = typeof window !== "undefined"
    ? (localStorage.getItem("consensus_host_token") ?? "")
    : "";

  const { sendMsg, lobbyState, gameState } = useParty(
    roomCode,
    () => {
      console.log("[host] onOpen fired for room", roomCode);
      try {
        const saved = localStorage.getItem(HOST_SESSION_KEY);
        if (saved) {
          const session = JSON.parse(saved) as { roomCode: string };
          if (session.roomCode === roomCode) {
            sendMsg({ type: "rejoin", nickname: hostName, hostToken });
            return;
          }
        }
      } catch { /* ignore */ }
      localStorage.setItem(HOST_SESSION_KEY, JSON.stringify({ roomCode }));
      sendMsg({ type: "join", nickname: hostName, isHost: true, hostToken });
    },
    (msg) => {
      if (msg.type === "duplicate_tab") {
        setIsDuplicateTab(true);
        return;
      }
      if (msg.type === "unauthorized") {
        router.replace("/register");
        return;
      }
      if (msg.type === "room_not_found") {
        if (!hostToken) {
          router.replace("/register");
          return;
        }
        // Server restarted and lost state — re-join as host
        localStorage.setItem(HOST_SESSION_KEY, JSON.stringify({ roomCode }));
        sendMsg({ type: "join", nickname: hostName, isHost: true, hostToken });
      }
    },
  );

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) { e.preventDefault(); }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (gameState && gameState.phase !== "lobby") {
      router.push(`/host/${roomCode}/game`);
    }
  }, [gameState, roomCode, router]);

  if (isDuplicateTab) {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border border-[#9a3558]/40 shadow-xl p-8 text-center`}>
          <p className="text-5xl mb-4">🪟</p>
          <h2 className="text-2xl font-black text-[#c94f7a] mb-2">Already Open</h2>
          <p className={`${t.textMuted} mb-4`}>This room is already open in another tab.</p>
          <p className={`${t.textFaint} text-sm`}>Close this tab and continue in the other one.</p>
        </div>
      </main>
    );
  }

  function handleLock() {
    if (gameMode === "host_questions" && hostPrompts.length < numQuestions) return;
    sessionStorage.setItem(`${roomCode}_numQ`, String(numQuestions));
    sessionStorage.setItem(`${roomCode}_p1t`, String(phase1Time));
    sessionStorage.setItem(`${roomCode}_p2t`, String(phase2Time));
    sessionStorage.setItem(`${roomCode}_mode`, gameMode);
    sessionStorage.setItem(`${roomCode}_started`, "1");
    sendMsg({ type: "lock" });
    sendMsg({
      type: "start_game",
      numQuestions,
      phase1Time,
      phase2Time,
      mode: gameMode,
      ...(gameMode === "host_questions" ? {
        hostPrompts: randomizeHostOrder
          ? shuffleArray(hostPrompts.slice(0, numQuestions))
          : hostPrompts.slice(0, numQuestions),
      } : {}),
    });
    router.push(`/host/${roomCode}/game`);
  }

  function handleAddHostPrompts(prompts: Prompt[]) {
    setHostPrompts((prev) => {
      const combined = [...prev, ...prompts];
      return combined.slice(0, numQuestions);
    });
  }

  function handleDeleteHostPrompt(id: string) {
    setHostPrompts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleKick(nickname: string) {
    sendMsg({ type: "kick_player", nickname });
    setMenuState("closed");
  }

  async function handleDisband() {
    sendMsg({ type: "disband_room" });
    localStorage.removeItem(HOST_SESSION_KEY);
    await fetch(`/api/room/${roomCode}/deactivate`, { method: "POST" }).catch(() => {});
    router.push("/");
  }

  const players = lobbyState?.players ?? [];
  const nonHostPlayers = players.filter((p) => !p.isHost);

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col items-center px-4 py-8`}>
      <div className="w-full max-w-2xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className={`${t.textMuted} text-sm uppercase tracking-widest mb-1`}>Room Code</p>
            <h1 className={`text-5xl font-black ${t.textYellow} tracking-widest font-mono`}>{roomCode}</h1>
          </div>
          <div className="flex gap-2 mt-2">
            <a href={`/tv/${roomCode}`} target="_blank" rel="noopener noreferrer"
              className={`px-4 py-2 rounded-xl ${t.btnPrimary} font-semibold shadow`}>
              Open Shared TV Screen ↗
            </a>
            <button
              onClick={() => setMenuState("main")}
              className={`px-4 py-2 rounded-xl ${t.btnGhost} font-semibold`}
            >
              ⋯
            </button>
          </div>
        </div>

        {/* Menu overlay */}
        {menuState !== "closed" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuState("closed")}>
            <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border ${t.borderSurface} p-6`}
              onClick={(e) => e.stopPropagation()}>

              {menuState === "main" && (
                <>
                  <h3 className="text-white font-bold text-lg mb-4">Host Menu</h3>
                  <div className="flex flex-col gap-3">
                    {nonHostPlayers.length > 0 && (
                      <button
                        onClick={() => setMenuState("kick")}
                        className={`w-full py-3 rounded-xl ${t.btnGhost} font-semibold text-base text-left px-4`}
                      >
                        👢 Kick Player
                      </button>
                    )}
                    <button
                      onClick={() => setMenuState("disband_confirm")}
                      className={`w-full py-3 rounded-xl ${t.btnDanger} font-semibold text-base text-left px-4`}
                    >
                      🗑 Disband Room
                    </button>
                    <button
                      onClick={() => setMenuState("closed")}
                      className={`w-full py-3 rounded-xl ${t.btnGhost} text-base`}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {menuState === "kick" && (
                <>
                  <h3 className="text-white font-bold text-lg mb-4">Kick Player</h3>
                  <div className="flex flex-col gap-2">
                    {nonHostPlayers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleKick(p.nickname)}
                        className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl ${t.btnGhost} hover:bg-[#9a3558]/20 hover:border-[#9a3558]/40 hover:text-[#c94f7a] transition-all`}
                      >
                        <div className={`${resolveAvatarColor(p.nickname, p.emoji)} w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0`}>
                          {resolveEmoji(p.nickname, p.emoji)}
                        </div>
                        <span className="font-semibold">{p.nickname}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setMenuState("main")}
                      className={`w-full py-3 rounded-xl ${t.btnGhost} text-base mt-1`}
                    >
                      Back
                    </button>
                  </div>
                </>
              )}

              {menuState === "disband_confirm" && (
                <>
                  <h3 className="text-white font-bold text-lg mb-2">Disband Room?</h3>
                  <p className={`${t.textMuted} text-sm mb-6`}>
                    This will remove all players and close the room. This cannot be undone.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDisband}
                      className="w-full py-3 rounded-xl bg-[#9a3558] text-white font-bold text-base hover:bg-[#7e2b47] active:scale-95 transition-all"
                    >
                      Yes, Disband Room
                    </button>
                    <button
                      onClick={() => setMenuState("main")}
                      className={`w-full py-3 rounded-xl ${t.btnGhost} text-base`}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Players */}
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} shadow-xl p-6 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl">
              Players <span className={`${t.textCyan} font-mono`}>({nonHostPlayers.length})</span>
            </h2>
            <span className={`${t.textMuted} text-sm animate-pulse`}>Waiting for players...</span>
          </div>
          {nonHostPlayers.length === 0 ? (
            <p className={`${t.textMuted} text-center text-xl py-8`}>No players yet — share the room code!</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {nonHostPlayers.map((player) => (
                <PlayerAvatar
                  key={player.id}
                  player={player}
                  disconnected={(lobbyState?.disconnectedNicknames ?? []).includes(player.nickname)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Game Settings */}
        <div className={`${t.bgSurface} rounded-2xl border ${t.borderSurface} shadow-xl p-6 mb-6`}>
          <h3 className={`${t.textMuted} text-sm uppercase tracking-widest mb-4`}>Game Settings</h3>
          <div className="flex flex-col gap-4">
            <SettingRow
              label="Questions"
              value={numQuestions}
              options={QUESTION_OPTIONS}
              onChange={(v) => { setNumQuestions(v); setHostPrompts((prev) => prev.slice(0, v)); }}
            />
            <SettingRow
              label="Answer time"
              value={phase1Time}
              options={TIME_OPTIONS}
              onChange={setPhase1Time}
            />
            <SettingRow
              label="Guess time"
              value={phase2Time}
              options={TIME_OPTIONS}
              onChange={setPhase2Time}
            />
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium whitespace-nowrap w-24 shrink-0">Questions by</span>
              <div className="flex gap-1.5 flex-1">
                <button
                  onClick={() => setGameMode("game_questions")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    gameMode === "game_questions"
                      ? "bg-[#7862FF] text-white"
                      : `${t.btnGhost} ${t.textMuted}`
                  }`}
                >
                  Game
                </button>
                <button
                  onClick={() => setGameMode("player_questions")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    gameMode === "player_questions"
                      ? "bg-[#7862FF] text-white"
                      : `${t.btnGhost} ${t.textMuted}`
                  }`}
                >
                  Players
                </button>
                <button
                  onClick={() => setGameMode("host_questions")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    gameMode === "host_questions"
                      ? "bg-[#7862FF] text-white"
                      : `${t.btnGhost} ${t.textMuted}`
                  }`}
                >
                  Host
                </button>
              </div>
            </div>
          </div>
        </div>

        {gameMode === "host_questions" && (
          <>
            <div className="flex items-center gap-3 mb-3 px-1">
              <button
                onClick={() => setRandomizeHostOrder((v) => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${randomizeHostOrder ? "bg-[#7862FF]" : "bg-[#2a4a8a]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${randomizeHostOrder ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <span className={`${t.textMuted} text-sm`}>Randomize question order</span>
            </div>
            <HostQuestionPanel
              needed={numQuestions}
              questions={hostPrompts}
              onAdd={handleAddHostPrompts}
              onDelete={handleDeleteHostPrompt}
            />
          </>
        )}

        {(() => {
          const notEnoughPlayers = nonHostPlayers.length < 2;
          const notEnoughHostQs = gameMode === "host_questions" && hostPrompts.length < numQuestions;
          const disabled = notEnoughPlayers || notEnoughHostQs;
          return (
            <>
              <button onClick={handleLock} disabled={disabled}
                className={`w-full py-4 rounded-2xl ${t.btnYellow} text-xl shadow-xl ${t.btnPrimaryDisabled}`}>
                Lock & Start Game
              </button>
              {notEnoughPlayers && (
                <p className={`${t.textFaint} text-sm text-center mt-2`}>Need at least 2 players to start</p>
              )}
              {!notEnoughPlayers && notEnoughHostQs && (
                <p className={`${t.textFaint} text-sm text-center mt-2`}>
                  Add {numQuestions - hostPrompts.length} more question{numQuestions - hostPrompts.length !== 1 ? "s" : ""} to start
                </p>
              )}
            </>
          );
        })()}
      </div>
    </main>
  );
}

function HostGuard() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();

  const [status, setStatus] = useState<"checking" | "ok" | "conflict" | "unauthorized" | "not_found">("checking");

  useEffect(() => {
    // Check localStorage first — no token means this isn't a registered host session
    const token = localStorage.getItem("consensus_host_token") ?? "";
    const savedRoom = (() => {
      try {
        const s = localStorage.getItem(HOST_SESSION_KEY);
        return s ? (JSON.parse(s) as { roomCode: string }).roomCode : null;
      } catch { return null; }
    })();

    // Token must exist and either belong to this room (saved session) or be a fresh registration
    // A fresh registration always comes from /register which sets HOST_SESSION_KEY immediately after
    if (!token) {
      setStatus("unauthorized");
      return;
    }

    // Check both Supabase (active flag) and PartyKit (in-memory host presence)
    fetch(`/api/room/${roomCode}`)
      .then((r) => r.json())
      .then((data: { exists: boolean; hostActive: boolean; active: boolean }) => {
        // Room was registered but someone else already has it active (different session)
        if (data.exists && data.hostActive) {
          // Allow through if this is our own saved session for this room
          if (savedRoom === roomCode) {
            setStatus("ok");
          } else {
            setStatus("conflict");
          }
          return;
        }
        // Room code has never been registered in Supabase
        if (data.active === false) {
          setStatus("not_found");
          return;
        }
        setStatus("ok");
      })
      .catch(() => setStatus("ok"));
  }, [roomCode]);

  if (status === "checking") {
    return (
      <main className={`min-h-screen ${t.bgPage} flex items-center justify-center`}>
        <div className={`${t.textMuted} text-lg animate-pulse`}>Loading...</div>
      </main>
    );
  }

  if (status === "unauthorized") {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border border-[#9a3558]/40 shadow-xl p-8 text-center`}>
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-2xl font-black text-[#c94f7a] mb-2">Sign In Required</h2>
          <p className={`${t.textMuted} mb-6`}>You need to register before hosting a game.</p>
          <button
            onClick={() => router.push("/register")}
            className={`block w-full py-3 rounded-xl ${t.btnYellow} text-lg text-center`}
          >
            Go to Register
          </button>
        </div>
      </main>
    );
  }

  if (status === "not_found") {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border border-[#9a3558]/40 shadow-xl p-8 text-center`}>
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-2xl font-black text-[#c94f7a] mb-2">Room Not Found</h2>
          <p className={`${t.textMuted} mb-6`}>
            Room <span className="text-white font-mono font-bold">{roomCode}</span>{" "}doesn&apos;t exist or has ended.
          </p>
          <button
            onClick={() => router.push("/register")}
            className={`block w-full py-3 rounded-xl ${t.btnYellow} text-lg text-center`}
          >
            Create a New Room
          </button>
        </div>
      </main>
    );
  }

  if (status === "conflict") {
    return (
      <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-4`}>
        <div className={`w-full max-w-sm ${t.bgSurface} rounded-2xl border border-[#9a3558]/40 shadow-xl p-8 text-center`}>
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-2xl font-black text-[#c94f7a] mb-2">Host Already Active</h2>
          <p className={`${t.textMuted} mb-6`}>
            Room <span className="text-white font-mono font-bold">{roomCode}</span> already has an active host.
          </p>
          <button
            onClick={() => router.push("/")}
            className={`block w-full py-3 rounded-xl ${t.btnYellow} text-lg text-center`}
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return <HostContent roomCode={roomCode} />;
}

export default function HostPage() {
  return <HostGuard />;
}
