"use client";

import { useRouter } from "next/navigation";
import { t } from "@/lib/theme";

export default function CreditsPage() {
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
          <h1 className="text-5xl font-black text-white">About</h1>
        </div>

        <div className="flex flex-col gap-6">

          {/* Feedback */}
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-6`}>
            <p className={`${t.textMuted} text-sm leading-relaxed`}>
              Thanks for playing! If you have any feedback, feature requests, or found a bug, I'd really appreciate hearing from you —{" "}
              <a
                href="mailto:contactdavidliu@gmail.com"
                className={`${t.textCyan} hover:text-white transition-colors underline underline-offset-4`}
              >
                contactdavidliu@gmail.com
              </a>
            </p>
          </div>

          {/* Creator */}
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-6`}>
            <p className={`${t.textMuted} text-xs font-bold uppercase tracking-widest mb-3`}>Game Design & Development</p>
            <p className="text-white text-xl font-bold mb-1">David Liu</p>
            <p className={`${t.textMuted} text-sm mt-2`}>
            Main site:{" "}
              <a
                href="https://davidnyc.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${t.textCyan} hover:text-white transition-colors underline underline-offset-4`}
              >
              davidnyc.vercel.app
            </a>
            </p>
            <p className={`${t.textMuted} text-sm mt-2`}>
              Contact:{" "}
              <a
                href="mailto:contactdavidliu@gmail.com"
                className={`${t.textCyan} hover:text-white transition-colors underline underline-offset-4`}
              >
                contactdavidliu@gmail.com
              </a>
            </p>
          </div>

          {/* Music */}
          <div className={`${t.bgSurface} border ${t.borderSurface} rounded-2xl p-6`}>
            <p className={`${t.textMuted} text-xs font-bold uppercase tracking-widest mb-4`}>Music</p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-white font-semibold mb-1">Kevin MacLeod</p>
                <p className={`${t.textMuted} text-sm mb-1`}>
                  Background music licensed under Creative Commons: By Attribution 4.0
                </p>
                <a
                  href="https://incompetech.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${t.textCyan} text-sm hover:text-white transition-colors underline underline-offset-4`}
                >
                  incompetech.com
                </a>
              </div>
              <div className={`border-t ${t.borderSurface}`} />
              <div>
                <p className="text-white font-semibold mb-1">Freesound.org</p>
                <p className={`${t.textMuted} text-sm mb-1`}>
                  Sound effects sourced from the Freesound community
                </p>
                <a
                  href="https://freesound.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${t.textCyan} text-sm hover:text-white transition-colors underline underline-offset-4`}
                >
                  freesound.org
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
