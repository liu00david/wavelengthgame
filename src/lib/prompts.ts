import type { Prompt } from "./types";

export const PROMPTS: Prompt[] = [
  // Binary prompts
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

  // Multiple choice prompts
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
    options: ["Outdoors/Active", "Netflix binge", "Social hangout", "Doing nothing"],
  },
  {
    id: "mc3",
    text: "What's your sleep schedule like?",
    type: "multiple_choice",
    options: [
      "Early bird (before 10pm)",
      "Normal (10pm-midnight)",
      "Night owl (after midnight)",
      "It varies wildly",
    ],
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

  // Scale prompts
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
    text: "How extroverted are you feeling today? (1 = hermit mode, 10 = social butterfly)",
    type: "scale",
  },
  {
    id: "s4",
    text: "Rate your current life satisfaction. (1 = rock bottom, 10 = thriving)",
    type: "scale",
  },
  {
    id: "s5",
    text: "How likely are you to cancel plans last minute? (1 = never, 10 = always)",
    type: "scale",
  },
];

export function getPromptsForGame(n: number): Prompt[] {
  const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
