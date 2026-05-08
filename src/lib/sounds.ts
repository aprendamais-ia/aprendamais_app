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

// ---- Vida regenerada (+1) — sintetizado ----------------------------------
// Pluck de harpa: sine 880Hz único, attack rápido, decay exponencial. Discreto
// (peakGain baixo) — toca em background quando user volta no app.
export function playLifeRegen() {
  tone({
    freq: 880,
    startOffset: 0,
    duration: 0.32,
    type: "sine",
    peakGain: 0.14,
    attack: 0.003,
  });
  // shimmer agudo bem baixinho pra dar brilho
  tone({
    freq: 1760,
    startOffset: 0.02,
    duration: 0.18,
    type: "triangle",
    peakGain: 0.04,
  });
}

// ---- Streak +1 dia — sintetizado -----------------------------------------
// Acendimento rápido. Dois pulses ascendentes (G5 → C6) tipo fósforo riscando.
// Toca no primeiro acerto do dia, quando streak_days incrementa.
export function playStreakTick() {
  tone({ freq: 783.99, startOffset: 0,    duration: 0.12, type: "triangle", peakGain: 0.16 });
  tone({ freq: 1046.5, startOffset: 0.09, duration: 0.18, type: "triangle", peakGain: 0.18 });
  // sub baixinho pra dar peso
  tone({ freq: 130.81, startOffset: 0.02, duration: 0.2,  type: "sine",     peakGain: 0.08 });
}

// ---- Combo de 5 acertos seguidos — sintetizado ---------------------------
// Arpejo C-E-G-C+ subindo, mais alegre que playCorrect. Diferencia da resposta
// normal — tem que ser audível como "combo!".
const C6 = 1046.5;
export function playCombo() {
  tone({ freq: C5,    startOffset: 0,    duration: 0.1,  type: "triangle", peakGain: 0.16 });
  tone({ freq: E5,    startOffset: 0.06, duration: 0.1,  type: "triangle", peakGain: 0.18 });
  tone({ freq: G5,    startOffset: 0.12, duration: 0.12, type: "triangle", peakGain: 0.2  });
  tone({ freq: C6,    startOffset: 0.18, duration: 0.22, type: "sine",     peakGain: 0.22 });
  tone({ freq: C6 * 2, startOffset: 0.2, duration: 0.16, type: "triangle", peakGain: 0.06 });
}

// ---- Tap em CTA principal — sintetizado ----------------------------------
// Pop curtinho. Reservado pros CTAs grandes ("Bora começar", "Concluir lição").
// NÃO usar em todos os botões — vira ruído.
export function playTapCTA() {
  tone({
    freq: 800,
    startOffset: 0,
    duration: 0.06,
    type: "sine",
    peakGain: 0.12,
    glideTo: 1200,
    attack: 0.002,
  });
}

// ---- Assets MP3 ----------------------------------------------------------
// URLs ficam no Supabase Storage (bucket `content`). Quando estiver `null`,
// playAsset() é no-op silencioso — útil pra ir mergeando código antes do
// asset estar pronto.
//
// Briefs pro Nick (sound engineer) produzir. Formato: WAV 44.1kHz mono ou
// stereo, normalizar a -3dBFS, exportar MP3 192kbps. Subir no bucket
// `content` e colar URL aqui.
const ASSET_URLS: Record<AssetKey, string | null> = {
  cheer:
    "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/Kids%20Cheering%20-%20Sound%20Effect%20(HD)%20-%20Gaming%20Sound%20FX%20(youtube).mp3",
  fail:
    "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/Fail%20Sound%20Effect%20-%20Sound%20Effects%20(youtube).mp3",

  // Promoção de divisão (Bronze I → II): ~0.8s. Sweep ascendente synth-brass +
  // sino agudo no final. Pico 700-1200Hz. Vibe "ding! achievement", curto e
  // satisfatório. Mais leve que tierUp.
  promote: "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/play-promote.mp3",

  // Mudança de metal (Bronze III → Prata I): ~1.8s. Coral/strings + sino grave
  // longo + shimmer agudo. Vibe "title screen de RPG". Momento WOW da segunda
  // de manhã.
  tierUp: "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/play-tierup.mp3",

  // Rebaixamento: ~0.6s. Strings descendentes em menor + bumbo abafado. NÃO
  // pode ser punitivo — meio melancólico, "puxa, perdeu". Evitar square wave.
  demote: "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/play-demote.mp3",

  // Streak milestone (7/30/100 dias): ~2s. Versão grande de playStreakTick.
  // Coral + sinos + sub. Reservado pros marcos — não toca todo dia.
  streakMilestone: "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/play-milestone.mp3",

  // Conquista desbloqueada: ~1.2s. Sino + reverb longo + swoosh de partículas.
  // Diferenciar de promote — vibe "descobriu algo".
  achievement: "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/play-achievement.mp3",

  // Vidas a 0 (perda crítica): ~0.5s. Versão dramática de playWrong + thud
  // grave + glass crack sutil. SÓ toca quando lives chegam a 0, não em
  // todo erro.
  lifeLost: "https://dulebjartlpxpshjprzz.supabase.co/storage/v1/object/public/content/play-lifelost.mp3",
};

type AssetKey =
  | "cheer"
  | "fail"
  | "promote"
  | "tierUp"
  | "demote"
  | "streakMilestone"
  | "achievement"
  | "lifeLost";

const audioCache: Partial<Record<AssetKey, HTMLAudioElement>> = {};

function loadAsset(key: AssetKey): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const url = ASSET_URLS[key];
  if (!url) return null;
  const cached = audioCache[key];
  if (cached) return cached;
  const a = new Audio(url);
  a.preload = "auto";
  a.crossOrigin = "anonymous";
  // volume conservador — sons de celebração tendem a ser altos
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

/** Promoção dentro do mesmo metal (Bronze I → Bronze II). */
export function playPromote() {
  playAsset("promote");
}

/** Mudança de metal (Bronze III + top 10 → Prata I). Maior, mais épico. */
export function playTierUp() {
  playAsset("tierUp");
}

/** Rebaixamento de divisão. */
export function playDemote() {
  playAsset("demote");
}

/** Marco de streak (7/30/100 dias). */
export function playStreakMilestone() {
  playAsset("streakMilestone");
}

/** Conquista desbloqueada. */
export function playAchievement() {
  playAsset("achievement");
}

/** Vidas chegaram a 0 — versão dramática do playWrong. */
export function playLifeLost() {
  playAsset("lifeLost");
}

/** Para todos os áudios MP3 em cache. Útil em unmount/navegação. */
export function stopCelebrationSounds() {
  stopAllAssets();
}
