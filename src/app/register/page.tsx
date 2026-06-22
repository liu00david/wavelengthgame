"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/theme";

const inputClass = `w-full bg-[#0f2660] border border-[#2a4a8a] rounded-xl px-4 py-3 text-white text-base placeholder-[#4a6a9a] focus:outline-none focus:border-[#7862FF] transition-colors`;

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !token.trim()) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, token }),
      });
      const data = await res.json() as { roomCode?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      localStorage.setItem("consensus_host_name", `${firstName.trim()} ${lastName.trim()}`);
      router.push(`/host/${data.roomCode}`);
    } catch {
      setError("Could not reach server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`min-h-screen ${t.bgPage} flex flex-col items-center justify-center px-5 py-10`}>
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className={`text-4xl sm:text-5xl font-black ${t.textYellow} leading-none`}>+1</span>
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight">CONSENSUS</h1>
        </div>
        <p className={`${t.textMuted} mt-2 text-base`}>Enter your details to create a room</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className={`${t.bgSurface} rounded-2xl shadow-xl p-6 flex flex-col gap-4 border ${t.borderSurface}`}>
          <h2 className="text-xl font-bold text-white">Host Sign In</h2>

          <div className="flex flex-col gap-1.5">
            <label className={`${t.textMuted} text-sm font-medium`}>First Name</label>
            <input
              type="text"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(""); }}
              className={inputClass}
              autoComplete="given-name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`${t.textMuted} text-sm font-medium`}>Last Name</label>
            <input
              type="text"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(""); }}
              className={inputClass}
              autoComplete="family-name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`${t.textMuted} text-sm font-medium`}>Access Token</label>
            <input
              type="password"
              placeholder="Enter your token"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(""); }}
              className={inputClass}
              autoComplete="off"
            />
          </div>

          {error && <p className="text-[#c94f7a] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl ${t.btnPrimary} text-lg font-bold ${t.btnPrimaryDisabled}`}
          >
            {loading ? "Creating room…" : "Create Room →"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className={`w-full py-3 rounded-xl ${t.btnGhost} font-semibold text-base`}
        >
          ← Back
        </button>
      </form>
    </main>
  );
}
