#!/usr/bin/env python3
"""Synthesises every sound of the game: ORIGINAL music and effects.

Nothing here is sampled or transcribed from the real game - the pieces are
new compositions written in the same spirit (a creepy music-box waltz for the
menu, three frantic orchestral chase loops, a detuned carnival calliope...).

usage: python3 tools/gen_audio.py   (needs numpy, scipy and ffmpeg)
"""
import math
import pathlib
import subprocess
import tempfile
import wave

import numpy as np
from scipy import signal

SR = 44100
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_MUSIC = ROOT / "audio" / "music"
OUT_SFX = ROOT / "audio" / "sfx"
rng = np.random.default_rng(1234)


# ----------------------------------------------------------------- utils --
def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def n2m(name):
    """'C#4' -> midi number"""
    if name[1:2] in "#b" and len(name) > 2:
        p, o = name[:2], name[2:]
    else:
        p, o = name[:1], name[1:]
    return 12 * (int(o) + 1) + NOTE[p]


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.1, sr=SR):
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0, 1, max(a_n, 1), endpoint=False),
        np.linspace(1, s, max(d_n, 1), endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n].astype(np.float32)


def lowpass(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    b, a = signal.butter(order, fc / (SR / 2), "low")
    return signal.lfilter(b, a, x).astype(np.float32)


def highpass(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x).astype(np.float32)


def bandpass(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], "band")
    return signal.lfilter(b, a, x).astype(np.float32)


def noise(n):
    return rng.uniform(-1, 1, n).astype(np.float32)


def saw(phase):
    return (2.0 * (phase % 1.0) - 1.0).astype(np.float32)


def reverb(x, seconds=1.8, mix=0.25, damp=3500.0, pre=0.012):
    n = int(seconds * SR)
    ir = noise(n) * np.exp(-np.linspace(0, 7.0, n)).astype(np.float32)
    ir = lowpass(ir, damp)
    ir = np.concatenate([np.zeros(int(pre * SR), np.float32), ir])
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    if x.ndim == 1:
        wet = signal.fftconvolve(x, ir)[: len(x)]
        return (x * (1 - mix) + wet * mix * 0.9).astype(np.float32)
    out = np.zeros_like(x)
    for c in range(x.shape[1]):
        irc = np.roll(ir, c * 37)
        wet = signal.fftconvolve(x[:, c], irc)[: len(x)]
        out[:, c] = x[:, c] * (1 - mix) + wet * mix * 0.9
    return out


def normalize(x, peak=0.89):
    m = np.max(np.abs(x)) + 1e-9
    return (x / m * peak).astype(np.float32)


def write_ogg(path, x, quality=5, mono32k=False):
    """mono32k: long loops (music, ambience) are stored as 32 kHz mono. Browsers
    keep every played sound fully decoded (float32), so this cuts their memory
    to about a third; on phone speakers the difference is hard to hear."""
    path.parent.mkdir(parents=True, exist_ok=True)
    x = np.clip(x, -1, 1)
    ch = 1 if x.ndim == 1 else x.shape[1]
    pcm = (x * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
        tmp = tf.name
    with wave.open(tmp, "wb") as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    extra = ["-ac", "1", "-ar", "32000"] if mono32k else []
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, *extra, "-c:a", "libvorbis", "-q:a", str(quality), str(path)], check=True)
    pathlib.Path(tmp).unlink()
    print(f"  {path.relative_to(ROOT)}  {len(x) / SR:5.1f}s")


# ----------------------------------------------------------- instruments --
def inst_musicbox(f, dur, vel=1.0):
    t = t_arr(dur + 1.2)
    out = np.zeros_like(t, dtype=np.float32)
    for ratio, amp, dec in [(1, 1.0, 2.2), (2.0, 0.25, 3.5), (3.0, 0.08, 5.0), (5.4, 0.12, 7.0), (8.9, 0.05, 9.0)]:
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    out *= np.minimum(1.0, t / 0.002)
    return out * vel * 0.5


def inst_piano(f, dur, vel=1.0):
    t = t_arr(dur + 1.5)
    out = np.zeros_like(t, dtype=np.float32)
    B = 0.0004
    for k in range(1, 10):
        fk = f * k * math.sqrt(1 + B * k * k)
        if fk > SR / 2.2:
            break
        amp = (1.0 / k ** 1.1) * (0.7 + 0.3 * vel)
        dec = 1.2 + k * 0.45 + f / 900.0
        out += amp * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * dec)
    rel = np.ones_like(t)
    rn = int(dur * SR)
    if rn < len(t):
        rel[rn:] = np.exp(-np.arange(len(t) - rn) / (0.12 * SR))
    hammer = lowpass(noise(len(t)), 3000) * np.exp(-t * 60) * 0.2
    return (out * rel + hammer) * vel * 0.35 * np.minimum(1.0, t / 0.003)


def inst_pizz(f, dur, vel=1.0):
    # Karplus-Strong plucked string
    n = int((dur + 0.6) * SR)
    period = max(2, int(SR / f))
    buf = noise(period) * 0.8
    out = np.zeros(n, np.float32)
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = 0.996 * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    out = lowpass(out, 2500 + f * 2)
    env = np.exp(-np.arange(n) / (0.35 * SR))
    return out * env * vel * 0.6


def inst_strings(f, dur, vel=1.0, attack=0.12, release=0.25, bright=4000.0, vib=5.2):
    t = t_arr(dur + release)
    vibrato = 1 + 0.004 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.4)
    out = np.zeros_like(t, dtype=np.float32)
    for det in (-0.006, 0.0, 0.0055):
        ph = np.cumsum(f * (1 + det) * vibrato) / SR
        out += saw(ph + rng.random())
    out = lowpass(out / 3.0, min(bright, f * 8 + 800), 2)
    env = adsr(len(t), attack, 0.1, 0.85, release)
    return out * env * vel * 0.32


def inst_spiccato(f, dur, vel=1.0):
    d = min(dur, 0.16)
    x = inst_strings(f, d, vel, attack=0.006, release=0.06, bright=5000)
    return x * 1.3


