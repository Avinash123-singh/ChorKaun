/** Voice: separate SPEAK (transmit) and LISTEN (hear others). */

import { getSocket } from "./api";

let mediaStream: MediaStream | null = null;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let rafId = 0;
let levelListeners = new Set<(level: number) => void>();
let myId = "";
let speaking = false;
let listening = true;

const peers = new Map<string, RTCPeerConnection>();
const remoteAudio = new Map<string, HTMLAudioElement>();
const makingOffer = new Map<string, boolean>();

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function notify(level: number) {
  levelListeners.forEach((fn) => fn(level));
}

function pumpLevels() {
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  notify(sum / data.length / 255);
  rafId = requestAnimationFrame(pumpLevels);
}

function signal(to: string, data: unknown) {
  getSocket()?.emit("rtc:signal", { to, data });
}

function shouldInitiate(peerId: string) {
  return myId.localeCompare(peerId) < 0;
}

function applyListenMute() {
  for (const audio of remoteAudio.values()) {
    audio.muted = !listening;
    if (listening) void audio.play().catch(() => undefined);
  }
}

async function ensurePc(peerId: string): Promise<RTCPeerConnection> {
  let pc = peers.get(peerId);
  if (pc) return pc;

  pc = new RTCPeerConnection(ICE);
  peers.set(peerId, pc);

  mediaStream?.getTracks().forEach((t) => pc!.addTrack(t, mediaStream!));

  pc.onicecandidate = (e) => {
    if (e.candidate) signal(peerId, { type: "ice", candidate: e.candidate });
  };

  pc.ontrack = (e) => {
    let audio = remoteAudio.get(peerId);
    if (!audio) {
      audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      document.body.appendChild(audio);
      remoteAudio.set(peerId, audio);
    }
    audio.srcObject = e.streams[0] || new MediaStream([e.track]);
    audio.muted = !listening;
    void audio.play().catch(() => undefined);
  };

  pc.onnegotiationneeded = async () => {
    if (!shouldInitiate(peerId) || !speaking) return;
    try {
      makingOffer.set(peerId, true);
      const offer = await pc!.createOffer();
      await pc!.setLocalDescription(offer);
      signal(peerId, { type: "offer", sdp: pc!.localDescription });
    } catch {
      /* ignore */
    } finally {
      makingOffer.set(peerId, false);
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc!.connectionState === "failed" || pc!.connectionState === "closed") {
      teardownPeer(peerId);
    }
  };

  return pc;
}

async function callPeer(peerId: string) {
  if (peerId === myId) return;
  await ensurePc(peerId);
  if (speaking && shouldInitiate(peerId)) {
    const pc = peers.get(peerId)!;
    try {
      makingOffer.set(peerId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal(peerId, { type: "offer", sdp: pc.localDescription });
    } catch {
      /* ignore */
    } finally {
      makingOffer.set(peerId, false);
    }
  }
}

async function handleSignal(from: string, data: any) {
  if (from === myId) return;
  const pc = await ensurePc(from);
  const polite = !shouldInitiate(from);

  try {
    if (data.type === "offer") {
      const offerCollision = makingOffer.get(from) || pc.signalingState !== "stable";
      if (offerCollision && !polite) return;
      await pc.setRemoteDescription(data.sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal(from, { type: "answer", sdp: pc.localDescription });
    } else if (data.type === "answer") {
      await pc.setRemoteDescription(data.sdp);
    } else if (data.type === "ice" && data.candidate) {
      try {
        await pc.addIceCandidate(data.candidate);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

function teardownPeer(peerId: string) {
  peers.get(peerId)?.close();
  peers.delete(peerId);
  makingOffer.delete(peerId);
  const a = remoteAudio.get(peerId);
  if (a) {
    a.srcObject = null;
    a.remove();
    remoteAudio.delete(peerId);
  }
}

function wireSocketHandlers() {
  const s = getSocket();
  if (!s || (s as any)._rtcWired) return;
  (s as any)._rtcWired = true;

  s.on("rtc:signal", ({ from, data }: { from: string; data: unknown }) => {
    void handleSignal(from, data);
  });

  s.on("voice:peer-mic", ({ playerId, micOn }: { playerId: string; micOn: boolean }) => {
    if (playerId === myId) return;
    if (micOn) void callPeer(playerId);
    if (!micOn) teardownPeer(playerId);
  });

  s.on("voice:peer-left", ({ playerId }: { playerId: string }) => {
    teardownPeer(playerId);
  });

  s.on("room:update", (room: { players?: { id: string; micOn?: boolean }[] }) => {
    for (const p of room.players || []) {
      if (p.id !== myId && p.micOn && !peers.has(p.id)) void callPeer(p.id);
    }
  });
}

async function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    await audioCtx.resume();
  }
}

/** Turn mic ON/OFF — only you transmit when ON; others hear if their listen is ON. */
export async function setSpeaking(on: boolean, playerId: string): Promise<boolean> {
  myId = playerId;
  wireSocketHandlers();
  speaking = on;

  if (!on) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    mediaStream?.getTracks().forEach((t) => t.stop());
    mediaStream = null;
    analyser = null;
    notify(0);
    return true;
  }

  if (mediaStream?.active) return true;

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    await ensureAudioContext();
    const source = audioCtx!.createMediaStreamSource(mediaStream);
    analyser = audioCtx!.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    pumpLevels();
    for (const id of peers.keys()) void callPeer(id);
    return true;
  } catch {
    speaking = false;
    mediaStream = null;
    return false;
  }
}

/** Turn hearing ON/OFF — when OFF you hear nobody; play quietly when ON. */
export function setListening(on: boolean) {
  listening = on;
  applyListenMute();
}

export function isSpeaking() {
  return speaking && !!mediaStream?.active;
}

export function isListening() {
  return listening;
}

export async function connectToSpeakers(playerId: string, speakerIds: string[]) {
  myId = playerId;
  wireSocketHandlers();
  for (const id of speakerIds) {
    if (id !== myId) await callPeer(id);
  }
}

export function disableVoice() {
  speaking = false;
  listening = true;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  for (const id of [...peers.keys()]) teardownPeer(id);
  mediaStream?.getTracks().forEach((t) => t.stop());
  mediaStream = null;
  analyser = null;
  void audioCtx?.close();
  audioCtx = null;
  notify(0);
}

export function subscribeVoiceLevel(fn: (level: number) => void): () => void {
  levelListeners.add(fn);
  return () => {
    levelListeners.delete(fn);
  };
}

// Legacy aliases
export async function enableVoice(playerId: string, peerIds: string[] = []) {
  const ok = await setSpeaking(true, playerId);
  if (ok) await connectToSpeakers(playerId, peerIds);
  return ok;
}

export function isVoiceEnabled() {
  return isSpeaking();
}
