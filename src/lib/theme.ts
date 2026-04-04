/**
 * Central theme tokens — edit here to update the entire app.
 *
 * Palette:
 *   primary   #7862FF  – purple (buttons, active states, accent)
 *   yellow    #f6dc53  – warm yellow (titles, highlights, CTAs)
 *   yellow2   #eebf2d  – amber (hover states, secondary accents)
 *   teal      #25a59f  – teal (true/yes, success, confirmation)
 *   tealLight #4dd9d2  – lighter teal for text on dark bg
 *   rose      #9a3558  – crimson rose (false/no, danger)
 *   roseLight #c94f7a  – lighter rose for text on dark bg
 *   bg        #081c48  – page background (deep navy)
 *   surface   #0f2660  – card/panel background
 *   surface2  #1a3580  – slightly lighter surface for hover/nested
 *   border    #2a4a8a  – card borders
 */

export const t = {
  // Backgrounds
  bgPage: "bg-[#081c48]",
  bgSurface: "bg-[#0f2660]",
  bgSurface2: "bg-[#1a3580]",

  // Borders
  borderSurface: "border-[#2a4a8a]",

  // Text colors
  textPrimary: "text-[#7862FF]",
  textYellow: "text-[#f6dc53]",
  textYellow2: "text-[#eebf2d]",
  textTeal: "text-[#4dd9d2]",       // lighter teal for readability on dark bg
  textCyan: "text-[#4dd9d2]",       // alias
  textRose: "text-[#c94f7a]",       // lighter rose for readability on dark bg
  textMuted: "text-[#a8c0e8]",      // muted blue-slate
  textFaint: "text-[#7a96c8]",      // faint blue-slate
  textWhite: "text-white",

  // Button: primary (purple)
  btnPrimary: "bg-[#7862FF] text-white hover:bg-[#6A55E8] active:scale-95 transition-all",
  btnPrimaryDisabled: "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",

  // Button: yellow CTA — dark text on yellow
  btnYellow: "bg-[#f6dc53] text-[#081c48] hover:bg-[#eebf2d] active:scale-95 transition-all font-black",

  // Button: teal CTA — dark text on teal
  btnTeal: "bg-[#25a59f] text-white hover:bg-[#1d8c87] active:scale-95 transition-all font-bold",

  // Button: ghost/secondary
  btnGhost: "bg-[#0f2660] border border-[#2a4a8a] text-white hover:bg-[#1a3580] active:scale-95 transition-all",

  // Button: danger/leave
  btnDanger: "bg-[#9a3558] border border-[#7e2b47] text-white hover:bg-[#7e2b47] active:scale-95 transition-all",

  // TRUE answer color (yes/teal)
  trueColor: { bg: "bg-[#25a59f]", text: "text-white", hover: "hover:bg-[#1d8c87]" },

  // FALSE answer color (no/rose)
  falseColor: { bg: "bg-[#9a3558]", text: "text-white", hover: "hover:bg-[#7e2b47]" },

  // Answer choice buttons: bg + text pairs (bright, white-hued, all black text)
  answerChoiceColors: [
    { bg: "bg-[#a594ff]", text: "text-[#0a0a2e]" },
    { bg: "bg-[#3dd4cc]", text: "text-[#021f1e]" },
    { bg: "bg-[#f6dc53]", text: "text-[#1a1000]" },
    { bg: "bg-[#f07ab0]", text: "text-[#2a0018]" },
  ] as { bg: string; text: string }[],

  // Answer bar colors for TV result bars
  answerBarColors: [
    "bg-[#a594ff]",
    "bg-[#3dd4cc]",
    "bg-[#f6dc53]",
    "bg-[#f07ab0]",
  ] as string[],

  // Timer
  timerNormal: "#7862FF",
  timerUrgent: "#c94f7a",

  // Avatar background pool (deterministic by nickname hash)
  avatarColors: [
    "bg-[#7862FF]",
    "bg-[#25a59f]",
    "bg-[#9a3558]",
    "bg-[#eebf2d]",
    "bg-[#4dd9d2]",
    "bg-[#c94f7a]",
    "bg-[#1a3580]",
    "bg-[#6A55E8]",
  ] as string[],

  // Avatar text colors matching avatarColors (ensure contrast)
  avatarTextColors: [
    "text-white",       // purple
    "text-white",       // teal
    "text-white",       // rose
    "text-[#081c48]",  // amber
    "text-[#081c48]",  // light teal
    "text-white",       // light rose
    "text-white",       // dark navy
    "text-white",       // indigo
  ] as string[],

  // Player emojis (deterministic by nickname hash, separate from color)
  playerEmojis: [
    "🦊", "🐬", "🦋", "🐸", "🦁", "🐧", "🦄", "🐙",
    "🦖", "🐝", "🦩", "🐳", "🦚", "🐻", "🦀", "🐯",
  ] as string[],
};

function nicknameHash(nickname: string): number {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++)
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

export function avatarColor(nickname: string): string {
  return t.avatarColors[nicknameHash(nickname) % t.avatarColors.length];
}

export function avatarTextColor(nickname: string): string {
  return t.avatarTextColors[nicknameHash(nickname) % t.avatarColors.length];
}

export function playerEmoji(nickname: string): string {
  // Use a different multiplier so emoji differs from color
  return t.playerEmojis[(nicknameHash(nickname) * 31) % t.playerEmojis.length];
}