def inst_brass(f, dur, vel=1.0, attack=0.03):
    t = t_arr(dur + 0.15)
    n = len(t)
    env = adsr(n, attack, 0.08, 0.75, 0.15)
    bright = np.clip(env * 1.2, 0, 1)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.3)
    ph = np.cumsum(f * vib) / SR
    out = np.zeros(n, np.float32)
    for k in range(1, 16):
        if f * k > SR / 2.3:
            break
        out += np.sin(2 * np.pi * k * ph) * (bright ** (k * 0.35)) / k
    return out * env * vel * 0.34


def inst_timpani(f, dur, vel=1.0):
    t = t_arr(max(dur, 1.6))
    pitch = f * (1 + 0.15 * np.exp(-t * 18))
    ph = np.cumsum(pitch) / SR
    body = np.sin(2 * np.pi * ph) + 0.4 * np.sin(2 * np.pi * ph * 1.5) + 0.25 * np.sin(2 * np.pi * ph * 2.0)
    body *= np.exp(-t * 2.2)
    hit = lowpass(noise(len(t)), 1200) * np.exp(-t * 30) * 0.6
    return (body + hit) * vel * 0.5


def inst_kick(f=55, dur=0.4, vel=1.0):
    t = t_arr(0.45)
    pitch = 45 + 120 * np.exp(-t * 35)
    ph = np.cumsum(pitch) / SR
    return (np.sin(2 * np.pi * ph) * np.exp(-t * 9) + lowpass(noise(len(t)), 2000) * np.exp(-t * 80) * 0.3) * vel * 0.7


def inst_snare(f=200, dur=0.25, vel=1.0):
    t = t_arr(0.3)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.5
    nz = bandpass(noise(len(t)), 1500, 9000) * np.exp(-t * 18)
    return (tone + nz) * vel * 0.5


def inst_hat(f=0, dur=0.08, vel=1.0):
    t = t_arr(0.1)
    return highpass(noise(len(t)), 7000) * np.exp(-t * 60) * vel * 0.25


def inst_cymbal(f=0, dur=2.0, vel=1.0):
    t = t_arr(2.0)
    return highpass(noise(len(t)), 4000) * np.exp(-t * 2.2) * vel * 0.3


def inst_woodblock(f=900, dur=0.1, vel=1.0):
    t = t_arr(0.15)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.6 * t)) * np.exp(-t * 45) * vel * 0.45


def inst_organ(f, dur, vel=1.0):
    t = t_arr(dur + 0.06)
    trem = 1 + 0.25 * np.sin(2 * np.pi * 6.5 * t)
    wob = 1 + 0.006 * np.sin(2 * np.pi * 0.7 * t + f)
    ph = np.cumsum(f * wob) / SR
    out = (np.sin(2 * np.pi * ph) + 0.6 * np.sin(4 * np.pi * ph) + 0.35 * np.sin(6 * np.pi * ph)
           + 0.2 * np.sin(8 * np.pi * ph) + 0.15 * np.sin(2 * np.pi * ph * 1.003))
    breath = bandpass(noise(len(t)), f, f * 4) * 0.08
    env = adsr(len(t), 0.015, 0.05, 0.9, 0.05)
    return (out * trem + breath) * env * vel * 0.18


def inst_tuba(f, dur, vel=1.0):
    t = t_arr(dur + 0.08)
    ph = np.cumsum(np.full(len(t), f)) / SR
    out = np.sin(2 * np.pi * ph) + 0.5 * np.sin(4 * np.pi * ph) + 0.25 * np.sin(6 * np.pi * ph)
    return out * adsr(len(t), 0.02, 0.1, 0.6, 0.08) * vel * 0.38


def inst_glock(f, dur, vel=1.0):
    t = t_arr(1.5)
    out = np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    return out * vel * 0.3


def inst_bass(f, dur, vel=1.0):
    t = t_arr(dur + 0.1)
    out = np.sin(2 * np.pi * f * t) + 0.3 * saw(f * t) * 0.5
    return lowpass(out, 600) * adsr(len(t), 0.005, 0.15, 0.6, 0.08) * vel * 0.5


def inst_tremolo(f, dur, vel=1.0):
    x = inst_strings(f, dur, vel, attack=0.05, release=0.2, bright=6000)
    t = np.arange(len(x)) / SR
    return x * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 7.5 * t)))


INST = {
    "musicbox": inst_musicbox, "piano": inst_piano, "pizz": inst_pizz, "strings": inst_strings,
    "spicc": inst_spiccato, "brass": inst_brass, "timp": inst_timpani, "kick": inst_kick,
    "snare": inst_snare, "hat": inst_hat, "cym": inst_cymbal, "wood": inst_woodblock,
    "organ": inst_organ, "tuba": inst_tuba, "glock": inst_glock, "bass": inst_bass, "trem": inst_tremolo,
}


class Song:
    def __init__(self, bpm, beats, tail=2.0):
        self.bpm = bpm
        self.spb = 60.0 / bpm
        self.length = beats * self.spb
        n = int((self.length + tail) * SR)
        self.buf = np.zeros((n, 2), np.float32)
        self.cache = {}

    def note(self, inst, beat, dur_beats, m, vel=1.0, pan=0.0):
        key = (inst, round(dur_beats, 3), m if isinstance(m, int) else round(m, 2), round(vel, 2))
        if key not in self.cache:
            f = midi(m) if m else 0
            self.cache[key] = INST[inst](f, dur_beats * self.spb, vel)
        x = self.cache[key]
        s = int(beat * self.spb * SR)
        e = min(len(self.buf), s + len(x))
        if s >= len(self.buf):
            return
        l = math.cos((pan + 1) * math.pi / 4)
        r = math.sin((pan + 1) * math.pi / 4)
        self.buf[s:e, 0] += x[: e - s] * l
        self.buf[s:e, 1] += x[: e - s] * r

    def seq(self, inst, notes, start=0.0, vel=1.0, pan=0.0, octave_shift=0):
        """notes: list of (name_or_None, beats)."""
        b = start
        for nm, d in notes:
            if nm:
                for one in nm.split("+"):
                    self.note(inst, b, d, n2m(one) + octave_shift, vel, pan)
            b += d
        return b

    def render(self, loop=True, rev=0.22, rev_len=1.8):
        x = reverb(self.buf, rev_len, rev)
        n = int(self.length * SR)
        if loop:
            tail = x[n:]
            body = x[:n].copy()
            m = min(len(tail), n)
            body[:m] += tail[:m]
            x = body
        return normalize(x, 0.85)


