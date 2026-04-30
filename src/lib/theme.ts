/**
 * Central theme tokens — edit here to update the entire app.
 *
 * Palette:
 *   primary   #7862FF  – purple (buttons, active states, accent)
 *   yellow    #f6dc53  – warm yellow (titles, highlights, CTAs)
 *   yellow2   #eebf2d  – amber (hover states, secondary accents)
 *   teal      #25a59f  – teal (true/yes, success, confirmation)
 *   tealLight #4dd9d2  – lighter teal for text on dark bg
 *   rose      #9a3558  – crimson rose (danger, subtle)
 *   roseLight #c94f7a  – lighter rose for text on dark bg
 *   red       #e03060  – bright red (NO button, strong negative)
 *   bg        #081c48  – page background (deep navy)
 *   surface   #0f2660  – card/panel background
 *   surface2  #1a3580  – slightly lighter surface for hover/nested
 *   border    #2a4a8a  – card borders
 */

export const t = {
  // Backgrounds
  bgPage: "bg-[#081c48]",
  bgPhase1: "bg-[#0d1e54]",      // phase 1 answer screen tint
  bgPhase2: "bg-[#022434]",      // phase 2 predict screen tint
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
  textRed: "text-[#e03060]",        // bright red (NO label)
  textMuted: "text-[#b8c0e8]",      // muted blue-slate
  textFaint: "text-[#aba9d0]",      // faint blue-slate
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

  // FALSE answer color (no/red)
  falseColor: { bg: "bg-[#e03060]", text: "text-white", hover: "hover:bg-[#c42850]" },

  // Button: NO (binary)
  btnNo: "bg-[#e03060] text-white hover:bg-[#c42850] active:scale-95 transition-all font-black",

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

  // Per-emoji thematic background colors (bright, pastel — use on dark UI)
  // bg color + text color pair
  emojiColors: {
    "🦊": { bg: "bg-[#ffc89a]", text: "text-[#3a1a00]" },   // fox — light peach
    "🐬": { bg: "bg-[#9ad4f8]", text: "text-[#00233a]" },   // dolphin — light sky blue
    "🦋": { bg: "bg-[#dbb8f8]", text: "text-[#2a0050]" },   // butterfly — light lavender
    "🐸": { bg: "bg-[#a8f0a4]", text: "text-[#0a2a0a]" },   // frog — light mint green
    "🦁": { bg: "bg-[#fce090]", text: "text-[#3a2000]" },   // lion — light golden
    "🐧": { bg: "bg-[#b4d0f8]", text: "text-[#0a1a3a]" },   // penguin — light periwinkle
    "🦄": { bg: "bg-[#f8c4f0]", text: "text-[#3a0040]" },   // unicorn — light pink
    "🐙": { bg: "bg-[#f8a8cc]", text: "text-[#3a0020]" },   // octopus — light rose
    "🦖": { bg: "bg-[#c4f090]", text: "text-[#142a00]" },   // dino — light yellow-green
    "🐝": { bg: "bg-[#fef08a]", text: "text-[#3a2a00]" },   // bee — light yellow
    "🦩": { bg: "bg-[#fdb0d4]", text: "text-[#3a0028]" },   // flamingo — light hot pink
    "🐳": { bg: "bg-[#90c8f8]", text: "text-[#001830]" },   // whale — light cornflower
    "🦚": { bg: "bg-[#90e8c4]", text: "text-[#003020]" },   // peacock — light mint
    "🐻": { bg: "bg-[#e8c898]", text: "text-[#2a1400]" },   // bear — light tan
    "🦀": { bg: "bg-[#fca0a0]", text: "text-[#3a0000]" },   // crab — light coral
    "🐯": { bg: "bg-[#fdd070]", text: "text-[#3a1800]" },   // tiger — light amber
  } as Record<string, { bg: string; text: string }>,
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

/** Returns custom emoji if set, otherwise the deterministic one. */
export function resolveEmoji(nickname: string, customEmoji?: string): string {
  return customEmoji ?? playerEmoji(nickname);
}

/** Returns avatar bg class — always uses the thematic color for the resolved emoji. */
export function resolveAvatarColor(nickname: string, customEmoji?: string): string {
  const emoji = resolveEmoji(nickname, customEmoji);
  return t.emojiColors[emoji]?.bg ?? avatarColor(nickname);
}

/** Returns avatar text color class matching resolveAvatarColor. */
export function resolveAvatarTextColor(nickname: string, customEmoji?: string): string {
  const emoji = resolveEmoji(nickname, customEmoji);
  return t.emojiColors[emoji]?.text ?? avatarTextColor(nickname);
}
