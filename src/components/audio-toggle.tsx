"use client";

import { Volume2, VolumeX } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAudioStore } from "@/lib/stores/audio";
import { cn } from "@/lib/utils";

// Botão flutuante de mute. Visível em qualquer rota de menu do /app, escondido
// no player de lição (imersivo) e fora do app. Posicionado acima do BottomNav.
export function AudioToggle() {
  const pathname = usePathname();
  const muted = useAudioStore((s) => s.muted);
  const toggleMute = useAudioStore((s) => s.toggleMute);

  if (!pathname.startsWith("/app")) return null;
  if (pathname.startsWith("/app/licao")) return null;

  const Icon = muted ? VolumeX : Volume2;
  const label = muted ? "Ativar som" : "Silenciar";

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={label}
      title={label}
      className={cn(
        "btn-3d fixed bottom-20 right-4 z-30 flex size-10 items-center justify-center rounded-full",
        "border border-border bg-surface-elevated shadow-md",
        "hover:bg-surface",
        muted ? "text-text-muted" : "text-brand-green",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