# ------------------------------------------------------------------ music --
def music_menu():
    s = Song(96, 48)  # 16 bars of 3/4
    chords = ["D3", "D3", "G2", "A2", "D3", "Bb2", "G2", "A2", "D3", "F2", "G2", "Eb3", "A2", "A2", "D3", "A2"]
    triads = {"D3": ["F4+A4", "F4+A4"], "G2": ["Bb3+D4", "Bb3+D4"], "A2": ["C#4+E4", "C#4+G4"],
              "Bb2": ["Bb3+D4", "D4+F4"], "F2": ["A3+C4", "A3+F4"], "Eb3": ["G3+Bb3", "Eb4+G4"]}
    pads = {"D3": "D4+F4+A4", "G2": "D4+G4+Bb4", "A2": "C#4+E4+A4", "Bb2": "D4+F4+Bb4", "F2": "C4+F4+A4", "Eb3": "Eb4+G4+Bb4"}
    for i, c in enumerate(chords):
        b = i * 3
        s.note("pizz", b, 1, n2m(c) + 0, 0.9, -0.2)
        for k, tri in enumerate(triads[c]):
            for nn in tri.split("+"):
                s.note("pizz", b + 1 + k, 1, n2m(nn), 0.45, 0.25)
        if i >= 4:
            for nn in pads[c].split("+"):
                s.note("strings", b, 3, n2m(nn) - 12, 0.22, 0.0)
    mel = [("D5", 1), ("F5", 1), ("A5", 1), ("G#5", 1.5), ("A5", 0.5), ("F5", 1), ("Bb5", 1), ("A5", 1), ("G5", 1),
           ("E5", 1.5), ("C#5", 0.5), ("E5", 1), ("D5", 1), ("F5", 1), ("A5", 1), ("D6", 1.5), ("C6", 0.5), ("Bb5", 1),
           ("G5", 1), ("Bb5", 0.5), ("A5", 0.5), ("G5", 1), ("A5", 2), (None, 1),
           ("A5", 1), ("F5", 1), ("D5", 1), ("C5", 1), ("F5", 1), ("A5", 1), ("Bb5", 1.5), ("G5", 0.5), ("Bb5", 1),
           ("Eb6", 2), ("D6", 0.5), ("Bb5", 0.5), ("A5", 1), ("F5", 1), ("D5", 1), ("C#5", 1), ("E5", 1), ("G5", 1),
           ("F5", 1), ("E5", 0.5), ("D5", 0.5), ("C#5", 1), ("D5", 2), (None, 1)]
    s.seq("musicbox", mel, 0, 0.9, 0.1)
    # low piano answers on bars 8 and 16
    s.seq("piano", [("A2", 1), ("G#2", 1), ("G2", 1)], 21, 0.5)
    s.seq("piano", [("D2", 1), ("C#2", 1), ("C2", 1)], 45, 0.5)
    for i in range(16):
        s.note("wood", i * 3, 0.25, 84, 0.25, -0.5)
    return s.render(True, 0.3, 2.2)


def chase(seed, bpm, key_root, minor_prog, bars=16, style=1):
    s = Song(bpm, bars * 4)
    r = n2m(key_root)
    prog = [r + o for o in minor_prog]
    for bar in range(bars):
        root = prog[bar % len(prog)]
        b0 = bar * 4
        # 16th-note string ostinato
        pattern = [0, 0, 3, 0, 7, 0, 3, 0, 0, 0, 3, 0, 8, 7, 3, 2] if style == 1 else (
            [0, 12, 0, 7, 0, 12, 0, 6, 0, 12, 0, 7, 3, 2, 1, 0] if style == 2 else
            [0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 7, 6, 3, 1])
        for k, iv in enumerate(pattern):
            s.note("spicc", b0 + k * 0.25, 0.25, root + 12 + iv, 0.75 if k % 4 == 0 else 0.5, -0.3)
        # bass / low piano
        s.note("bass", b0, 1.5, root - 12, 1.0)
        s.note("bass", b0 + 2, 1.5, root - 12, 0.9)
        s.note("piano", b0, 0.5, root - 12, 0.8, 0.2)
        s.note("piano", b0, 0.5, root - 24, 0.8, 0.2)
        # percussion
        s.note("timp", b0, 1, root - 24 + 12, 1.0)
        s.note("kick", b0, 0.5, 36, 0.9)
        s.note("kick", b0 + 2.5, 0.5, 36, 0.7)
        s.note("snare", b0 + 1, 0.5, 38, 0.8)
        s.note("snare", b0 + 3, 0.5, 38, 0.9)
        for k in range(8):
            s.note("hat", b0 + k * 0.5, 0.25, 42, 0.5 if k % 2 else 0.8, 0.4)
        # brass stabs
        if style == 2:
            stabs = [0, 1.5, 3]
        elif style == 3:
            stabs = [0, 0.75, 2.0]
        else:
            stabs = [0, 1.5, 2.5]
        for st in stabs:
            for iv in (0, 3, 7):
                s.note("brass", b0 + st, 0.4, root + iv, 0.8, 0.15)
        if bar % 4 == 3:
            s.note("cym", b0 + 3.5, 1, 49, 0.6)
            for k in range(8):
                s.note("snare", b0 + 2 + k * 0.25, 0.2, 38, 0.3 + k * 0.08)
    # high melody in the second half (original lines)
    lines = {
        1: [("E5", 0.5), ("F5", 0.5), ("E5", 0.5), ("D5", 0.5), ("C5", 1), ("B4", 0.5), ("C5", 0.5), ("A4", 2), ("G#4", 2),
            ("A4", 0.5), ("C5", 0.5), ("E5", 0.5), ("A5", 0.5), ("G#5", 1.5), ("F5", 0.5), ("E5", 2), ("D#5", 1), ("E5", 1)],
        2: [("D5", 0.75), ("F5", 0.25), ("A5", 1), ("G#5", 0.5), ("A5", 0.5), ("Bb5", 1), ("A5", 2), ("F5", 1), ("E5", 1),
            ("D5", 0.5), ("E5", 0.5), ("F5", 0.5), ("G5", 0.5), ("A5", 1.5), ("C#5", 0.5), ("D5", 3)],
        3: [("B4", 1), ("E5", 1), ("G5", 1.5), ("F#5", 0.5), ("E5", 1), ("D#5", 1), ("E5", 2), ("C5", 1), ("B4", 1),
            ("A4", 0.5), ("B4", 0.5), ("C5", 0.5), ("D5", 0.5), ("E5", 2), ("D#5", 1), ("B4", 1)],
    }[style]
    half = bars * 2
    s.seq("trem", lines, half, 0.85, -0.1, 12 if style == 3 else 0)
    s.seq("brass", lines, half + 8, 0.45, 0.2, -12)
    return s.render(True, 0.16, 1.4)


