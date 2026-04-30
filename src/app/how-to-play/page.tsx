"use client";

import { useRouter } from "next/navigation";
import { t } from "@/lib/theme";

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
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-6 mb-8`}>
          <p className="text-white text-lg leading-relaxed">
            Consensus is a party game about predicting what your group thinks. Answer questions honestly, then guess how everyone else answered. The closer your prediction — the more points you earn.
          </p>
        </div>

        {/* Question Types */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>Question Types</h2>
        <div className="flex flex-col gap-3 mb-8">
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5`}>
            <p className="text-[#25a59f] font-bold text-base uppercase tracking-wide mb-2">Yes / No</p>
            <ul className="flex flex-col gap-1.5">
              <li className="flex gap-2 text-white text-base"><span className="text-[#25a59f] shrink-0">•</span>Answer YES or NO to a question</li>
              <li className="flex gap-2 text-white text-base"><span className="text-[#25a59f] shrink-0">•</span>Predict how many people said YES (and how many said NO)</li>
              <li className="flex gap-2 text-white text-base"><span className="text-[#25a59f] shrink-0">•</span>Points based on how accurate your count is</li>
            </ul>
          </div>
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5`}>
            <p className="text-[#7862FF] font-bold text-base uppercase tracking-wide mb-2">Multiple Choice</p>
            <ul className="flex flex-col gap-1.5">
              <li className="flex gap-2 text-white text-base"><span className="text-[#7862FF] shrink-0">•</span>Pick one of 2–4 options</li>
              <li className="flex gap-2 text-white text-base"><span className="text-[#7862FF] shrink-0">•</span>Predict which option was the most popular</li>
              <li className="flex gap-2 text-white text-base"><span className="text-[#7862FF] shrink-0">•</span>Rarer answers score higher — think like the crowd</li>
            </ul>
          </div>
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5`}>
            <p className={`${t.textYellow} font-bold text-base uppercase tracking-wide mb-2`}>Scale (1–10)</p>
            <ul className="flex flex-col gap-1.5">
              <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>Rate something on a scale from 1 to 10</li>
              <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>Predict the group's average answer</li>
              <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>The closer you are to the average — the more points</li>
            </ul>
          </div>
        </div>

        {/* Host */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>The Host</h2>
        <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5 mb-4`}>
          <p className="text-[#4dd9d2] font-bold text-base uppercase tracking-wide mb-2">📺 TV / Shared Screen</p>
          <ul className="flex flex-col gap-1.5">
            <li className="flex gap-2 text-white text-base"><span className="text-[#4dd9d2] shrink-0">•</span>The host opens the game on their device and controls the pace</li>
            <li className="flex gap-2 text-white text-base"><span className="text-[#4dd9d2] shrink-0">•</span>For the best experience, cast or mirror the <span className={`${t.textYellow} font-semibold`}>/tv</span> screen to a shared display — it shows questions, answers, and results for the whole room</li>
            <li className="flex gap-2 text-white text-base"><span className="text-[#4dd9d2] shrink-0">•</span>The TV screen is optional — the game works fine with just phones</li>
            <li className="flex gap-2 text-white text-base"><span className="text-[#4dd9d2] shrink-0">•</span>The host can pause timers, skip questions, or end the game at any time</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5`}>
            <p className={`${t.textYellow} font-bold text-base uppercase tracking-wide mb-2`}>🎮 Game Questions</p>
            <ul className="flex flex-col gap-1.5">
              <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>Questions are drawn from a built-in bank of 100+ questions</li>
              <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>A random mix of Yes/No, Scale, and Multiple Choice each game</li>
              <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>Great for jumping straight in — no setup needed</li>
            </ul>
          </div>
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5`}>
            <p className="text-[#7862FF] font-bold text-base uppercase tracking-wide mb-2">✏️ Player Questions</p>
            <ul className="flex flex-col gap-1.5">
              <li className="flex gap-2 text-white text-base"><span className="text-[#7862FF] shrink-0">•</span>Before the game starts, everyone submits their own questions</li>
              <li className="flex gap-2 text-white text-base"><span className="text-[#7862FF] shrink-0">•</span>Players can submit Yes/No, Scale, or Multiple Choice questions</li>
              <li className="flex gap-2 text-white text-base"><span className="text-[#7862FF] shrink-0">•</span>Once enough questions are submitted, the host starts the game</li>
              <li className="flex gap-2 text-white text-base"><span className="text-[#7862FF] shrink-0">•</span>Best for more personal and group-specific rounds</li>
            </ul>
          </div>
        </div>

        {/* Phases */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>Each Round</h2>
        <div className="flex flex-col gap-3 mb-8">
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5 flex gap-4`}>
            <span className="text-3xl mt-0.5">💬</span>
            <div>
              <p className="text-[#a99dff] font-bold text-base uppercase tracking-wide mb-1">Phase 1 — Answer</p>
              <p className={`${t.textMuted} text-base leading-relaxed`}>Answer honestly for yourself. Your answer is hidden from everyone else.</p>
            </div>
          </div>
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5 flex gap-4`}>
            <span className="text-3xl mt-0.5">🔮</span>
            <div>
              <p className="text-[#4dd9d2] font-bold text-base uppercase tracking-wide mb-1">Phase 2 — Predict</p>
              <p className={`${t.textMuted} text-base leading-relaxed`}>Guess what the majority of the group answered. You must have answered Phase 1 to participate.</p>
            </div>
          </div>
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-5 flex gap-4`}>
            <span className="text-3xl mt-0.5">📊</span>
            <div>
              <p className="text-[#a594ff] font-bold text-base uppercase tracking-wide mb-1">Phase 3 — Reveal</p>
              <p className={`${t.textMuted} text-base leading-relaxed`}>See how the group actually answered and how many points you earned.</p>
            </div>
          </div>
        </div>

        {/* Double Down */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>Double Down</h2>
        <div className={`${t.bgSurface} border border-[#f6dc53]/30 rounded-2xl p-5 mb-8`}>
          <p className={`${t.textYellow} font-bold text-base mb-2`}>⚡ One use per game</p>
          <ul className="flex flex-col gap-1.5">
            <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>Before submitting your Phase 2 prediction, enable Double Down</li>
            <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>If correct — earn 2× points for that round</li>
            <li className="flex gap-2 text-white text-base"><span className={`${t.textYellow} shrink-0`}>•</span>If wrong — you earn 0 points</li>
          </ul>
        </div>

        {/* Tips */}
        <h2 className={`${t.textMuted} text-sm uppercase tracking-widest mb-3`}>Tips</h2>
        <div className="flex flex-col gap-2 mb-10">
          {[
            { color: "text-[#25a59f]", text: "You need at least 2 players to start a game." },
            { color: "text-[#7862FF]", text: "The host controls the pace — advance phases or skip questions any time." },
            { color: "text-[#4dd9d2]", text: "Players can submit their own questions before the game starts." },
            { color: t.textYellow, text: "For multiple choice, popular answers score fewer points — predicting the rare pick pays off." },
            { color: "text-[#a594ff]", text: "Save your Double Down for a round you're confident about." },
          ].map((tip) => (
            <div key={tip.text} className={`flex gap-3 ${t.bgSurface} border ${t.borderSurface} rounded-xl px-4 py-3`}>
              <span className={`${tip.color} shrink-0`}>→</span>
              <p className="text-white text-base">{tip.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/")}
          className={`w-full py-4 rounded-2xl ${t.btnYellow} text-xl font-black`}
        >
          Play Now
        </button>
      </div>
    </main>
  );
}
