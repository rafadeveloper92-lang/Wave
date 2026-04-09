import { useEffect, useRef } from 'react';

function defaultRingUrl() {
  const base = import.meta.env.BASE_URL;
  return base.endsWith('/') ? `${base}sounds/incoming-call.mp3` : `${base}/sounds/incoming-call.mp3`;
}

/**
 * Toque de chamada recebida: ficheiro de áudio em loop + vibração.
 * `VITE_RING_SOUND_URL` substitui o ficheiro em `public/sounds/incoming-call.mp3`.
 * Em alguns browsers o som só inicia após uma interação do utilizador (autoplay).
 */
export function useIncomingCallRing(active: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    const src = import.meta.env.VITE_RING_SOUND_URL?.trim() || defaultRingUrl();
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.85;
    audioRef.current = audio;

    const play = () => {
      void audio.play().catch(() => {
        /* autoplay bloqueado até haver gesto */
      });
    };
    play();

    const buzz = () => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 600]);
      }
    };
    buzz();
    vibrateIntervalRef.current = setInterval(buzz, 2500);

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
      vibrateIntervalRef.current = null;
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(0);
    };
  }, [active]);
}
