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

function unlockAudioPlayback() {
  void audioCtx?.resume();
  for (const audio of remoteAudio.values()) {
    audio.muted = !listening;
    void audio.play().catch(() => undefined);
  }
}

function applyListenMute() {
  for (const audio of remoteAudio.values()) {
    audio.muted = !listening;
    if (listening) void audio.play().catch(() => undefined);
  }
}

function attachLocalTracks(pc: RTCPeerConnection) {
  if (!mediaStream) return;
  const senders = pc.getSenders();
  for (const track of mediaStream.getTracks()) {
    if (!senders.some((s) => s.track?.id === track.id)) {
      pc.addTrack(track, mediaStream);
    }
  }
}

async function ensurePc(peerId: string): Promise<RTCPeerConnection> {
  let pc = peers.get(peerId);
  if (pc) {
    attachLocalTracks(pc);
    return pc;
  }

  pc = new RTCPeerConnection(ICE);
  peers.set(peerId, pc);
  attachLocalTracks(pc);

  pc.onicecandidate = (e) => {
    if (e.candidate) signal(peerId, { type: "ice", candidate: e.candidate });
  };

  pc.ontrack = (e) => {
    let audio = remoteAudio.get(peerId);
    if (!audio) {
      audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      document.body.appendChild(audio);
      remoteAudio.set(peerId, audio);
    }
    audio.srcObject = e.streams[0] || new MediaStream([e.track]);
    audio.muted = !listening;
    void audio.play().catch(() => undefined);
  };

  pc.onnegotiationneeded = () => {
    if (speaking) void callPeerAsSpeaker(peerId);
  };

  pc.onconnectionstatechange = () => {
    if (pc!.connectionState === "failed" || pc!.connectionState === "closed") {
      teardownPeer(peerId);
    }
  };

  return pc;
}

/** Speaker always sends an offer so listeners can hear (UUID order must not block this). */
async function callPeerAsSpeaker(peerId: string) {
  if (peerId === myId || !speaking) return;
  const pc = await ensurePc(peerId);
  if (makingOffer.get(peerId)) return;
  if (pc.signalingState !== "stable") return;

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

async function prepareToHear(peerId: string) {
  if (peerId === myId) return;
  await ensurePc(peerId);
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
      unlockAudioPlayback();
    } else if (data.type === "answer") {
      await pc.setRemoteDescription(data.sdp);
      unlockAudioPlayback();
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
    if (micOn) {
      void prepareToHear(playerId);
      if (speaking) void callPeerAsSpeaker(playerId);
    } else {
      teardownPeer(playerId);
    }
  });

  s.on("voice:peer-left", ({ playerId }: { playerId: string }) => {
    teardownPeer(playerId);
  });

  s.on("room:update", (room: { players?: { id: string; micOn?: boolean }[] }) => {
    for (const p of room.players || []) {
      if (p.id === myId) continue;
      if (speaking) void callPeerAsSpeaker(p.id);
      else if (listening && p.micOn) void prepareToHear(p.id);
    }
  });
}

async function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  await audioCtx.resume();
}

/** Turn mic ON/OFF — only you transmit when ON; others hear if their listen is ON. */
export async function setSpeaking(
  on: boolean,
  playerId: string,
  roomPeerIds: string[] = [],
): Promise<boolean> {
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

  try {
    if (!mediaStream?.active) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
    }
    await ensureAudioContext();
    const source = audioCtx!.createMediaStreamSource(mediaStream);
    analyser = audioCtx!.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    if (!rafId) pumpLevels();
    unlockAudioPlayback();

    for (const id of roomPeerIds) {
      if (id !== myId) await callPeerAsSpeaker(id);
    }
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
  if (on) unlockAudioPlayback();
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
  unlockAudioPlayback();
  for (const id of speakerIds) {
    if (id !== myId) await prepareToHear(id);
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

export async function enableVoice(
  playerId: string,
  _activeSpeakerIds: string[] = [],
  roomPeerIds: string[] = _activeSpeakerIds,
) {
  const ok = await setSpeaking(true, playerId, roomPeerIds);
  if (ok) await connectToSpeakers(playerId, _activeSpeakerIds);
  return ok;
}

export function isVoiceEnabled() {
  return isSpeaking();
}
