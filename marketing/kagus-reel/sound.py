"""Sound design for the kagus.eu reel, synthesised from scratch (no samples, no licences).

Every effect is placed on the same timeline as render(t) in reel.html:
whooshes on the transitions, clicks on the phone taps, a chime on the confirmation,
ticks on the rolling numbers, a riser into the logo and an impact when it lands,
over a quiet pad that pulses and then drops out before the impact.

    python3 marketing/kagus-reel/sound.py out.wav            # effects + pad
    python3 marketing/kagus-reel/sound.py out.wav --sfx-only # effects only, for music added in Instagram
"""
import sys
import wave

import numpy as np
from scipy import signal

SR = 48000
DUR = 20.5
# reel.html holds the picture for HOLD s at FREEZE; sounds after that point move with it
FREEZE, HOLD = 12.0, 1.5
N = int(SR * DUR)
rng = np.random.default_rng(7)

mix = np.zeros((N, 2))


def t_axis(n):
    return np.arange(n) / SR


def place(x, at, gain=1.0, pan=0.0, shift=True):
    """Add a mono or stereo sound at scene time `at` (s). pan -1 left … +1 right."""
    if shift and at >= FREEZE:
        at += HOLD
    if x.ndim == 1:
        left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * left, x * right], axis=1) * np.sqrt(2)
    i = int(at * SR)
    if i >= N:
        return
    n = min(len(x), N - i)
    mix[i:i + n] += x[:n] * gain


def env(n, attack, release, curve=3.0):
    """Rise over `attack` s, fall over the rest with a power curve."""
    a = int(attack * SR)
    e = np.ones(n)
    if a > 0:
        e[:a] = np.linspace(0, 1, a) ** 2
    r = n - a
    e[a:] = (1 - np.linspace(0, 1, r)) ** curve if release else 1
    return e


def sweep_filter(x, f0, f1, kind='bandpass', q=1.2, chunk=256):
    """Filter with a cutoff that glides from f0 to f1 (log), chunk by chunk, keeping filter state."""
    out = np.zeros_like(x)
    zi = None
    n = len(x)
    for s in range(0, n, chunk):
        k = s / max(1, n - 1)
        f = f0 * (f1 / f0) ** k
        if kind == 'bandpass':
            lo, hi = f / (1 + 0.5 / q), f * (1 + 0.5 / q)
            sos = signal.butter(2, [max(30, lo), min(SR / 2 - 100, hi)], 'bandpass', fs=SR, output='sos')
        else:
            sos = signal.butter(2, min(SR / 2 - 100, max(30, f)), kind, fs=SR, output='sos')
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        out[s:s + chunk], zi = signal.sosfilt(sos, x[s:s + chunk], zi=zi)
    return out


def reverb(x, seconds=1.6, wet=0.3, bright=6000):
    """Cheap plate: exponentially decaying filtered noise as the impulse response, stereo decorrelated."""
    n = int(seconds * SR)
    decay = np.exp(-6.0 * t_axis(n) / seconds)
    sos = signal.butter(2, bright, 'low', fs=SR, output='sos')
    irs = [signal.sosfilt(sos, rng.standard_normal(n)) * decay for _ in range(2)]
    irs = [ir / np.sqrt(np.sum(ir ** 2)) for ir in irs]
    mono = x if x.ndim == 1 else x.mean(axis=1)
    wetsig = np.stack([signal.fftconvolve(mono, ir)[: len(mono) + n] for ir in irs], axis=1)
    dry = np.zeros_like(wetsig)
    dry[: len(mono)] = np.stack([mono, mono], axis=1)
    return dry * (1 - wet) + wetsig * wet


# ---------------------------------------------------------------- sounds

def whoosh(length, f0=300, f1=4000, peak=0.6, q=0.9):
    n = int(length * SR)
    x = sweep_filter(rng.standard_normal(n), f0, f1, 'bandpass', q)
    p = int(peak * n)
    e = np.concatenate([np.linspace(0, 1, p) ** 2.5, (1 - np.linspace(0, 1, n - p)) ** 2])
    return x * e / (np.max(np.abs(x)) + 1e-9)


def click(freq=2600, length=0.035):
    n = int(length * SR)
    t = t_axis(n)
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t * 180)
    tick = signal.sosfilt(signal.butter(2, 5000, 'high', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 900)
    thump = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 90) * 0.6
    return (body * 0.5 + tick * 0.35 + thump) * 0.9