def music_carnival():
    s = Song(138, 48)
    prog = ["C3", "C3", "G2", "G2", "Ab2", "Ab2", "G2", "G2", "C3", "C3", "F2", "F2", "Ab2", "G2", "C3", "G2"]
    chord = {"C3": "Eb4+G4", "G2": "D4+F4", "Ab2": "C4+Eb4", "F2": "C4+Ab4"}
    for i, c in enumerate(prog):
        b = i * 3
        s.note("tuba", b, 1, n2m(c) - 12, 1.0, -0.1)
        for k in (1, 2):
            for nn in chord[c].split("+"):
                s.note("organ", b + k, 0.8, n2m(nn), 0.55, 0.2)
    mel = [("G5", 1), ("C6", 1), ("Eb6", 1), ("D6", 2), ("B5", 1), ("C6", 1), ("G5", 1), ("Eb5", 1), ("D5", 3),
           ("Ab5", 1), ("G5", 1), ("F5", 1), ("Eb5", 2), ("C5", 1), ("D5", 1.5), ("Eb5", 0.5), ("F5", 1), ("G5", 3),
           ("G5", 1), ("C6", 1), ("Eb6", 1), ("F6", 2), ("Eb6", 1), ("D6", 1), ("C6", 1), ("Ab5", 1), ("G5", 3),
           ("F5", 1), ("Ab5", 1), ("C6", 1), ("B5", 1.5), ("Ab5", 0.5), ("G5", 1), ("C5", 3), (None, 3)]
    s.seq("organ", mel, 0, 1.0, 0.0)
    for i in range(0, 48, 6):
        s.note("glock", i + 2.5, 0.5, n2m("G6"), 0.4, 0.6)
    x = s.render(True, 0.35, 2.5)
    # tape wobble
    n = len(x)
    tt = np.arange(n) / SR
    wob = (np.sin(2 * np.pi * 0.35 * tt) * 0.004 + np.sin(2 * np.pi * 2.1 * tt) * 0.0008) * SR
    idx = np.clip(np.arange(n) + wob, 0, n - 1)
    out = np.stack([np.interp(idx, np.arange(n), x[:, c]) for c in range(2)], axis=1)
    return normalize(out.astype(np.float32), 0.8)


def music_intro():
    s = Song(92, 40)
    prog = ["G2", "D3", "E2", "C3", "G2", "D3", "C3", "D3", "E2"]
    tri = {"G2": "B3+D4+G4", "D3": "A3+D4+F#4", "E2": "B3+E4+G4", "C3": "C4+E4+G4"}
    for i, c in enumerate(prog[:8]):
        b = i * 4
        s.note("pizz", b, 1, n2m(c) + 12, 0.8, -0.2)
        s.note("pizz", b + 2, 1, n2m(c) + 19, 0.6, -0.2)
        for k in range(4):
            for nn in tri[c].split("+"):
                s.note("piano", b + k, 0.9, n2m(nn), 0.35 if k else 0.5, 0.2)
    mel = [("D5", 1), ("G5", 1), ("B5", 1.5), ("A5", 0.5), ("G5", 2), ("F#5", 1), ("E5", 1), ("E5", 1), ("G5", 1), ("B5", 1),
           ("D6", 1), ("C6", 2), ("B5", 1), ("A5", 1), ("G5", 1), ("B5", 1), ("D6", 1.5), ("C6", 0.5), ("B5", 1), ("A5", 1),
           ("G5", 1), ("E5", 1), ("C5", 1), ("E5", 1), ("D5", 4)]
    s.seq("musicbox", mel, 0, 0.8, 0.0)
    # the turn: E minor with a dissonant low cluster
    for nn in ["E2", "B2", "E3", "G3", "F3"]:
        s.note("strings", 32, 8, n2m(nn), 0.5, 0.0)
    s.note("piano", 32, 4, n2m("E1"), 0.9)
    s.note("piano", 34, 4, n2m("F1"), 0.7)
    s.note("timp", 32, 2, n2m("E2"), 0.8)
    return s.render(False, 0.28, 2.0)


