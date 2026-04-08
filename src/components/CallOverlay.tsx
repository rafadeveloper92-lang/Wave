import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, MicOff, Video as VideoIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { CallKind, CallPhase } from '../hooks/useWebRtcCall';

type Props = {
  visible: boolean;
  phase: CallPhase;
  kind: CallKind | null;
  peerName: string;
  peerAvatar: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  error: string | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onDismissError: () => void;
};

export default function CallOverlay({
  visible,
  phase,
  kind,
  peerName,
  peerAvatar,
  localStream,
  remoteStream,
  isMuted,
  error,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onDismissError,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) {
      el.srcObject = localStream;
      void el.play().catch(() => {});
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (el && remoteStream) {
      el.srcObject = remoteStream;
      void el.play().catch(() => {});
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [remoteStream]);

  const isVideo = kind === 'video';
  const showRemoteVideo = isVideo && remoteStream && phase === 'connected';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] bg-[#020617] flex flex-col"
        >
          {error && (
            <div className="absolute top-4 left-4 right-4 z-30 px-4 py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-sm text-red-200 flex justify-between items-center gap-2">
              <span>{error}</span>
              <button type="button" onClick={onDismissError} className="shrink-0 text-white/80 underline text-xs">
                Fechar
              </button>
            </div>
          )}

          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {showRemoteVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-6 px-8">
                <div className="relative">
                  <img
                    src={peerAvatar}
                    alt=""
                    className={cn(
                      'rounded-full object-cover border-4 border-brand/30 shadow-[0_0_40px_rgba(45,212,191,0.25)]',
                      phase === 'connected' && isVideo ? 'w-32 h-32' : 'w-40 h-40'
                    )}
                    referrerPolicy="no-referrer"
                  />
                  {(phase === 'outgoing' || phase === 'incoming') && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand/20 text-brand text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      {phase === 'outgoing' ? 'Chamando…' : 'Chamada recebida'}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black text-white">{peerName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {phase === 'connected'
                      ? isVideo
                        ? 'Conectado em vídeo'
                        : 'Chamada de voz'
                      : kind === 'video'
                        ? 'Vídeo'
                        : 'Voz'}
                  </p>
                </div>
              </div>
            )}

            {isVideo && localStream && phase !== 'idle' && (
              <div className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-black">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              </div>
            )}
          </div>

          <div className="p-8 pb-12 flex flex-col items-center gap-6 bg-gradient-to-t from-black/80 to-transparent">
            {phase === 'incoming' && (
              <div className="flex gap-6 w-full max-w-xs">
                <button
                  type="button"
                  onClick={onReject}
                  className="flex-1 py-4 rounded-2xl bg-red-500/20 text-red-400 font-bold border border-red-500/30"
                >
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  className="flex-1 py-4 rounded-2xl bg-brand text-[#020617] font-black"
                >
                  Atender
                </button>
              </div>
            )}

            {(phase === 'outgoing' || phase === 'connected') && (
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center border transition-colors',
                    isMuted ? 'bg-white/10 border-white/20 text-gray-400' : 'bg-white/10 border-white/20 text-white'
                  )}
                  aria-label={isMuted ? 'Ativar microfone' : 'Silenciar'}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
                  aria-label="Encerrar chamada"
                >
                  <PhoneOff size={28} className="text-white" />
                </button>
                {isVideo && (
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-brand">
                    <VideoIcon size={22} />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
