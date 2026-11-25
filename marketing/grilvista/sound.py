"""Sound for the Grilvista sample reel: a 100 bpm groove, grill sizzle, a crunch on "Kraukšķ.",
whooshes on the red whips, pops on the plate labels, slams on the words and a hit on the end card.
Synthesised in code (no samples). Reuses the building blocks from marketing/kagus-reel/sound.py.

    python3 marketing/grilvista/sound.py out.wav
"""
import importlib.util
import pathlib
import sys
import wave

import numpy as np
from scipy import signal

spec = importlib.util.spec_from_file_location('ks', pathlib.Path(__file__).parent.parent / 'kagus-reel' / 'sound.py')
ks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ks)

SR = ks.SR
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
mix = np.zeros((N, 2))
t_axis = ks.t_axis


def place(x, at, gain=1.0, pan=0.0):
    if x.ndim == 1:
        left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * left, x * right], axis=1) * np.sqrt(2)
    i = int(at * SR)
    if i >= N:
        return
    n = min(len(x), N - i)
    mix[i:i + n] += x[:n] * gain


def hp(x, f):
    return signal.sosfilt(signal.butter(2, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return signal.sosfilt(signal.butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def kick():
    return ks.thud(52, 0.38, 3.0) * 1.0


def clap():
    n = int(0.25 * SR)
    t = t_axis(n)
    x = np.zeros(n)
    for d in (0, 0.011, 0.022):                                   # three quick hands
        s = int(d * SR)
        x[s:] += np.exp(-t[: n - s] * 60)
    return bp(rng.standard_normal(n), 900, 4000) * x * 0.8


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    t = t_axis(n)
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * (14 if open_ else 90)) * 0.5


def sizzle(length):
    """Fat on a hot grill: hiss plus random crackles."""
    n = int(length * SR)
    hiss = bp(rng.standard_normal(n), 3000, 12000) * 0.25
    crack = np.zeros(n)
    for _ in range(int(length * 38)):
        i = rng.integers(0, n - 2000)
        L = rng.integers(200, 1400)
        crack[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 6)) * rng.uniform(0.3, 1.0)
    crack = bp(crack, 1500, 9000)
    e = np.minimum(1, t_axis(n) / 0.4) * np.minimum(1, (length - t_axis(n)) / 0.5)
    return (hiss + crack * 0.7) * e


def crunch():
    """A bite into crispy skin: a dense burst of tiny cracks with a low body."""
    n = int(0.45 * SR)
    t = t_axis(n)
    x = np.zeros(n)
    for _ in range(90):
        i = int(rng.uniform(0, 0.25) * SR)
        L = rng.integers(80, 600)
        if i + L < n:
            x[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 5))
    x = bp(x, 800, 8000) * np.exp(-t * 7)
    x = x / np.max(np.abs(x))
    body = ks.thud(90, 0.3, 1.0)
    x[: len(body)] += body * 0.5
    return x


def build():
    beat = 60 / 100
    # groove from the first slam until just before the end-card hit, then a lighter loop to the end
    t = 0.2
    i = 0
    while t < DUR - 0.3:
        if not (12.05 < t < 12.42):
            light = t > 12.42
            place(kick(), t, 0.55 if not light else 0.4)
            if i % 2 == 1:
                place(clap(), t, 0.35 if not light else 0.25)
            place(hat(), t + beat / 2, 0.22, pan=0.3)
            if i % 4 == 3:
                place(hat(True), t + beat / 2, 0.15, pan=-0.3)
        t += beat
        i += 1

    place(sizzle(9.9), 0.0, 0.22)                        # the grill, under the food shots
    place(crunch(), 0.2, 0.9)                            # "Kraukšķ."
    place(ks.click(3000, 0.03), 1.15, 0.2)
    for c in (2.8, 5.6, 9.8):                            # red whips
        place(ks.whoosh(0.5, 300, 6000, peak=0.6), c - 0.3, 0.75, pan=-0.4)
    place(ks.thud(60, 0.4, 1.5), 4.05, 0.35)             # "fritēta." pulses
    for k, at in enumerate((6.5, 7.05, 7.6, 8.15)):      # plate labels
        place(ks.pop(800 + k * 120, 0.12), at, 0.4, pan=(-0.3, 0.3, -0.1, 0.2)[k])
    for at in (10.0, 10.75, 11.5):                       # words slam in
        place(ks.thud(70, 0.35, 2.0), at, 0.45)
        place(ks.click(2200, 0.03), at, 0.3)
    place(ks.riser(0.8, 300, 3000), 11.62, 0.45)
    place(ks.reverb(ks.impact(2.0), 1.6, wet=0.3), 12.42, 0.8)   # end card
    place(ks.chime((1046.5, 1568.0), 0.08, 1.2), 13.3, 0.3)       # the handle pops up


def write(path):
    st = mix.copy()
    for c in range(2):
        st[:, c] = hp(st[:, c], 28)
    st = np.tanh(st / np.max(np.abs(st)) * 1.2) * 0.89
    fade = int(0.5 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())


if __name__ == '__main__':
    build()
    write(sys.argv[1])
    print('wrote', sys.argv[1])
