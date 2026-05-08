// Sons da UI:
//   - playCorrect / playWrong: sintetizados via Web Audio (curtos, sem assets)
//   - playCheer / playFail: assets MP3 cacheados (toca em momento de celebração)
//
// AudioContext é lazy: browsers exigem gesture do user antes de criar contexto
// de áudio. Os <audio> elements também precisam de gesture pra tocar — mas a
// regra é mais relaxada e já passou no momento em que esses sons rodam (após
// click do user em uma resposta ou em "Bora começar").

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

type ToneOpts = {
  freq: number;
  startOffset: number;
  duration: number;
  type: OscillatorType;
  peakGain: number;
  glideTo?: number;
  attack?: number;
};

function tone(opts: ToneOpts) {
  const c = getCtx();
  if (!c) return;
  const { freq, startOffset, duration, type, peakGain, glideTo, attack = 0.008 } = opts;
  const now = c.currentTime + startOffset;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (glideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, now + duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// ---- Acerto ----------------------------------------------------------------
// Arpejo maior C5-E5-G5 (acorde de Dó), curto e brilhante. Um sine + um
// triangle pra ganhar corpo sem virar 8-bit.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;

export function playCorrect() {
  // base
  tone({ freq: C5, startOffset: 0,    duration: 0.18, type: "sine",     peakGain: 0.18 });
  tone({ freq: E5, startOffset: 0.05, duration: 0.18, type: "sine",     peakGain: 0.16 });
  tone({ freq: G5, startOffset: 0.10, duration: 0.22, type: "sine",     peakGain: 0.2  });
  // shimmer (oitava acima, baixinho)
  tone({ freq: G5 * 2, startOffset: 0.12, duration: 0.16, type: "triangle", peakGain: 0.06 });
}

// ---- Erro ------------------------------------------------------------------
// Triangle no agudo (timbre limpo, descendente) + square no sub pra dar peso
// e ficar audível em fone/celular sem virar buzzer 8-bit. Volume comparável
// ao playCorrect agora (estava 0.12 — quase inaudível em mobile).
export function playWrong() {
  tone({
    freq: 320,
    startOffset: 0,
    duration: 0.26,
    type: "triangle",
    peakGain: 0.28,
    glideTo: 150,
    attack: 0.005,
  });
  tone({
    freq: 160,
    startOffset: 0.01,
    duration: 0.24,
    type: "square",
    peakGain: 0.08,
    glideTo: 80,
    attack: 0.005,
  });
}

// ---- Assets MP3 (cheering, fail) ------------------------------------------
const ASSET_URLS = {
  cheer:
    "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/Kids%20Cheering%20-%20Sound%20Effect%20(HD)%20-%20Gaming%20Sound%20FX%20(youtube).mp3",
  fail:
    "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/Fail%20Sound%20Effect%20-%20Sound%20Effects%20(youtube).mp3",
} as const;

type AssetKey = keyof typeof ASSET_URLS;

const audioCache: Partial<Record<AssetKey, HTMLAudioElement>> = {};

function loadAsset(key: AssetKey): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const cached = audioCache[key];
  if (cached) return cached;
  const a = new Audio(ASSET_URLS[key]);
  a.preload = "auto";
  a.crossOrigin = "anonymous";
  // volume conservador — sons de torcida e fail tendem a ser altos
  a.volume = 0.65;
  audioCache[key] = a;
  return a;
}

function stopAllAssets() {
  for (const k of Object.keys(audioCache) as AssetKey[]) {
    const a = audioCache[k];
    if (!a) continue;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {
      // no-op
    }
  }
}

function playAsset(key: AssetKey) {
  // Crítico: pausa qualquer outro asset ainda tocando — evita que cheer
  // (~5s) ainda esteja rolando quando dispara o fail (ou vice-versa).
  // Bug observado: usuário ouvia cheer + fail simultaneamente quando
  // navegava rápido entre celebrações de telas diferentes.
  stopAllAssets();
  const a = loadAsset(key);
  if (!a) return;
  try {
    a.currentTime = 0;
    void a.play().catch(() => {
      // Autoplay bloqueado: ignora silenciosamente. Próxima chamada
      // após gesture do user (click) tende a funcionar.
    });
  } catch {
    // no-op
  }
}

/** Torcida de crianças — celebração de fim de onboarding e lição bem-sucedida. */
export function playCheer() {
  playAsset("cheer");
}

/** Som de fail — fim de lição com mau resultado. */
export function playFail() {
  playAsset("fail");
}

/** Para todos os áudios MP3 em cache. Útil em unmount/navegação. */
export function stopCelebrationSounds() {
  stopAllAssets();
}
