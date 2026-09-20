/**
 * Original 40s score for the Stockify film. Not sourced from any commercial recording.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;
const DURATION = 40;
const N = SAMPLE_RATE * DURATION;
const L = new Float64Array(N);
const R = new Float64Array(N);
const sin = (t, f) => Math.sin(2 * Math.PI * f * t);

function add(i, l, r = l) {
  if (i < 0 || i >= N) return;
  L[i] += l;
  R[i] += r;
}

function impact(t0, freq, amp, decay) {
  const start = Math.floor(t0 * SAMPLE_RATE);
  const len = Math.floor(1.6 * SAMPLE_RATE);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const e = Math.exp(-t * decay);
    add(start + i, amp * e * (sin(t, freq) * 0.65 + sin(t, freq * 0.5) * 0.28), amp * e * 0.9);
  }
}

function whoosh(t0, amp = 0.06) {
  const start = Math.floor(t0 * SAMPLE_RATE);
  const len = Math.floor(0.38 * SAMPLE_RATE);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.sin(Math.PI * (i / len)) ** 1.4;
    const s = amp * env * (sin(t, 140 + 280 * (i / len)) * 0.3 + (Math.random() * 2 - 1) * 0.22);
    add(start + i, s, s * 0.88);
  }
}

function tick(t0, amp = 0.02) {
  const start = Math.floor(t0 * SAMPLE_RATE);
  for (let i = 0; i < 360; i++) {
    const t = i / SAMPLE_RATE;
    const e = Math.exp(-t * 200);
    add(start + i, amp * e * sin(t, 2400), amp * e * sin(t, 2100));
  }
}

for (let i = 0; i < N; i++) {
  const t = i / SAMPLE_RATE;
  const fadeIn = Math.min(1, t / 1.6);
  const fadeOut = t > 37.6 ? Math.max(0, 1 - (t - 37.6) / 2.2) : 1;
  const env = fadeIn * fadeOut;
  const swell = 0.7 + 0.3 * sin(t, 0.055);
  const drone = 0.11 * sin(t, 55) + 0.07 * sin(t, 82.4) + 0.035 * sin(t, 110);
  const air = (Math.random() * 2 - 1) * 0.005 * swell;
  const pulse = t % 2 < 0.012 ? Math.exp(-((t % 2) * 90)) * 0.03 * sin(t, 164) : 0;
  const lift = t > 30 ? ((t - 30) / 9) * 0.045 * sin(t, 220) : 0;
  const m = env * (drone * swell + air + pulse + lift);
  L[i] += m * 0.95;
  R[i] += m * 0.88 + env * drone * 0.02;
}

[1.05, 4.15, 8.15, 12.15, 16.85, 22.15, 26.15, 30.15, 33.55].forEach((t) => whoosh(t, 0.055));
[1.15, 8.3, 12.4, 17.2, 22.4, 26.4].forEach((t) => impact(t, 62, 0.16, 5.5));
impact(37.15, 48, 0.32, 4.2);
for (let t = 17.4; t < 21.6; t += 0.28) tick(t, 0.014);
for (let t = 22.8; t < 25.4; t += 0.22) tick(t, 0.016);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = peak > 0 ? 0.82 / peak : 1;
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), i * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), i * 4 + 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);

const wav = Buffer.concat([header, pcm]);
const here = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.resolve(here, "..", "..", "audio");
const publicAudio = path.resolve(here, "..", "..", "public", "audio");
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(publicAudio, { recursive: true });
fs.writeFileSync(path.join(audioDir, "music.wav"), wav);
fs.writeFileSync(path.join(publicAudio, "score.wav"), wav);
console.log("wrote 40s score", "gain", gain.toFixed(3));
