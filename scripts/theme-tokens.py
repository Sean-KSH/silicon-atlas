"""Regenerate the light-theme colour values in src/theme-colors.css.

Every module colour is a CSS variable --c-<hex> whose dark value is the original design colour.
This script derives each light value from the dark one in OKLab (perceptual lightness):

  * low-chroma colours (surfaces, rules, text) have their lightness inverted along a fixed curve,
    so dark panels become light panels and light text becomes dark text;
  * saturated colours (plot lines, accents, physical colour coding such as p/n regions) keep
    their hue and are moved to mid lightness so they stay recognisable and readable on white.

Run:  python3 scripts/theme-tokens.py
New colours: write them as var(--c-<6-digit hex>) in CSS/TSX and add a matching dark line to the
first :root block of src/theme-colors.css (or rerun the original tokenizer); then run this script.
"""
import math, re, pathlib

PATH = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'theme-colors.css'

def s2l(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def l2s(c):
    c = max(0.0, min(1.0, c))
    return 255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055)

def to_oklab(r, g, b):
    r, g, b = s2l(r), s2l(g), s2l(b)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)

def from_oklab(L, a, b):
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)

# Lightness inversion for neutral colours: (dark L, light L)
CURVE = [(0, .995), (.1, .99), (.2, .975), (.3, .94), (.4, .87), (.5, .72), (.6, .56),
         (.7, .46), (.8, .37), (.9, .27), (1, .15)]

def curve(L):
    for (x0, y0), (x1, y1) in zip(CURVE, CURVE[1:]):
        if L <= x1:
            return y0 + (y1 - y0) * (L - x0) / (x1 - x0)
    return CURVE[-1][1]

def in_gamut(L, C, H):
    rgb = from_oklab(L, C * math.cos(H), C * math.sin(H))
    return all(-1e-4 <= v <= 1 + 1e-4 for v in rgb), rgb

def light(hexstr):
    h = hexstr.lower()
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    alpha = h[6:8] if len(h) == 8 else ''
    L, a, bb = to_oklab(r, g, b)
    C, H = math.hypot(a, bb), math.atan2(bb, a)
    if C > 0.07 and L >= 0.45:
        # Saturated accent or plot colour: keep hue, sit at mid lightness.
        L2 = max(0.47, min(0.6, 0.58 - 0.12 * (L - 0.6)))
        C2 = min(C * 1.1, 0.2)
    else:
        L2 = curve(L)
        if L2 > 0.85:
            # Light surface: keep a hint of hue only where the original was clearly tinted.
            C2 = min(C * 0.6, 0.045) if C > 0.04 else min(C, 0.006)
        elif L2 > 0.7:
            C2 = min(C * 0.7, 0.05)
        else:
            C2 = min(C, 0.12)
    for _ in range(60):
        ok, rgb = in_gamut(L2, C2, H)
        if ok:
            break
        C2 *= 0.92
    return '#%02x%02x%02x' % tuple(round(l2s(v)) for v in rgb) + alpha

def main():
    text = PATH.read_text()
    dark_block = text.split(":root[data-theme='light']")[0]
    tokens = re.findall(r'--c-([0-9a-f]{6,8}): #', dark_block)
    lines = [f'  --c-{t}: {light(t)};' for t in tokens]
    head = text.split(":root[data-theme='light']")[0]
    body = "\n".join(lines)
    printed = "\n".join('  ' + x for x in lines)
    PATH.write_text(head + ":root[data-theme='light'] {\n" + body + "\n}\n@media print {\n  :root {\n"
                    + printed + "\n  }\n}\n")
    print(f'{len(tokens)} light colours written to {PATH.name}')

if __name__ == '__main__':
    main()