def music_ending():
    s = Song(60, 26)
    for nn, b in [("D2", 0), ("A2", 0), ("D3", 2), ("F3", 4), ("C#3", 8), ("E3", 8), ("Bb2", 12), ("D3", 12)]:
        s.note("strings", b, 12 - (b % 12) if b < 12 else 8, n2m(nn), 0.6)
    s.seq("musicbox", [("D5", 1.5), ("F5", 1.5), ("A5", 3), ("G#5", 2), ("A5", 1), ("F5", 3), (None, 2), ("D5", 4)], 2, 0.6, 0.2)
    s.seq("piano", [("D2", 2), ("C#2", 2), ("C2", 2), ("B1", 2), ("Bb1", 4)], 8, 0.6)
    s.note("timp", 20, 2, n2m("D2"), 1.0)
    for nn in ["D2", "A2", "D3", "Eb3", "A3"]:
        s.note("brass", 20, 3, n2m(nn), 0.9)
    s.note("cym", 20, 3, 49, 0.8)
    return s.render(False, 0.35, 3.0)


# -------------------------------------------------------------- ambience --
def amb_suburb(dur=32.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    wind = lowpass(noise(n), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * t / dur * 2 + 1.0)) * 0.6
    wind += lowpass(noise(n), 160) * 0.5
    out = np.stack([wind, np.roll(wind, 4000)], axis=1) * 0.35
    # birds: short FM chirps
    for i in range(34):
        st = rng.uniform(0, dur - 1.0)
        f0 = rng.uniform(2600, 4800)
        k = rng.integers(1, 4)
        pan = rng.uniform(-1, 1)
        for j in range(k):
            cl = rng.uniform(0.05, 0.13)
            tt = np.arange(int(cl * SR)) / SR
            sweep = f0 * (1 + rng.uniform(-0.35, 0.35) * tt / cl) * (1 + 0.04 * np.sin(2 * np.pi * 60 * tt))
            ph = np.cumsum(sweep) / SR
            ch = np.sin(2 * np.pi * ph) * np.sin(np.pi * tt / cl) ** 2 * rng.uniform(0.05, 0.14)
            s0 = int((st + j * (cl + 0.05)) * SR)
            e0 = min(n, s0 + len(ch))
            out[s0:e0, 0] += ch[: e0 - s0] * (1 - pan) * 0.5
            out[s0:e0, 1] += ch[: e0 - s0] * (1 + pan) * 0.5
    # distant car passing
    s0 = int(14 * SR)
    ln = int(6 * SR)
    car = lowpass(noise(ln), 700) * np.sin(np.linspace(0, np.pi, ln)) ** 2 * 0.35
    out[s0:s0 + ln, 0] += car * np.linspace(1, 0.2, ln)
    out[s0:s0 + ln, 1] += car * np.linspace(0.2, 1, ln)
    return normalize(reverb(out.astype(np.float32), 1.2, 0.2), 0.5)


