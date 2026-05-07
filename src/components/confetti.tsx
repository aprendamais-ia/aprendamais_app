"use client";

import { useState, type CSSProperties } from "react";

type Particle = {
  id: number;
  emoji: string;
  left: number; // %
  xDrift: number; // vw
  delay: number; // ms
  duration: number; // ms
  size: number; // px
};

const EMOJIS = ["🎉", "✨", "⭐", "🟢", "💚", "🎊", "🏆"] as const;
const COUNT = 22;

function buildParticles(): Particle[] {
  const arr: Particle[] = [];
  for (let i = 0; i < COUNT; i++) {
    arr.push({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: 10 + Math.random() * 80,
      xDrift: (Math.random() - 0.5) * 40,
      delay: Math.random() * 400,
      duration: 1600 + Math.random() * 1100,
      size: 22 + Math.random() * 14,
    });
  }
  return arr;
}

export function Confetti() {
  const [particles] = useState<Particle[]>(() => buildParticles());

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti-rise"
          style={
            {
              left: `${p.left}%`,
              bottom: "8%",
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
              "--cf-x": `${p.xDrift}vw`,
            } as CSSProperties & { "--cf-x": string }
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
