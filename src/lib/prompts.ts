import type { Prompt } from "./types";

export const PROMPTS: Prompt[] = [
  // ── Binary ──────────────────────────────────────────────────────────────
  {
    id: "b1",
    text: "Have you ever pulled an all-nighter for something non-work related?",
    type: "binary",
  },
  {
    id: "b2",
    text: "Do you think you could survive a week without your phone?",
    type: "binary",
  },
  {
    id: "b3",
    text: "Have you ever lied to get out of a social event?",
    type: "binary",
  },
  {
    id: "b4",
    text: "Do you believe in love at first sight?",
    type: "binary",
  },
  {
    id: "b5",
    text: "Have you ever eaten an entire pizza by yourself?",
    type: "binary",
  },
  {
    id: "b6",
    text: "Would you rather be famous but broke than rich but anonymous?",
    type: "binary",
  },
  {
    id: "b7",
    text: "Have you ever ghosted someone you were actively dating?",
    type: "binary",
  },
  {
    id: "b8",
    text: "Do you read the terms and conditions before clicking accept?",
    type: "binary",
  },
  {
    id: "b9",
    text: "Have you ever pretended to laugh at a joke you didn't understand?",
    type: "binary",
  },
  {
    id: "b10",
    text: "Would you take a free one-way trip to Mars if you could never come back?",
    type: "binary",
  },

  // ── Multiple Choice ──────────────────────────────────────────────────────
  {
    id: "mc1",
    text: "What's your go-to comfort food?",
    type: "multiple_choice",
    options: ["Pizza", "Ice Cream", "Ramen", "Tacos"],
  },
  {
    id: "mc2",
    text: "How do you prefer to spend a free Saturday?",
    type: "multiple_choice",
    options: ["Outdoors / active", "Netflix binge", "Social hangout", "Doing nothing"],
  },
  {
    id: "mc3",
    text: "What's your sleep schedule like?",
    type: "multiple_choice",
    options: ["Early bird (before 10 pm)", "Normal (10 pm – midnight)", "Night owl (after midnight)", "It varies wildly"],
  },
  {
    id: "mc4",
    text: "Which superpower would you pick?",
    type: "multiple_choice",
    options: ["Flight", "Invisibility", "Mind reading", "Teleportation"],
  },
  {
    id: "mc5",
    text: "Pick your vibe this week:",
    type: "multiple_choice",
    options: ["Thriving", "Surviving", "Barely functioning", "On another planet"],
  },
  {
    id: "mc6",
    text: "What's your go-to drink order?",
    type: "multiple_choice",
    options: ["Coffee / espresso", "Bubble tea / smoothie", "Alcohol", "Just water"],
  },
  {
    id: "mc7",
    text: "Which would you rather give up forever?",
    type: "multiple_choice",
    options: ["Social media", "Music", "Takeout food", "Streaming services"],
  },
  {
    id: "mc8",
    text: "How do you handle conflict?",
    type: "multiple_choice",
    options: ["Address it head-on", "Avoid it entirely", "Passive-aggressive hints", "Vent to a friend first"],
  },
  {
    id: "mc9",
    text: "What's your texting style?",
    type: "multiple_choice",
    options: ["Reply instantly", "Reply when I feel like it", "Leave on read sometimes", "I'm always on Do Not Disturb"],
  },
  {
    id: "mc10",
    text: "If you had to eat only one cuisine for a year, which would you pick?",
    type: "multiple_choice",
    options: ["Japanese", "Mexican", "Italian", "Indian"],
  },

  // ── Scale ────────────────────────────────────────────────────────────────
  {
    id: "s1",
    text: "How messy is your room right now? (1 = spotless, 10 = disaster zone)",
    type: "scale",
  },
  {
    id: "s2",
    text: "How spicy do you like your food? (1 = no spice, 10 = maximum heat)",
    type: "scale",
  },
  {
    id: "s3",
    text: "How extroverted are you feeling today? (1 = total hermit, 10 = social butterfly)",
    type: "scale",
  },
  {
    id: "s4",
    text: "Rate your current life satisfaction. (1 = rock bottom, 10 = absolutely thriving)",
    type: "scale",
  },
  {
    id: "s5",
    text: "How likely are you to cancel plans last minute? (1 = never, 10 = always)",
    type: "scale",
  },
  {
    id: "s6",
    text: "How much of a morning person are you? (1 = hate mornings, 10 = love them)",
    type: "scale",
  },
  {
    id: "s7",
    text: "How adventurous are you with food? (1 = chicken tenders only, 10 = eat anything)",
    type: "scale",
  },
  {
    id: "s8",
    text: "How financially responsible are you right now? (1 = chaos, 10 = spreadsheet king/queen)",
    type: "scale",
  },
  {
    id: "s9",
    text: "How petty can you be when someone wrongs you? (1 = saint, 10 = never forget, never forgive)",
    type: "scale",
  },
  {
    id: "s10",
    text: "How often do you actually follow through on your New Year's resolutions? (1 = never, 10 = always)",
    type: "scale",
  },
];

export function getPromptsForGame(n: number): Prompt[] {
  const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
