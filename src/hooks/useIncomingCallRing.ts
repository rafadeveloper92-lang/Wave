import { useEffect, useRef } from 'react';

/**
 * Toque + vibração estilo chamada recebida enquanto `active` (fase incoming).
 * Usa Web Audio (sem ficheiro externo). Em alguns browsers o som só funciona após gesto do utilizador.
 */
export function useIncomingCallRing(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    const playRingPulse = () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        if (!ctxRef.current) ctxRef.current = new Ctx();
        const ctx = ctxRef.current;
        void ctx.resume();

        const ringOnce = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur + 0.05);
        };

        const t = ctx.currentTime;
        ringOnce(440, 0, 0.18);
        ringOnce(550, 0.22, 0.18);
        ringOnce(440, 0.48, 0.18);
        ringOnce(550, 0.7, 0.18);
      } catch {
        /* autoplay ou contexto indisponível */
      }
    };

    playRingPulse();
    intervalRef.current = setInterval(playRingPulse, 2200);

    const buzz = () => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 600]);
      }
    };
    buzz();
    vibrateIntervalRef.current = setInterval(buzz, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(0);
    };
  }, [active]);
}