def amb_house(dur=20.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = lowpass(noise(n), 120) * 0.4 + np.sin(2 * np.pi * 60 * t) * 0.03 + np.sin(2 * np.pi * 120 * t) * 0.015
    out = tone.astype(np.float32)
    # clock ticks
    for k in range(int(dur)):
        tick = inst_woodblock(2400 if k % 2 else 2000, 0.05, 0.12)
        s0 = int(k * SR)
        out[s0:s0 + len(tick)] += tick[: n - s0] if s0 + len(tick) > n else tick
    for i in range(4):
        st = int(rng.uniform(1, dur - 2) * SR)
        ln = int(0.9 * SR)
        creak = bandpass(noise(ln), 300, 900) * np.sin(np.linspace(0, np.pi, ln)) * 0.25
        out[st:st + ln] += creak
    return normalize(reverb(out, 0.8, 0.25), 0.35)


# ------------------------------------------------------------------ sfx ---
def env_exp(n, k):
    return np.exp(-np.arange(n) / SR * k).astype(np.float32)


def sfx_step(kind):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    if kind == "wood":
        x = lowpass(noise(n), 900) * env_exp(n, 35) + np.sin(2 * np.pi * 110 * t) * env_exp(n, 40) * 0.6
        x += bandpass(noise(n), 1500, 4000) * env_exp(n, 90) * 0.3
    elif kind == "grass":
        x = bandpass(noise(n), 800, 5000) * env_exp(n, 22) * np.minimum(1, t / 0.02)
    elif kind == "neighbor":
        n = int(0.35 * SR)
        t = np.arange(n) / SR
        x = lowpass(noise(n), 500) * env_exp(n, 18) + np.sin(2 * np.pi * 70 * t) * env_exp(n, 16) * 1.2
        x += bandpass(noise(n), 1200, 3500) * env_exp(n, 60) * 0.25
    else:  # splash
        n = int(0.4 * SR)
        x = bandpass(noise(n), 400, 6000) * env_exp(n, 9) * np.minimum(1, np.arange(n) / SR / 0.02)
        x += bandpass(noise(n), 150, 600) * env_exp(n, 14)
    return normalize(x, 0.8)


def creak(dur, f0=180, f1=320, rough=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1 + 0.08 * np.sin(2 * np.pi * 7 * t))
    ph = np.cumsum(f) / SR
    pulses = (np.sin(2 * np.pi * ph) > 0.92).astype(np.float32)
    x = bandpass(pulses + noise(n) * 0.03, 200, 3000) * rough
    x += np.sin(2 * np.pi * ph * 2) * 0.1
    return x * np.sin(np.linspace(0, np.pi, n)) ** 0.5


def thud(dur=0.3, f=90, bright=900, k=16):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return lowpass(noise(n), bright) * env_exp(n, k * 1.5) + np.sin(2 * np.pi * f * t) * env_exp(n, k)


def click(f=3000, dur=0.03):
    n = int(dur * SR)
    return bandpass(noise(n), f * 0.6, f * 1.6) * env_exp(n, 200)


def cat(*parts, gaps=None):
    out = []
    for i, p in enumerate(parts):
        out.append(p)
        if gaps:
            out.append(np.zeros(int(gaps[i] * SR), np.float32))
    return np.concatenate(out).astype(np.float32)


def mix(*parts):
    n = max(len(p[1]) + int(p[0] * SR) for p in parts)
    out = np.zeros(n, np.float32)
    for off, p in parts:
        s0 = int(off * SR)
        out[s0:s0 + len(p)] += p
    return out


def tone(f, dur, k=4.0, shape="sin"):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if shape == "sin":
        x = np.sin(2 * np.pi * f * t)
    elif shape == "sq":
        x = np.sign(np.sin(2 * np.pi * f * t)) * 0.5
    else:
        x = saw(f * t)
    return (x * env_exp(n, k)).astype(np.float32)


def bell(f=880, dur=2.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for r, a, k in [(1, 1, 1.4), (2.0, 0.5, 2.2), (2.76, 0.4, 2.8), (5.4, 0.25, 4), (8.93, 0.12, 6)]:
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k)
    return x.astype(np.float32) * np.minimum(1, t / 0.002)


def voice(segments, f0_curve, dur, breath=0.05, loud=1.0):
    """Tiny formant synthesiser. segments: list of (t_start, F1, F2, F3, amp)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = np.interp(t, *zip(*f0_curve))
    f0 *= 1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) + 0.004 * noise(n)
    ph = np.cumsum(f0) / SR
    src = saw(ph) * 0.6 + (np.mod(ph, 1.0) < 0.12) * 0.8
    src = lowpass(src.astype(np.float32), 4000)
    src += noise(n) * breath
    ts = [s[0] for s in segments]
    F = [np.interp(t, ts, [s[i] for s in segments]) for i in (1, 2, 3)]
    amp = np.interp(t, ts, [s[4] for s in segments])
    block = 256
    out = np.zeros(n, np.float32)
    states = [None, None, None]
    for b0 in range(0, n, block):
        b1 = min(n, b0 + block)
        seg = src[b0:b1]
        acc = np.zeros(b1 - b0, np.float32)
        for i, bw in enumerate((90, 110, 160)):
            fc = float(F[i][b0])
            r = math.exp(-math.pi * bw / SR)
            th = 2 * math.pi * fc / SR
            a = [1, -2 * r * math.cos(th), r * r]
            bcoef = [1 - r]
            if states[i] is None:
                states[i] = signal.lfilter_zi(bcoef, a) * 0
            y, states[i] = signal.lfilter(bcoef, a, seg, zi=states[i])
            acc += y.astype(np.float32) * (1.0, 0.6, 0.3)[i]
        out[b0:b1] = acc * amp[b0:b1]
    return normalize(highpass(out, 80), 0.9 * loud)


def build_sfx():
    S = {}
    S["step_wood"] = sfx_step("wood")
    S["step_grass"] = sfx_step("grass")
    S["step_neighbor"] = sfx_step("neighbor")
    S["splash_step"] = sfx_step("splash")
    S["land"] = normalize(thud(0.4, 70, 700, 12))
    S["door_open"] = normalize(mix((0, click(2500, 0.05)), (0.05, creak(0.7, 200, 380))))
    S["door_close"] = normalize(mix((0, thud(0.35, 100, 1200, 18)), (0.02, click(3500, 0.04) * 0.6)))
    S["door_locked"] = normalize(cat(click(2000, 0.04), click(1800, 0.04), click(2200, 0.05), gaps=[0.06, 0.05, 0]))
    S["unlock"] = normalize(cat(click(3000, 0.03), click(2200, 0.05), gaps=[0.12, 0]))
    S["drawer"] = normalize(bandpass(noise(int(0.4 * SR)), 300, 2500) * np.sin(np.linspace(0, np.pi, int(0.4 * SR))) * 0.6)
    n = int(1.2 * SR)
    shatter = highpass(noise(n), 2500) * env_exp(n, 6)
    for i in range(40):
        s0 = int(rng.uniform(0, 0.9) * SR)
        tk = tone(rng.uniform(3000, 9000), 0.15, 30) * rng.uniform(0.2, 0.6)
        shatter[s0:s0 + len(tk)] += tk[: n - s0]
    S["glass_break"] = normalize(shatter + thud(1.2, 120, 2000, 10) * 0.5)
    S["impact"] = normalize(thud(0.3, 120, 1500, 20))
    S["impact_soft"] = normalize(thud(0.15, 300, 3000, 40)) * 0.7
    S["pickup"] = normalize(mix((0, bandpass(noise(int(0.12 * SR)), 1000, 5000) * env_exp(int(0.12 * SR), 25)), (0.04, tone(880, 0.1, 30) * 0.3)))
    S["throw"] = normalize(bandpass(noise(int(0.3 * SR)), 500, 3000) * np.sin(np.linspace(0, np.pi, int(0.3 * SR))))
    S["slot"] = normalize(click(4000, 0.02)) * 0.5
    S["click"] = normalize(mix((0, click(3000, 0.03)), (0, tone(1200, 0.05, 60) * 0.4))) * 0.7
    S["hover"] = normalize(tone(1800, 0.04, 80)) * 0.3
    # valve: metal squeak + water rush
    v = creak(0.9, 600, 900, 0.8)
    S["valve"] = normalize(mix((0, v), (0.2, bandpass(noise(int(1.0 * SR)), 300, 2000) * np.sin(np.linspace(0, np.pi, int(1.0 * SR))) * 0.4)))
    n = int(2.2 * SR)
    ice = np.zeros(n, np.float32)
    for i in range(70):
        s0 = int(rng.uniform(0, 2.0) * SR)
        c = click(rng.uniform(1500, 7000), 0.02) * rng.uniform(0.2, 1.0)
        ice[s0:s0 + len(c)] += c
    S["freeze"] = normalize(ice + lowpass(noise(n), 300) * env_exp(n, 1.5) * 0.4)
    hum = lambda d, a, b: np.sin(2 * np.pi * np.cumsum(np.linspace(a, b, int(d * SR))) / SR) * 0.3
    S["power_off"] = normalize(mix((0, thud(0.3, 80, 1500, 25)), (0, hum(0.8, 120, 30) * np.linspace(1, 0, int(0.8 * SR)))))
    S["power_on"] = normalize(mix((0, thud(0.3, 80, 1500, 25)), (0.05, hum(0.8, 30, 120) * np.linspace(0, 1, int(0.8 * SR)) * np.linspace(1, 0.3, int(0.8 * SR)))))
    S["switch"] = normalize(cat(click(2500, 0.02), click(1500, 0.03), gaps=[0.04, 0])) * 0.8
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    S["cam_buzz"] = normalize((np.sign(np.sin(2 * np.pi * 330 * tt)) * 0.4 + np.sin(2 * np.pi * 990 * tt) * 0.3) * (np.sin(2 * np.pi * 6 * tt) > 0) * env_exp(n, 1.5))
    S["elevator_ding"] = normalize(mix((0, bell(1318, 1.8)), (0.25, bell(1046, 1.5) * 0.6)))
    n = int(3.0 * SR)
    tt = np.arange(n) / SR
    S["elevator_motor"] = normalize(np.sin(2 * np.pi * 95 * tt) * 0.4 + lowpass(noise(n), 400) * 0.5 + np.sin(2 * np.pi * 190 * tt) * 0.1) * 0.6
    S["elevator_door"] = normalize(mix((0, bandpass(noise(int(0.8 * SR)), 200, 1500) * np.sin(np.linspace(0, np.pi, int(0.8 * SR)))), (0.75, click(2000, 0.04))))
    # train chug loop (2 s): 4 chuffs
    n = int(2.0 * SR)
    tr = np.zeros(n, np.float32)
    for k in range(4):
        s0 = int(k * 0.5 * SR)
        ch = bandpass(noise(int(0.3 * SR)), 300, 2500) * env_exp(int(0.3 * SR), 10) * (1.0 if k % 2 == 0 else 0.7)
        tr[s0:s0 + len(ch)] += ch
        ck = click(1800, 0.03) * 0.6
        tr[s0 + int(0.25 * SR):s0 + int(0.25 * SR) + len(ck)] += ck
    S["train"] = normalize(tr + lowpass(noise(n), 200) * 0.2)
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    wh = (np.sin(2 * np.pi * 740 * tt) + np.sin(2 * np.pi * 932 * tt) * 0.8 + bandpass(noise(n), 600, 1200) * 0.3) * adsr(n, 0.05, 0.1, 0.9, 0.3)
    S["train_whistle"] = normalize(wh)
    n = int(2.0 * SR)
    tt = np.arange(n) / SR
    S["shark_motor"] = normalize(saw(62 * tt) * 0.3 * (0.8 + 0.2 * np.sin(2 * np.pi * 9 * tt)) + bandpass(noise(n), 200, 1500) * 0.3) * 0.6
    S["shark_bite"] = normalize(mix((0, click(3000, 0.05)), (0, thud(0.3, 200, 4000, 25)), (0.02, tone(2200, 0.2, 25) * 0.4)))
    S["splash"] = sfx_step("splash")
    S["dig"] = normalize(mix((0, bandpass(noise(int(0.35 * SR)), 300, 3000) * env_exp(int(0.35 * SR), 9)), (0, click(4000, 0.03) * 0.5)))
    S["coffin_open"] = normalize(mix((0, creak(1.2, 120, 260, 1.0)), (1.0, thud(0.3, 90, 900, 18))))
    S["coffin_slam"] = normalize(reverb(np.pad(thud(1.0, 70, 1600, 5), (0, SR)), 2.0, 0.5))
    S["bell"] = normalize(bell(1175, 2.5) + np.pad(bell(1568, 2.0), (0, int(0.5 * SR))) * 0.5)
    S["magnet"] = normalize(click(3500, 0.03)) * 0.7
    S["paper"] = normalize(bandpass(noise(int(0.7 * SR)), 1500, 7000) * np.abs(np.sin(np.linspace(0, 18, int(0.7 * SR)))) * np.sin(np.linspace(0, np.pi, int(0.7 * SR))))
    S["target_hit"] = normalize(mix((0, bell(1760, 0.6) * 0.6), (0, click(2000, 0.05))))
    S["rifle_shot"] = normalize(mix((0, thud(0.15, 600, 6000, 40)), (0, click(5000, 0.02))))
    S["key_drop"] = normalize(cat(*(bell(rng.uniform(2800, 3600), 0.15) * (0.8 ** i) for i in range(4)), gaps=[0.12, 0.09, 0.07, 0]))
    S["solve"] = normalize(mix(*[(i * 0.12, bell(f, 1.4)) for i, f in enumerate([784, 988, 1175, 1568])]))
    n = int(1.3 * SR)
    jh = np.zeros(n, np.float32)
    for k in range(int(1.2 / 0.045)):
        s0 = int(k * 0.045 * SR)
        hit = thud(0.04, 150, 3000, 120)
        jh[s0:s0 + len(hit)] += hit
    S["jackhammer"] = normalize(jh + bandpass(noise(n), 200, 2000) * 0.3)
    n = int(1.5 * SR)
    crumble = np.zeros(n, np.float32)
    for i in range(50):
        s0 = int(rng.uniform(0, 1.2) * SR)
        th = thud(0.12, rng.uniform(80, 200), 1800, 40) * rng.uniform(0.2, 0.8)
        crumble[s0:s0 + len(th)] += th[: n - s0]
    S["bricks"] = normalize(crumble + lowpass(noise(n), 600) * env_exp(n, 3) * 0.6)
    S["board_pry"] = normalize(mix((0, creak(0.6, 300, 700, 0.8)), (0.55, thud(0.3, 110, 1500, 20)), (0.5, tone(2500, 0.2, 20) * 0.3)))
    S["lockpick"] = normalize(cat(*(click(rng.uniform(2500, 4500), 0.02) for _ in range(6)), gaps=[0.09, 0.12, 0.07, 0.15, 0.1, 0]))
    n = int(2.5 * SR)
    tt = np.arange(n) / SR
    rattle = np.zeros(n, np.float32)
    for k in range(int(2.4 / 0.09)):
        c = click(1500, 0.03) * 0.5
        s0 = int(k * 0.09 * SR)
        rattle[s0:s0 + len(c)] += c
    S["garage_door"] = normalize(rattle + np.sin(2 * np.pi * 110 * tt) * 0.2 * np.sin(np.linspace(0, np.pi, n)))
    S["place_cam"] = normalize(cat(thud(0.15, 200, 2500, 40), click(2500, 0.03), tone(1500, 0.08, 40) * 0.3, gaps=[0.05, 0.08, 0]))
    S["fridge"] = normalize(mix((0, click(1500, 0.05)), (0.05, np.sin(2 * np.pi * 100 * t_arr(1.5)) * 0.15 * env_exp(int(1.5 * SR), 1.5))))
    S["eat"] = normalize(cat(*(bandpass(noise(int(0.08 * SR)), 1500, 6000) * env_exp(int(0.08 * SR), 30) for _ in range(3)), gaps=[0.12, 0.14, 0]))
    S["wake"] = normalize(mix(*[(i * 0.2, bell(f, 1.6) * 0.4) for i, f in enumerate([523, 659, 784])]))
    S["cloth"] = normalize(bandpass(noise(int(0.5 * SR)), 800, 5000) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) * 0.5)
    S["wardrobe"] = normalize(mix((0, creak(0.4, 260, 330, 0.6)), (0.35, thud(0.2, 140, 1500, 30) * 0.6)))
    S["slip"] = normalize(mix((0, tone(1800, 0.25, 4, "saw") * 0.3 * np.linspace(1, 0, int(0.25 * SR))), (0.3, thud(0.6, 60, 900, 8))))
    S["slam"] = normalize(reverb(np.pad(thud(0.6, 80, 2500, 9), (0, SR // 2)), 1.0, 0.35))
    S["basement_creak"] = normalize(creak(2.8, 90, 160, 1.0))
    n = int(4.0 * SR)
    tt = np.arange(n) / SR
    sw = sum(np.sin(2 * np.pi * f * tt) * 0.2 for f in (523, 659, 784, 1046)) * np.linspace(0, 1, n) ** 2
    S["ending_light"] = normalize(reverb((sw + highpass(noise(n), 5000) * 0.05 * np.linspace(0, 1, n)).astype(np.float32), 2.0, 0.4))
    # caught: orchestral hit
    n = int(2.5 * SR)
    hit = np.zeros(n, np.float32)
    for m in (38, 45, 50, 53, 57, 62):
        b = inst_brass(midi(m), 0.6, 1.0)
        hit[: len(b)] += b
    tm = inst_timpani(midi(38), 2.0, 1.0)
    hit[: len(tm)] += tm
    cy = inst_cymbal(0, 2.0, 1.0)
    hit[: len(cy)] += cy
    vio = inst_strings(midi(86), 0.8, 0.9, 0.01, 0.4, 9000, 9.0)
    hit[int(0.05 * SR):int(0.05 * SR) + len(vio)] += vio
    S["caught"] = normalize(reverb(hit, 1.8, 0.3))
    # The Neighbor's voice (formant synth)
    S["n_huh"] = voice([(0, 300, 1100, 2400, 0), (0.05, 280, 1000, 2400, 0.6), (0.25, 600, 1150, 2500, 1.0), (0.45, 650, 1200, 2500, 0.6), (0.55, 650, 1200, 2500, 0)],
                       [(0, 115), (0.3, 118), (0.55, 165)], 0.6, 0.04, 0.8)
    S["n_spot"] = voice([(0, 600, 1700, 2600, 0.0), (0.04, 600, 1700, 2600, 0.3), (0.09, 520, 1850, 2600, 1.0), (0.3, 330, 2200, 2900, 1.0), (0.45, 300, 2300, 3000, 0)],
                        [(0, 150), (0.12, 175), (0.4, 160)], 0.5, 0.25, 1.0)
    laugh = []
    for k in range(3):
        st = k * 0.28
        laugh += [(st, 500, 900, 2400, 0.0), (st + 0.03, 500, 900, 2400, 0.35), (st + 0.07, 450, 800, 2400, 1.0), (st + 0.2, 430, 780, 2400, 0.8), (st + 0.25, 430, 780, 2400, 0.0)]
    S["n_laugh"] = voice(laugh, [(0, 125), (0.3, 118), (0.6, 112), (0.85, 100)], 0.9, 0.2, 0.9)
    S["n_fall"] = voice([(0, 350, 900, 2300, 0), (0.03, 330, 870, 2300, 1.0), (0.2, 300, 850, 2300, 0.7), (0.3, 300, 850, 2300, 0)],
                        [(0, 160), (0.3, 110)], 0.35, 0.1, 0.8)
    return S


def main():
    print("music:")
    write_ogg(OUT_MUSIC / "menu.ogg", music_menu(), mono32k=True)
    write_ogg(OUT_MUSIC / "chase1.ogg", chase(1, 150, "A3", [0, 0, -4, -5], 16, 1), mono32k=True)
    write_ogg(OUT_MUSIC / "chase2.ogg", chase(2, 142, "D3", [0, 0, 3, -2], 16, 2), mono32k=True)
    write_ogg(OUT_MUSIC / "chase3.ogg", chase(3, 160, "E3", [0, 1, 0, -2], 16, 3), mono32k=True)
    write_ogg(OUT_MUSIC / "carnival.ogg", music_carnival(), mono32k=True)
    write_ogg(OUT_MUSIC / "intro.ogg", music_intro(), mono32k=True)
    write_ogg(OUT_MUSIC / "ending.ogg", music_ending(), mono32k=True)
    print("ambience & sfx:")
    write_ogg(OUT_SFX / "amb_suburb.ogg", amb_suburb(), 4, mono32k=True)
    write_ogg(OUT_SFX / "amb_house.ogg", amb_house(), 3, mono32k=True)
    for name, x in build_sfx().items():
        write_ogg(OUT_SFX / f"{name}.ogg", x.astype(np.float32), 4)


if __name__ == "__main__":
    main()
