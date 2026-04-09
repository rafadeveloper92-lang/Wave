import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getLocalUserId } from '../lib/localUserId';

export type CallKind = 'audio' | 'video';
export type CallPhase = 'idle' | 'incoming' | 'outgoing' | 'connected';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function newCallId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `call_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function parseTurnEnv(): RTCIceServer[] {
  const urls = import.meta.env.VITE_TURN_URLS;
  const user = import.meta.env.VITE_TURN_USERNAME;
  const pass = import.meta.env.VITE_TURN_CREDENTIAL;
  if (!urls?.trim()) return [];
  const list = urls.split(',').map((u: string) => u.trim()).filter(Boolean);
  if (!list.length) return [];
  const base: RTCIceServer = { urls: list };
  if (user && pass) {
    base.username = user;
    base.credential = pass;
  }
  return [base];
}

type SignalPayload =
  | { type: 'offer'; callId: string; from: string; sdp: string; kind: CallKind }
  | { type: 'answer'; callId: string; from: string; sdp: string }
  | { type: 'ice'; callId: string; from: string; candidate: RTCIceCandidateInit }
  | { type: 'hangup'; callId: string; from: string };

function channelName(roomId: string) {
  return `webrtc:${roomId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function useWebRtcCall(roomId: string, opts: { enabled: boolean; isGroup: boolean }) {
  const localUserIdRef = useRef(getLocalUserId());
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [callKind, setCallKind] = useState<CallKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingOfferRef = useRef<{ sdp: string; kind: CallKind; from: string; callId: string } | null>(null);
  const phaseRef = useRef<CallPhase>('idle');
  phaseRef.current = phase;

  const signalingOk = opts.enabled;

  const sendSignal = useCallback(async (payload: SignalPayload) => {
    const ch = channelRef.current;
    if (!ch) return;
    const { error: sendErr } = await ch.send({
      type: 'broadcast',
      event: 'signal',
      payload,
    });
    if (sendErr) {
      console.error('Realtime send failed', sendErr);
      setError('Falha na sinalização. Verifique o Realtime (Broadcast) no Supabase.');
    }
  }, []);

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const q = pendingIceRef.current.splice(0, pendingIceRef.current.length);
    for (const c of q) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn('addIceCandidate', e);
      }
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    callIdRef.current = null;
    pendingOfferRef.current = null;
    pendingIceRef.current = [];
    setPhase('idle');
    setCallKind(null);
    setIsMuted(false);
  }, []);

  const endCall = useCallback(
    async (notify: boolean) => {
      const id = callIdRef.current;
      if (notify && id) {
        await sendSignal({ type: 'hangup', callId: id, from: localUserIdRef.current });
      }
      cleanupMedia();
    },
    [cleanupMedia, sendSignal]
  );

  const attachPcHandlers = useCallback(
    (pc: RTCPeerConnection, currentCallId: string) => {
      pc.ontrack = (ev) => {
        if (ev.streams[0]) {
          remoteStreamRef.current = ev.streams[0];
          setRemoteStream(ev.streams[0]);
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Conexão interrompida.');
        }
        if (pc.connectionState === 'connected') setPhase('connected');
      };
      pc.onicecandidate = (ev) => {
        if (ev.candidate && callIdRef.current === currentCallId) {
          void sendSignal({
            type: 'ice',
            callId: currentCallId,
            from: localUserIdRef.current,
            candidate: ev.candidate.toJSON(),
          });
        }
      };
    },
    [sendSignal]
  );

  const startCall = useCallback(
    async (kind: CallKind) => {
      if (!signalingOk || opts.isGroup) {
        setError(opts.isGroup ? 'Chamadas em grupo ainda não são suportadas.' : 'Configure Supabase (URL e chave) para chamadas.');
        return;
      }
      if (phaseRef.current !== 'idle') return;
      setError(null);
      const callId = newCallId();
      callIdRef.current = callId;
      setCallKind(kind);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: kind === 'video' ? { facingMode: 'user' } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const servers = [...ICE_SERVERS, ...parseTurnEnv()];
        const pc = new RTCPeerConnection({ iceServers: servers });
        pcRef.current = pc;
        attachPcHandlers(pc, callId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal({
          type: 'offer',
          callId,
          from: localUserIdRef.current,
          sdp: offer.sdp!,
          kind,
        });
        setPhase('outgoing');
        await flushPendingIce();
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Não foi possível aceder ao microfone ou câmara.');
        cleanupMedia();
      }
    },
    [signalingOk, opts.isGroup, attachPcHandlers, sendSignal, flushPendingIce, cleanupMedia]
  );

  const acceptCall = useCallback(async () => {
    const pending = pendingOfferRef.current;
    if (!pending || phaseRef.current !== 'incoming') return;
    setError(null);
    const { sdp, kind, callId } = pending;
    pendingOfferRef.current = null;
    callIdRef.current = callId;
    setCallKind(kind);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === 'video' ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const servers = [...ICE_SERVERS, ...parseTurnEnv()];
      const pc = new RTCPeerConnection({ iceServers: servers });
      pcRef.current = pc;
      attachPcHandlers(pc, callId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
      await flushPendingIce();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal({
        type: 'answer',
        callId,
        from: localUserIdRef.current,
        sdp: answer.sdp!,
      });
      setPhase('connected');
      await flushPendingIce();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erro ao atender.');
      await endCall(true);
    }
  }, [attachPcHandlers, sendSignal, flushPendingIce, endCall]);

  const rejectCall = useCallback(async () => {
    const pending = pendingOfferRef.current;
    if (pending) {
      await sendSignal({ type: 'hangup', callId: pending.callId, from: localUserIdRef.current });
    }
    pendingOfferRef.current = null;
    callIdRef.current = null;
    setPhase('idle');
    setCallKind(null);
  }, [sendSignal]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audio = stream.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setIsMuted(!audio.enabled);
    }
  }, []);

  useEffect(() => {
    if (!signalingOk || !roomId) return;

    const ch = supabase.channel(channelName(roomId), {
      config: { broadcast: { ack: false } },
    });
    channelRef.current = ch;

    ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const p = payload as SignalPayload;
      const self = localUserIdRef.current;
      if (!p || typeof p !== 'object') return;

      if (p.type === 'hangup') {
        if (callIdRef.current === p.callId || pendingOfferRef.current?.callId === p.callId) {
          cleanupMedia();
        }
        return;
      }

      if (p.from === self) return;

      if (p.type === 'offer') {
        const ph = phaseRef.current;
        if (ph !== 'idle' && ph !== 'incoming') return;
        if (ph === 'incoming' && pendingOfferRef.current?.callId !== p.callId) return;
        pendingOfferRef.current = { sdp: p.sdp, kind: p.kind, from: p.from, callId: p.callId };
        callIdRef.current = p.callId;
        setCallKind(p.kind);
        setPhase('incoming');
        return;
      }

      if (p.callId !== callIdRef.current) return;

      if (p.type === 'answer') {
        const pc = pcRef.current;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: p.sdp }));
          setPhase('connected');
          await flushPendingIce();
        } catch (e) {
          console.error(e);
          setError('Erro ao processar resposta da chamada.');
        }
        return;
      }

      if (p.type === 'ice') {
        const pc = pcRef.current;
        if (!pc) return;
        if (!pc.remoteDescription) {
          pendingIceRef.current.push(p.candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(p.candidate));
        } catch (e) {
          console.warn('ice', e);
        }
      }
    });

    void ch.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        setError('Canal Realtime indisponível.');
      }
    });

    return () => {
      void ch.unsubscribe();
      channelRef.current = null;
      cleanupMedia();
    };
  }, [signalingOk, roomId, cleanupMedia, flushPendingIce]);

  return {
    phase,
    callKind,
    error,
    isMuted,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall: () => void endCall(true),
    toggleMute,
    clearError: () => setError(null),
    signalingReady: signalingOk && !opts.isGroup,
  };
}
