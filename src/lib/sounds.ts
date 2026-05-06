// Síntese de sons curtos via Web Audio API. Sem assets externos —
// notas geradas em runtime. AudioContext é lazy porque o browser exige
// gesture do user antes de inicializar.

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

function tone(
  frequency: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number,
  glideTo?: number,
) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + startOffset;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (glideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, now + duration);
  }
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// Acerto: dois tons ascendentes (A5 → E6), sine wave, pleasant
export function playCorrect() {
  tone(880, 0, 0.14, "sine", 0.22);
  tone(1318.51, 0.1, 0.22, "sine", 0.2);
}

// Erro: descida rápida, square wave, dissonante mas curto
export function playWrong() {
  tone(220, 0, 0.22, "square", 0.12, 110);
}
