"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAudioStore } from "@/lib/stores/audio";

const SRC = "/mp3/prelude.mp3";
const VOLUME = 0.22;

// Toca em rotas de menu/navegação. Pausa no player de lição (imersivo) e
// fora do app autenticado.
function isMenuRoute(pathname: string): boolean {
  if (!pathname.startsWith("/app")) return false;
  if (pathname.startsWith("/app/licao")) return false;
  return true;
}

// Música de fundo em loop. Single instance — vive no layout do /app.
//
// Autoplay: browsers bloqueiam play() até o user interagir. Quando bloqueado,
// registra listeners (click/touchstart) que disparam o play na primeira
// interação. AbortController garante que listeners da rota anterior somem
// quando muda de rota.
//
// Mute: respeita useAudioStore.muted. Pausa quando muted=true; quando vira
// false e está em rota de menu, retoma.
export function BackgroundMusic() {
  const pathname = usePathname();
  const muted = useAudioStore((s) => s.muted);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio(SRC);
    a.loop = true;
    a.volume = VOLUME;
    a.preload = "auto";
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    if (muted || !isMenuRoute(pathname)) {
      a.pause();
      return;
    }

    const ac = new AbortController();
    void a.play().catch(() => {
      // Autoplay bloqueado — espera primeiro gesture do user e tenta de novo.
      const onGesture = () => {
        void a.play().catch(() => {
          // Falhou de novo — desiste silenciosamente
        });
      };
      document.addEventListener("click", onGesture, { once: true, signal: ac.signal });
      document.addEventListener("touchstart", onGesture, { once: true, signal: ac.signal });
    });

    return () => ac.abort();
  }, [pathname, muted]);

  return null;
}