def chime(freqs=(1318.5, 1975.5), gap=0.09, length=1.4):
    n = int((length + gap * len(freqs)) * SR)
    x = np.zeros(n)
    for i, f in enumerate(freqs):
        s = int(i * gap * SR)
        t = t_axis(n - s)
        tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2.01 * t) + 0.08 * np.sin(2 * np.pi * f * 3 * t)
        x[s:] += tone * np.exp(-t * 4.2) * (1 - np.exp(-t * 400))
    return x / np.max(np.abs(x))


def pop(freq=900, length=0.12):
    t = t_axis(int(length * SR))
    f = freq * (1 + 0.6 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * (1 - np.exp(-t * 600))


def thud(freq=58, length=0.6, drop=1.6):
    t = t_axis(int(length * SR))
    f = freq * (1 + drop * np.exp(-t * 28))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    return x * (1 - np.exp(-t * 800))


def shimmer(length=0.9, f0=5000, f1=11000):
    n = int(length * SR)
    x = sweep_filter(rng.standard_normal(n), f0, f1, 'bandpass', 3.0)
    t = t_axis(n)
    tones = sum(np.sin(2 * np.pi * f * t) for f in (2637, 3136, 3951)) / 3
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return (x / (np.max(np.abs(x)) + 1e-9) * 0.6 + tones * 0.25) * e


def riser(length=1.0, f0=200, f1=2400):
    n = int(length * SR)
    t = t_axis(n)
    noise = sweep_filter(rng.standard_normal(n), f0, f1 * 2, 'bandpass', 1.5)
    noise /= np.max(np.abs(noise)) + 1e-9
    f = f0 * (f1 / f0) ** (t / length)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    e = np.linspace(0, 1, n) ** 3
    return (noise * 0.75 + tone) * e


def impact(length=2.6):
    n = int(length * SR)
    t = t_axis(n)
    sub = np.sin(2 * np.pi * np.cumsum(42 * (1 + 2.5 * np.exp(-t * 18))) / SR) * np.exp(-t * 2.2)
    crack = signal.sosfilt(signal.butter(2, [200, 5000], 'bandpass', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 22)
    body = signal.sosfilt(signal.butter(2, 700, 'low', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 5)
    x = sub * 1.0 + crack * 0.35 + body * 0.5
    return x * (1 - np.exp(-t * 1500))


def laser(length=0.6, f0=600, f1=5200):
    t = t_axis(int(length * SR))
    f = f0 * (f1 / f0) ** (t / length)
    e = np.sin(np.pi * t / length) ** 1.5
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + sweep_filter(rng.standard_normal(len(t)), f0 * 2, f1 * 1.5, 'bandpass', 2) * 0.5) * e


def pad(start, end):
    """A dark, slowly opening chord (D minor 9) with a soft pulse; drops out at `end`."""
    n = int((end - start) * SR) + int(0.05 * SR)
    t = t_axis(n)
    notes = [73.42, 110.0, 174.61, 261.63, 329.63]
    x = np.zeros(n)
    for f in notes:
        for d in (-0.12, 0.0, 0.11):                          # three detuned saws per note
            ph = 2 * np.pi * f * (1 + d / 100) * t + rng.uniform(0, 6.28)
            x += signal.sawtooth(ph) * (0.6 if f < 100 else 0.35)
    cutoff = 300 + 1500 * (0.5 - 0.5 * np.cos(np.pi * np.clip(t / 12, 0, 1)))   # opens over 12 s
    x = sweep_filter(x, cutoff[0], cutoff[-1], 'low', chunk=512)
    pulse = 0.78 + 0.22 * np.cos(2 * np.pi * 2.0 * t) ** 8                    # 120 bpm breathing
    e = np.minimum(1, t / 1.2) * np.where(t > (end - start) - 0.12, np.maximum(0, ((end - start) - t) / 0.12), 1)
    x = x * pulse * e
    return x / np.max(np.abs(x))


def tail_pad(start):
    """After the impact: a single held, brighter chord that fades out by the end."""
    n = N - int(start * SR)
    t = t_axis(n)
    x = np.zeros(n)
    for f in (146.83, 220.0, 293.66, 440.0, 587.33):
        for d in (-0.1, 0.1):
            x += np.sin(2 * np.pi * f * (1 + d / 100) * t) * (0.5 if f < 200 else 0.3)
    e = np.minimum(1, t / 0.6) * np.exp(-t * 0.25) * np.minimum(1, (t[-1] - t) / 0.8 + 0.0)
    return x * e / np.max(np.abs(x))


# ---------------------------------------------------------------- timeline (matches reel.html)

def build(sfx_only):
    if not sfx_only:
        place(pad(0.0, 15.05 + HOLD), 0.0, gain=0.16)
        place(tail_pad(15.25 + HOLD), 15.25, gain=0.10)

    # A: hook
    place(thud(70, 0.5), 0.04, 0.4)
    for i, at in enumerate((0.05, 0.16, 0.27)):
        place(click(1800 + i * 300, 0.03), at + 0.12, 0.12, pan=-0.2)
    place(whoosh(0.45, 1500, 6000, peak=0.7, q=2), 1.22, 0.22, pan=0.3)   # the strike-through
    place(thud(52, 0.8), 1.86, 0.38)                                       # the answer lands
    place(shimmer(0.9), 2.3, 0.10, pan=0.2)
    place(whoosh(0.9, 200, 5000, peak=0.82), 2.95, 0.7)                  # zoom through the words

    # B: phone
    place(whoosh(0.9, 3000, 250, peak=0.25), 3.55, 0.6, pan=-0.3)       # phone flies in from depth
    for at in (4.95, 5.7, 6.45):
        place(click(), at, 0.6, pan=0.1)
    place(chime(), 6.75, 0.3)
    place(pop(950), 7.25, 0.35, pan=0.15)
    place(whoosh(0.6, 400, 3500, peak=0.6), 7.85, 0.55, pan=0.6)          # phone swings out

    # C: process
    for i, at in enumerate((8.45, 9.2, 9.95, 10.7)):
        place(thud(60 + i * 8, 0.45, 1.2), at, 0.28)
        place(click(1200 + i * 220, 0.04), at, 0.3)
        place(whoosh(0.35, 800, 3000, peak=0.5, q=1.5), at - 0.1, 0.2)
    place(shimmer(0.9, 6000, 13000), 11.0, 0.16, pan=-0.2)               # the polish
    place(thud(64, 0.6, 1.4), 11.42, 0.3)                                # "Mēs ne." lands
    place(shimmer(1.0, 5000, 11000), 12.15, 0.12, pan=0.2, shift=False)  # light across "Mēs ne."
    place(whoosh(0.5, 600, 4000, peak=0.7), 11.85 + HOLD, 0.35, shift=False)

    # D: languages
    for i, at in enumerate((12.3, 13.0, 13.7)):
        place(whoosh(0.4, 900, 4500, peak=0.4, q=1.6), at - 0.05, 0.24, pan=(-0.5, 0.0, 0.5)[i])
    place(riser(1.1), 14.15, 0.5)                                        # the ring spins up

    # E: logo
    place(laser(0.65), 14.9, 0.30, pan=0.0)
    place(reverb(impact(), 2.2, wet=0.35), 15.22, 0.6)
    for i in range(8):                                                    # letters
        place(click(2400 + i * 90, 0.02), 15.75 + i * 0.045, 0.07, pan=-0.4 + i * 0.1)
    place(pop(700, 0.18), 16.65, 0.18)
    place(shimmer(0.8, 4000, 9000), 16.7, 0.06)


def write(path):
    stereo = mix.copy()
    stereo[:, 0] = signal.sosfilt(signal.butter(2, 25, 'high', fs=SR, output='sos'), stereo[:, 0])
    stereo[:, 1] = signal.sosfilt(signal.butter(2, 25, 'high', fs=SR, output='sos'), stereo[:, 1])
    peak = np.max(np.abs(stereo))
    stereo = np.tanh(stereo / peak * 1.1) * 0.89                          # gentle soft clip, -1 dBFS
    fade = int(0.4 * SR)
    stereo[-fade:] *= np.linspace(1, 0, fade)[:, None]
    data = (stereo * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == '__main__':
    build('--sfx-only' in sys.argv)
    write(sys.argv[1])
    print('wrote', sys.argv[1])
