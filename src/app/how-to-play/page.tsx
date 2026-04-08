"use client";

import { useRouter } from "next/navigation";
import { t } from "@/lib/theme";

const rules = [
  {
    phase: "Phase 1 — Answer",
    color: t.textCyan,
    icon: "🎯",
    desc: "Everyone answers the same question independently. Your answer is secret — no one else can see it.",
  },
  {
    phase: "Phase 2 — Predict",
    color: t.textYellow,
    icon: "🔮",
    desc: "Now predict what the group said. For yes/no questions, guess how many said YES. For multiple choice, guess the most popular answer. For scale questions, guess the group average.",
  },
  {
    phase: "Phase 3 — Reveal",
    color: "text-[#a594ff]",
    icon: "📊",
    desc: "See how the group actually answered. Points are awarded based on how close your prediction was.",
  },
];

const scoring = [
  { label: "Yes / No", pts: "0–1000 pts", desc: "Based on how far off your count was", color: t.textCyan },
  { label: "Scale", pts: "0–1000 pts", desc: "Closer to the group average = more points", color: t.textTeal },
  { label: "Multiple Choice", pts: "625–1000 pts", desc: "Correct guess — rarer answers score higher", color: t.textYellow },
];

export default function HowToPlayPage() {
  const router = useRouter();

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col items-center px-4 py-10`}>
      <div className="w-full max-w-xl">
        <button
          onClick={() => router.back()}
          className={`${t.textMuted} text-base mb-6 hover:text-white transition-colors flex items-center gap-2`}
        >
          ← Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white">How to Play</h1>
          <p className={`${t.textTeal} text-xl mt-2`}>Wisdom of the Crowds</p>
        </div>

        {/* Overview */}
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-6 mb-6`}>
          <p className="text-white text-lg leading-relaxed">
            Consensus is a party game about predicting what your group thinks.
            Answer questions, then guess how everyone else answered.
            The closer your prediction — the more points you earn.
          </p>
        </div>

        {/* Phases */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>Each Round</h2>
        <div className="flex flex-col gap-4 mb-8">
          {rules.map((r) => (
            <div key={r.phase} className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5 flex gap-4`}>
              <span className="text-3xl mt-0.5">{r.icon}</span>
              <div>
                <p className={`${r.color} font-bold text-base uppercase tracking-wide mb-1`}>{r.phase}</p>
                <p className="text-white text-base leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>Scoring</h2>
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl overflow-hidden mb-8`}>
          {scoring.map((s, i) => (
            <div key={s.label} className={`flex items-center justify-between px-5 py-3 ${i < scoring.length - 1 ? `border-b ${t.borderSurface}` : ""}`}>
              <div>
                <span className={`${s.color} font-bold text-base`}>{s.label}</span>
                <span className={`${t.textMuted} text-sm ml-3`}>{s.desc}</span>
              </div>
              <span className="text-white font-bold text-base">{s.pts}</span>
            </div>
          ))}
        </div>

        {/* Tips */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>Tips</h2>
        <div className="flex flex-col gap-3 mb-10">
          {[
            "You need at least 3 players to start a game.",
            "The host controls the pace — they can skip questions or advance phases early.",
            "You must answer Phase 1 to participate in Phase 2.",
            "Ties in multiple choice award points to all tied answers — but popular choices score fewer points.",
          ].map((tip) => (
            <div key={tip} className={`flex gap-3 ${t.bgSurface} border ${t.borderSurface} rounded-xl px-4 py-3`}>
              <span className={t.textTeal}>→</span>
              <p className="text-white text-base">{tip}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/")}
          className={`w-full py-4 rounded-2xl ${t.btnYellow} text-xl`}
        >
          Play Now
        </button>
      </div>
    </main>
  );
}
