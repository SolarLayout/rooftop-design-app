"""Builds the Sun and Strings lens boards from the approved Studio board (Main.dc.html)."""
import math
import re

P = 'project/'
main = open(P + 'Main.dc.html').read()

A, B, C, D, ZK, E, F = 8.154, -2.187, -3.807, -4.680, 7.371, 180, 470
ROOF = f'matrix({A} {B} {C} {D} {E} {F})'
ROWS_Y = [1.0, 7.45, 13.9, 20.35, 26.8, 33.25]
BX = [1.23, 29.5, 57.77, 86.04]
CW = 1.153


def colx(c):  # x of global column index (0..73)
    return 1.23 + c * CW + 0.6 * (c // 24) + (0.0 if c < 72 else 0.0)


# available columns per row (global index), from the demo layout
AVAIL = {
    0: list(range(0, 58)) + [71, 72, 73],
    1: list(range(0, 74)),
    2: list(range(0, 14)) + list(range(24, 74)),
    3: list(range(0, 13)) + list(range(24, 48)) + list(range(56, 74)),
    4: list(range(0, 48)) + list(range(55, 74)),
    5: list(range(0, 74)),
}


def runs(cols):
    """Contiguous runs that do not cross a walkway (every 24 columns)."""
    out, start, prev = [], None, None
    for c in cols:
        if start is None:
            start = prev = c
        elif c == prev + 1 and c % 24 != 0:
            prev = c
        else:
            out.append((start, prev))
            start = prev = c
    if start is not None:
        out.append((start, prev))
    return out


def row_matrix(y0):
    return f'matrix({A} {B} {round(C * 0.966, 3)} {round(D * 0.966 - ZK * 0.2588, 3)} {round(E + C * y0, 2)} {round(F + D * y0 - ZK * 0.5, 2)})'


def hull(pts):
    pts = sorted(set((round(x, 3), round(y, 3)) for x, y in pts))
    if len(pts) < 3:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0:
            up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]


def poly(pts, extra=''):
    return '<polygon points="' + ' '.join(f'{round(x, 2)},{round(y, 2)}' for x, y in pts) + f'"{extra}/>'


def rect_pts(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def cast(pts, h, v):
    return hull(pts + [(x + v[0] * h, y + v[1] * h) for x, y in pts])


BOXES = [('stair', 20, 16, 25, 20, 3.0)] + [(f'ac{i}', 70 + 3 * i, 3, 71.5 + 3 * i, 4, 1.2) for i in range(4)]
TANK = (62, 24, 1.25, 2.0)

AERIAL = '''<rect x="-80" y="-100" width="290" height="230" fill="#3B4037"/>
<polygon points="-60,40 -22,44 -18,110 -60,110" fill="#454A3C"/><polygon points="130,50 200,46 200,110 128,110" fill="#34392F"/>
<polygon points="-80,-100 -20,-100 -24,-36 -80,-34" fill="#4A4638"/><polygon points="84,-100 116,-100 116,-40 88,-44" fill="#454A3C"/>
<rect x="-80" y="-32" width="290" height="13" fill="#4A4C50"/><path d="M -80 -25.500 H 200" stroke="#9A9C9E" stroke-width="0.3" stroke-dasharray="3 4" fill="none"/>
<rect x="116" y="-100" width="9" height="230" fill="#4A4C50"/><rect x="-14" y="-12" width="124" height="70" fill="#5B584E"/><rect x="40" y="-19" width="9" height="8" fill="#5B584E"/>
@NEIGHBOUR_SHADOWS@
<rect x="-100" y="-4" width="70" height="36" fill="#7F868E"/><path d="M -100 14 H -30" stroke="#979EA6" stroke-width="0.5"/>
<rect x="-10" y="70" width="50" height="30" fill="#8B8376"/><rect x="52" y="68" width="58" height="26" fill="#6F7A82"/><path d="M 52 81 H 110" stroke="#87929A" stroke-width="0.5"/>
<rect x="136" y="0" width="60" height="44" fill="#94897A"/><rect x="136" y="58" width="44" height="30" fill="#7A8087"/>
<rect x="-60" y="-84" width="80" height="40" fill="#858A90"/><rect x="34" y="-88" width="46" height="44" fill="#7B6F63"/>
<g fill="#C9CCD0"><rect x="-8" y="-9" width="4.500" height="1.900"/><rect x="-1" y="-9" width="4.500" height="1.900" fill="#7C2F2A"/><rect x="6" y="-9" width="4.500" height="1.900"/><rect x="60" y="-27" width="4.500" height="1.900" fill="#D9D9D6"/><rect x="-30" y="-24" width="7" height="2.400" fill="#C4A64A"/></g>
<g fill="#2F4D33"><circle cx="-12" cy="61" r="3.500"/><circle cx="102" cy="60" r="3.800"/><circle cx="112" cy="-15" r="3.200"/><circle cx="129" cy="-40" r="3.600"/><circle cx="-36" cy="-39" r="3.400"/><circle cx="-46" cy="52" r="4.200"/></g>
<g fill="#3A5E3E"><circle cx="-4" cy="62" r="3"/><circle cx="-52" cy="60" r="3.600"/><circle cx="108" cy="52" r="2.600"/><circle cx="-28" cy="-40" r="2.800"/></g>'''
NEIGHBOURS = [(-100, -4, -30, 32, 7), (-10, 70, 40, 100, 6), (52, 68, 110, 94, 7), (136, 0, 196, 44, 8), (136, 58, 180, 88, 6)]

MPPT = ['#3987E5', '#D95926', '#199E70', '#C98500', '#D55181', '#008300']
MPPT_DARK = ['#1F56A0', '#93381A', '#0F6B4B', '#8A5B00', '#94325A', '#005A00']


def pattern(pid, fill, line, top):
    return (f'<pattern id="{pid}" patternUnits="userSpaceOnUse" width="1.153" height="2.297"><rect width="1.133" height="2.277" fill="{fill}"/>'
            f'<rect y="1.118" width="1.133" height="0.04" fill="{line}"/><rect width="1.133" height="0.06" fill="{top}"/></pattern>')


def scene(v, ground, colouring=None, overlay='', label='', dim_modules=1.0, keepouts=True, selected_string=None):
    """v: shadow shift per metre of height (east, north). colouring: dict row -> list of (col_from, col_to_exclusive, pattern id)."""
    o = []
    o.append('<svg viewBox="-9.75 -51.4 959.5 823" width="984" height="844" style="position: absolute; left: -10px; top: -104px" role="img" aria-label="' + label + '">')
    o.append('<defs>')
    o.append(pattern('mod', '#16294D', '#2A4675', '#33558C'))
    for i, (c, d) in enumerate(zip(MPPT, MPPT_DARK), 1):
        o.append(pattern(f'mod{i}', c, d, '#FFFFFF55'))
    o.append(pattern('ghost', '#8C93A0', '#A9B0BC', '#C5CAD3'))
    o.append('<pattern id="grid" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M 10 0 L 0 0 L 0 10" fill="none" stroke="#1B222D" stroke-width="0.12"/></pattern>')
    o.append('<filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.1"/></filter>')
    o.append('<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>')
    if ground == 'sat':
        o.append('<radialGradient id="fade" cx="50%" cy="46%" r="72%"><stop offset="38%" stop-color="#0B0E13" stop-opacity="0.12"/><stop offset="100%" stop-color="#0B0E13" stop-opacity="0.94"/></radialGradient>')
    else:
        o.append('<radialGradient id="fade" cx="50%" cy="46%" r="70%"><stop offset="45%" stop-color="#0B0E13" stop-opacity="0"/><stop offset="100%" stop-color="#0B0E13" stop-opacity="1"/></radialGradient>')
    o.append('<clipPath id="roofclip"><rect width="90" height="40"/></clipPath>')
    o.append('</defs>')
    gm = f'matrix({A} {B} {C} {D} {E} {round(F + 6 * ZK, 2)})'
    bshadow = poly(cast(rect_pts(0, 0, 90, 40), 6.9, v), ' fill="#05070A" opacity="0.6"')
    if ground == 'sat':
        ns = '<g fill="#000000" opacity="0.4">' + ''.join(poly(cast(rect_pts(a, b, c, d), h, v)) for a, b, c, d, h in NEIGHBOURS) + '</g>'
        o.append(f'<g transform="{gm}" filter="url(#soft)">' + AERIAL.replace('@NEIGHBOUR_SHADOWS@', ns) + bshadow + '</g>')
    else:
        o.append(f'<g transform="{gm}"><rect x="-80" y="-100" width="290" height="230" fill="url(#grid)"/>{bshadow}</g>')
    o.append('<rect x="-9.75" y="-51.4" width="959.5" height="823" fill="url(#fade)"/>')
    # roof
    o.append(f'<g transform="{ROOF}"><rect width="90" height="40" fill="#D3D6DB"/><rect x="1" y="1" width="88" height="38" fill="none" stroke="#8E95A0" stroke-width="0.08" stroke-dasharray="0.5 0.4"/></g>')
    o.append('<g transform="matrix(8.154 -2.187 0 -7.371 27.72 282.8)"><rect width="90" height="0.9" fill="#B9BEC6"/></g>')
    o.append('<g transform="matrix(-3.807 -4.680 0 -7.371 913.86 273.17)"><rect width="40" height="0.9" fill="#8E95A0"/></g>')
    o.append('<g transform="matrix(8.154 -2.187 -3.807 -4.680 180 463.37)" fill="#ECEEF0"><rect y="39.8" width="90" height="0.2"/><rect x="89.8" width="0.2" height="40"/></g>')
    # roof overlays: keep-outs and shadows
    o.append(f'<g transform="{ROOF}">')
    if keepouts:
        o.append('<g fill="#FFB020" fill-opacity="0.18" stroke="#FFB020" stroke-width="0.1" stroke-dasharray="0.6 0.4"><polygon points="19.5,15.5 25.5,15.5 29.2,24.9 16,24.9"/><polygon points="60.2,22.2 63.8,22.2 66.8,31.3 57.7,31.3"/><polygon points="69.4,2.5 81.6,2.5 84.2,5.6 69.2,5.6"/></g>')
    o.append('<g opacity="0.4" fill="#0B1220" clip-path="url(#roofclip)">')
    pv = (v[0] * 0.9, v[1] * 0.9)
    for wall in ([(0, 0), (90, 0)], [(0, 0), (0, 40)], [(90, 0), (90, 40)], [(0, 40), (90, 40)]):
        o.append(poly(hull(wall + [(x + pv[0], y + pv[1]) for x, y in wall])))
    for _, x0, y0, x1, y1, h in BOXES:
        o.append(poly(cast(rect_pts(x0, y0, x1, y1), h, v)))
    cx, cy, r, h = TANK
    circ = [(cx + r * math.cos(t * math.pi / 12), cy + r * math.sin(t * math.pi / 12)) for t in range(24)]
    o.append(poly(cast(circ, h, v)))
    for ri, y0 in enumerate(ROWS_Y):
        m = f'matrix(1 0 {round(1.184 * v[0], 3)} {round(4.418 + 1.184 * v[1], 3)} {round(0.5 * v[0], 3)} {round(y0 + 0.5 * v[1], 3)})'
        o.append(f'<g transform="{m}">' + ''.join(f'<rect x="{round(colx(a), 3)}" width="{round((b - a + 1) * CW - 0.02, 3)}" height="1"/>' for a, b in runs(AVAIL[ri])) + '</g>')
    o.append('</g></g>')

    def row(ri):
        y0 = ROWS_Y[ri]
        s = f'<g transform="{row_matrix(y0)}"' + (f' opacity="{dim_modules}"' if dim_modules < 1 else '') + '>'
        if colouring is None:
            for a, b in runs(AVAIL[ri]):
                s += f'<rect transform="translate({round(colx(a), 3)} 0)" width="{round((b - a + 1) * CW - 0.02, 3)}" height="4.574" fill="url(#mod)"/>'
        else:
            for a, b, pid, sid in colouring[ri]:
                # a, b are positions along the list of available columns (may be fractional)
                cols = AVAIL[ri]
                i = a
                while i < b - 1e-9:
                    c = cols[int(math.floor(i))]
                    j = i
                    # extend while contiguous and inside (a, b) and not crossing a walkway
                    while True:
                        nj = min(math.floor(j) + 1, b)
                        if nj >= b - 1e-9:
                            j = b
                            break
                        cn = cols[int(nj)]
                        if cn == cols[int(math.floor(j))] + 1 and cn % 24 != 0:
                            j = nj
                        else:
                            j = nj
                            break
                    x = colx(c) + (i - math.floor(i)) * CW
                    w = (j - i) * CW - 0.02
                    extra = ''
                    if selected_string is not None and sid == selected_string:
                        extra = ' stroke="#FFFFFF" stroke-width="0.22"'
                    s += f'<rect transform="translate({round(x, 3)} 0)" width="{round(w, 3)}" height="4.574" fill="url(#{pid})"{extra}/>'
                    i = j
        return s + '</g>'

    o.append(row(5) + row(4))
    o.append(f'<g transform="{ROOF}"><circle cx="62" cy="24" r="1.25" fill="#9AA1AC"/></g>')
    o.append('<rect x="582.93" y="207.35" width="22.5" height="14.74" fill="#9AA1AC"/><rect x="582.93" y="207.35" width="7" height="14.74" fill="#7E8693"/>')
    o.append('<g transform="matrix(8.154 -2.187 -3.807 -4.680 180 455.26)"><circle cx="62" cy="24" r="1.25" fill="#ECEEF0"/></g>')
    o.append(row(3))
    o.append('<g transform="matrix(8.154 -2.187 0 -7.371 119.09 395.12)"><rect x="20" width="5" height="3" fill="#C2C7CF"/><rect x="21.9" width="1.1" height="2.1" fill="#8E95A0"/></g>')
    o.append('<g transform="matrix(-3.807 -4.680 0 -7.371 343.08 426.26)"><rect x="16" width="4" height="3" fill="#868D99"/></g>')
    o.append('<g transform="matrix(8.154 -2.187 -3.807 -4.680 180 447.89)"><rect x="20" y="16" width="5" height="4" fill="#F1F2F4"/></g>')
    o.append(row(2) + row(1))
    o.append('<g transform="matrix(8.154 -2.187 0 -7.371 168.58 455.96)" fill="#C2C7CF"><rect x="70" width="1.5" height="1.2"/><rect x="73" width="1.5" height="1.2"/><rect x="76" width="1.5" height="1.2"/><rect x="79" width="1.5" height="1.2"/></g>')
    o.append('<g fill="#868D99">' + ''.join(f'<g transform="matrix(-3.807 -4.680 0 -7.371 {round(E + A * x, 2)} {round(F + B * x, 2)})"><rect x="3" width="1" height="1.2"/></g>' for x in (70, 73, 76, 79)) + '</g>')
    o.append('<g transform="matrix(8.154 -2.187 -3.807 -4.680 180 461.15)" fill="#F1F2F4"><rect x="70" y="3" width="1.5" height="1"/><rect x="73" y="3" width="1.5" height="1"/><rect x="76" y="3" width="1.5" height="1"/><rect x="79" y="3" width="1.5" height="1"/></g>')
    o.append(row(0))
    o.append('<g transform="matrix(8.154 -2.187 0 -7.371 180 470)"><rect y="-6" width="90" height="6.9" fill="#4A5262"/><rect y="-6" width="90" height="0.4" fill="#343A47"/></g>')
    o.append('<g transform="matrix(-3.807 -4.680 0 -7.371 180 470)"><rect y="-6" width="40" height="6.9" fill="#2E3440"/><rect y="-6" width="40" height="0.4" fill="#22272F"/></g>')
    o.append('<g transform="matrix(8.154 -2.187 -3.807 -4.680 180 463.37)" fill="#ECEEF0"><rect width="90" height="0.2"/><rect width="0.2" height="40"/></g>')
    o.append(overlay)
    o.append('</svg>')
    return '\n'.join(o)


def dome(az, el, r=75):
    a, e = math.radians(az), math.radians(el)
    x = 45 + r * math.cos(e) * math.sin(a)
    y = 20 + r * math.cos(e) * math.cos(a)
    z = r * math.sin(e)
    return E + A * x + C * y, F + B * x + D * y - ZK * z


def sun_at(hour, lat=18.52, dec=-23.44):
    H = math.radians(15 * (hour - 12))
    la, de = math.radians(lat), math.radians(dec)
    el = math.asin(math.sin(la) * math.sin(de) + math.cos(la) * math.cos(de) * math.cos(H))
    ca = (math.sin(de) - math.sin(el) * math.sin(la)) / (math.cos(el) * math.cos(la))
    az = math.degrees(math.acos(max(-1, min(1, ca))))
    if hour > 12:
        az = 360 - az
    return az, math.degrees(el)


def path_through(hours):
    pts = [dome(*sun_at(h)) for h in hours]
    d = f'M {pts[0][0]:.1f} {pts[0][1]:.1f}'
    for p in pts[1:]:
        d += f' L {p[0]:.1f} {p[1]:.1f}'
    return d


def swap_lens(s, active):
    i = s.index('<nav aria-label="Lenses"')
    j = s.index('</nav>', i)
    nav = s[i:j]
    tags = re.findall(r'<button[^>]*>', nav)
    names = ['Roof', 'Array', 'Sun', 'Strings']
    on, off = tags[1], tags[0]
    k = names.index(active)
    off_for = lambda t: off if 'position: relative' not in t else t.replace('', '')
    new = nav
    # set all four to off, then the active to on
    for t in tags[:4]:
        new = new.replace(t, '@@OFF@@', 1)
    parts = new.split('@@OFF@@')
    rebuilt = parts[0]
    for n in range(4):
        rebuilt += (on if n == k else off) + parts[n + 1]
    return s[:i] + rebuilt + s[j:]


def replace_between(s, start, end, new, include_end=True):
    a = s.index(start)
    b = s.index(end, a) + (len(end) if include_end else 0)
    return s[:a] + new + s[b:]


H2 = '<h2 style="margin: 0; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: #7C8696">'
WELL = 'background: #090C10; border: 1px solid #232A36; border-radius: 10px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.04)'
RAISED = 'box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)'
SEG = 'box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)'
CARD = 'box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.28)'
FLOAT = 'box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.5)'
TICK = '<svg style="flex-shrink: 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DD6A0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Fits"><path d="m5 12 5 5 9-10"/></svg>'
NOTE = '<svg style="flex-shrink: 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFB020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Note"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>'


def seg(items, active, label, h=30, fs=13, grid=False):
    wrap = ('display: grid; grid-template-columns: repeat(%d, minmax(0, 1fr))' % len(items)) if grid else 'display: flex'
    s = f'<div role="group" aria-label="{label}" style="{wrap}; gap: 2px; padding: 3px; {WELL}">'
    for it in items:
        if it == active:
            s += f'<button aria-pressed="true" style="height: {h}px; padding: 0 12px; background: #232A36; border: 0; border-radius: 7px; font-size: {fs}px; font-weight: 500; cursor: pointer; {SEG}">{it}</button>'
        else:
            s += f'<button style="height: {h}px; padding: 0 12px; background: transparent; border: 0; border-radius: 7px; color: #A9B2C0; font-size: {fs}px; cursor: pointer">{it}</button>'
    return s + '</div>'


def switch(on, label):
    if on:
        return f'<button role="switch" aria-checked="true" aria-label="{label}" style="width: 44px; height: 26px; flex-shrink: 0; padding: 3px; display: flex; justify-content: flex-end; background: #FFB020; border: 0; border-radius: 13px; cursor: pointer; box-shadow: inset 0 1px 3px rgba(0,0,0,0.45)"><span style="width: 20px; height: 20px; border-radius: 50%; background: #1A1204; box-shadow: 0 1px 3px rgba(0,0,0,0.5)"></span></button>'
    return f'<button role="switch" aria-checked="false" aria-label="{label}" style="width: 44px; height: 26px; flex-shrink: 0; padding: 3px; display: flex; justify-content: flex-start; background: #2F3847; border: 0; border-radius: 13px; cursor: pointer; box-shadow: inset 0 1px 3px rgba(0,0,0,0.45)"><span style="width: 20px; height: 20px; border-radius: 50%; background: #A9B2C0; box-shadow: 0 1px 3px rgba(0,0,0,0.5)"></span></button>'


def toggle_row(title, hint, on):
    return f'<div style="display: flex; align-items: center; gap: 12px; min-height: 40px"><div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span>{title}</span>' + (f'<span style="font-size: 12px; color: #7C8696">{hint}</span>' if hint else '') + f'</div>{switch(on, title)}</div>'


def aside(label, body):
    return f'<aside aria-label="{label}" style="width: 384px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; padding: 20px; background: #0E1218; border-left: 1px solid #1C222C; overflow: hidden">\n{body}\n</aside>'


def figure(label, value, unit):
    return f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; {WELL}"><span style="font-size: 12px; color: #A9B2C0">{label}</span><span style="font-family: \'Geist Mono\', monospace; font-weight: 500; font-size: 15px">{value} <span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 12px; color: #A9B2C0">{unit}</span></span></div>'


# =====================================================================================
# SUN LENS
# =====================================================================================
az, el = sun_at(16)
L = 1 / math.tan(math.radians(el))
v16 = (-L * math.sin(math.radians(az)), -L * math.cos(math.radians(az)))
sx, sy = dome(az, el)
rise = 12 - math.degrees(math.acos(-math.tan(math.radians(18.52)) * math.tan(math.radians(-23.44)))) / 15
hours_all = [rise + i * (24 - 2 * rise) / 40 for i in range(41)]
hours_win = [9 + i * 7 / 28 for i in range(29)]
ov = [f'<path d="{path_through(hours_all)}" fill="none" stroke="#FFB020" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="3 6" stroke-linecap="round"/>',
      f'<path d="{path_through(hours_win)}" fill="none" stroke="#FFB020" stroke-width="3" stroke-linecap="round"/>']
for h in (9, 12, 14):
    px, py = dome(*sun_at(h))
    ov.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4.5" fill="#0B0E13" stroke="#FFB020" stroke-width="2"/>')
    ov.append(f'<text x="{px:.1f}" y="{py - 12:.1f}" text-anchor="middle" font-family="Geist Mono, monospace" font-size="12" fill="#F2F4F7">{h:02d}:00</text>')
ov.append(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{E + A * 45 + C * 20:.1f}" y2="{F + B * 45 + D * 20:.1f}" stroke="#FFB020" stroke-opacity="0.35" stroke-width="1.2" stroke-dasharray="2 5"/>')
ov.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="22" fill="#FFB020" opacity="0.55" filter="url(#glow)"/>')
ov.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="11" fill="#FFD36B" stroke="#FFF3D1" stroke-width="2"/>')
sun_svg = scene(v16, 'sat', overlay='\n'.join(ov), keepouts=False,
                label='3D view of the roof at 16:00 solar time on 21 December, with long shadows to the north-east and the sun path across the sky')

s = swap_lens(main, 'Sun')
s = s.replace('<title>Studio, desktop</title>', '<title>Studio, Sun lens, desktop</title>')
s = s.replace('letter-spacing: -0.02em">Array</div>', 'letter-spacing: -0.02em">Sun</div>')
s = s.replace('<div style="color: #A9B2C0; font-size: 13px">790 positions · 28 tables · 6 rows · 1,646 m² of modules</div>', '<div style="color: #D5DAE2; font-size: 13px">21 December · winter solstice · shade-free from 09:00 to 16:00</div>')
s = s.replace('<div style="position: absolute; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px">', '<div style="position: absolute; z-index: 1; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px; text-shadow: 0 1px 8px rgba(0,0,0,0.8)">')
s = s.replace('<div style="position: absolute; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">', '<div style="position: absolute; z-index: 1; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">')
wx, wy = sx * 1.0255, (sy - 50) * 1.0255
wrapper = f'''<div style="position: absolute; left: 10px; top: 104px; width: 964px; height: 492px">
{sun_svg}
<div style="position: absolute; left: {wx + 26:.0f}px; top: {wy - 22:.0f}px; display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; background: #12161D; border: 1px solid #3A3220; border-radius: 12px; white-space: nowrap; {FLOAT}">
<div style="font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 500">16:00 · end of the window</div>
<div style="font-size: 12px; color: #A9B2C0">Shadows reach the next row and stop</div>
</div>
</div>
'''
s = replace_between(s, '<div style="position: absolute; left: 10px; top: 104px; width: 964px; height: 492px">', '<div style="position: absolute; left: 24px; bottom: 116px;', wrapper, include_end=False)
# timeline
t0, t1 = rise, 24 - rise
pos = lambda h: (h - t0) / (t1 - t0) * 100
timeline = f'''<div style="position: absolute; left: 20px; right: 20px; bottom: 114px; display: flex; align-items: center; gap: 16px; height: 64px; box-sizing: border-box; padding: 0 20px 0 10px; background: #12161D; border: 1px solid #232A36; border-radius: 16px; {FLOAT}">
<button aria-label="Play the day" style="width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #FFB020; border: 0; border-radius: 50%; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 1px 2px rgba(0,0,0,0.5), 0 8px 22px rgba(255,176,32,0.24)"><svg width="14" height="14" viewBox="0 0 24 24" fill="#1A1204" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></button>
<div style="display: flex; flex-direction: column; flex-shrink: 0"><span style="font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600; font-size: 22px; line-height: 24px">16:00</span><span style="font-size: 12px; color: #A9B2C0">solar time</span></div>
<div role="slider" aria-label="Time of day" aria-valuemin="6.5" aria-valuemax="17.5" aria-valuenow="16" tabindex="0" style="position: relative; flex-grow: 1; height: 44px">
<div style="position: absolute; left: 0; right: 0; top: 14px; height: 6px; border-radius: 3px; background: #090C10; box-shadow: inset 0 1px 2px rgba(0,0,0,0.7)"></div>
<div style="position: absolute; left: {pos(9):.1f}%; width: {pos(16) - pos(9):.1f}%; top: 14px; height: 6px; border-radius: 3px; background: #FFB020"></div>
<div style="position: absolute; left: calc({pos(16):.1f}% - 11px); top: 6px; width: 22px; height: 22px; box-sizing: border-box; border-radius: 50%; background: #FFFFFF; border: 4px solid #FFB020; box-shadow: 0 2px 6px rgba(0,0,0,0.6)"></div>
<span style="position: absolute; left: 0; top: 28px; font-family: 'Geist Mono', monospace; font-size: 11px; color: #7C8696">06:33 sunrise</span>
<span style="position: absolute; left: {pos(9):.1f}%; top: 28px; transform: translateX(-50%); font-family: 'Geist Mono', monospace; font-size: 11px; color: #A9B2C0">09:00</span>
<span style="position: absolute; left: {pos(12):.1f}%; top: 28px; transform: translateX(-50%); font-family: 'Geist Mono', monospace; font-size: 11px; color: #7C8696">12:00</span>
<span style="position: absolute; left: {pos(16):.1f}%; top: 28px; transform: translateX(-50%); font-family: 'Geist Mono', monospace; font-size: 11px; color: #F2F4F7">16:00</span>
<span style="position: absolute; right: 0; top: 28px; font-family: 'Geist Mono', monospace; font-size: 11px; color: #7C8696">sunset 17:27</span>
</div>
</div>
'''
s = replace_between(s, '<div style="position: absolute; left: 24px; bottom: 116px;', '<section aria-label="Design vitals"', timeline, include_end=False)
body = f'''{seg(['Shadows', 'Shade map'], 'Shadows', 'What to show', h=34, grid=True)}

<section style="display: flex; flex-direction: column; gap: 10px">
{H2}Day</h2>
{seg(['21 Dec', '21 Mar', '21 Jun', 'Any date'], '21 Dec', 'Day', grid=True)}
<div style="font-size: 12px; color: #7C8696">21 December is the design day: the winter solstice for this hemisphere</div>
</section>

<section style="display: flex; flex-direction: column; gap: 10px">
{H2}Sun at 16:00</h2>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">
{figure('Height', '18.0', '°')}
{figure('Bearing', '56.6', '° W of south')}
</div>
</section>

<section style="display: flex; flex-direction: column; gap: 10px">
{H2}Shading over the year</h2>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">
{figure('Near, linear', '0.35', '%')}
{figure('Electrical, beyond linear', '0.56', '%')}
{figure('Far, horizon', '0.01', '%')}
{figure('Kept clear', '150', 'm²')}
</div>
<div style="font-size: 12px; color: #7C8696">Horizon from PVGIS, highest point 2.7°</div>
</section>

<section style="display: flex; flex-direction: column; gap: 6px">
{H2}On the roof</h2>
{toggle_row('Sun path', 'The arc the sun follows on this day', True)}
{toggle_row('Shade-free window', 'Thick part of the arc, 09:00 to 16:00', True)}
{toggle_row('Calculated shadow outlines', 'Compare the engine with what you see', False)}
</section>'''
s = replace_between(s, '<aside aria-label="Array inspector"', '</aside>', aside('Sun inspector', body))
open(P + 'SunLens.dc.html', 'w').write(s)

# =====================================================================================
# STRINGS LENS
# =====================================================================================
v1030 = (-0.75, 1.0)
# strings of 14.5 columns along the available columns of each row
plan = {5: 5, 4: 4, 1: 5, 0: 4, 2: 4, 3: 0}
order = [0, 1, 2, 4, 5]           # rows in MPPT order, front to back
string_mppt = [1] * 4 + [2] * 4 + [3] * 4 + [4] * 4 + [5] * 3 + [6] * 3
colouring, sid = {}, 0
for ri in order:
    n = plan[ri]
    segs = []
    for k in range(n):
        segs.append((k * 14.5, (k + 1) * 14.5, f'mod{string_mppt[sid]}', sid + 1))
        sid += 1
    rest = len(AVAIL[ri]) - n * 14.5
    if rest > 0.01:
        segs.append((n * 14.5, len(AVAIL[ri]), 'ghost', None))
    colouring[ri] = segs
colouring[3] = [(0, len(AVAIL[3]), 'ghost', None)]
inv = ('<g transform="matrix(8.154 -2.187 0 -7.371 180 470)"><rect x="43" y="0.9" width="2" height="1.4" fill="#FFB020" stroke="#1A1204" stroke-width="0.08"/></g>')
str_svg = scene(v1030, 'grid', colouring=colouring, overlay=inv, keepouts=False, selected_string=12,
                label='3D view of the roof with modules coloured by MPPT, unused positions in grey, and string 12 selected')

s = swap_lens(main, 'Strings')
s = s.replace('<title>Studio, desktop</title>', '<title>Studio, Strings lens, desktop</title>')
s = s.replace('letter-spacing: -0.02em">Array</div>', 'letter-spacing: -0.02em">Strings</div>')
s = s.replace('790 positions · 28 tables · 6 rows · 1,646 m² of modules', '22 strings of 29 modules · 1 inverter, 6 MPPT · 152 positions not used')
s = s.replace('<div style="position: absolute; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px">', '<div style="position: absolute; z-index: 1; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px">')
s = s.replace('<div style="position: absolute; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">', '<div style="position: absolute; z-index: 1; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">')
# string 12 is the 4th string of row 2 (index order: r0 1-4, r1 5-8 (+9), ...). Find its centre for the callout.
wrapper = f'''<div style="position: absolute; left: 10px; top: 104px; width: 964px; height: 492px">
{str_svg}
@CALLOUT@
<div style="position: absolute; left: {((E + A * 44) * 1.0255):.0f}px; top: {((F + B * 44 - ZK * 2.3 - 50) * 1.0255 - 26):.0f}px; padding: 2px 8px; background: #FFB020; color: #1A1204; border-radius: 6px; font-family: 'Geist Mono', monospace; font-size: 11px; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.5)">INV-1</div>
</div>
'''
s = replace_between(s, '<div style="position: absolute; left: 10px; top: 104px; width: 964px; height: 492px">', '<div style="position: absolute; left: 24px; bottom: 116px;', wrapper, include_end=False)
legend = '<div style="position: absolute; left: 20px; bottom: 114px; display: flex; align-items: center; gap: 14px; height: 48px; padding: 0 16px 0 6px; background: #12161D; border: 1px solid #232A36; border-radius: 14px; white-space: nowrap; ' + FLOAT + '">' + seg(['String', 'MPPT', 'Inverter'], 'MPPT', 'Colour by', h=34)
for i, c in enumerate(MPPT, 1):
    legend += f'<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #A9B2C0"><span style="width: 12px; height: 12px; border-radius: 3px; background: {c}"></span>MPPT {i}</span>'
legend += '<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #A9B2C0"><span style="width: 12px; height: 12px; border-radius: 3px; background: #8C93A0"></span>Not used</span></div>\n'
s = replace_between(s, '<div style="position: absolute; left: 24px; bottom: 116px;', '<section aria-label="Design vitals"', legend, include_end=False)


def option(letter, title, line, mwh, mark, active=False):
    bg = 'background: #1E1A10; border: 1px solid #FFB020; box-shadow: 0 0 0 3px rgba(255,176,32,0.14)' if active else 'background: #12161D; border: 1px solid #232A36; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)'
    return (f'<button aria-pressed="{"true" if active else "false"}" style="display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 12px; {bg}; border-radius: 12px; text-align: left; cursor: pointer">'
            f'<span style="width: 26px; height: 26px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: {"#FFB020" if active else "#232A36"}; color: {"#1A1204" if active else "#F2F4F7"}; font-family: \'Geist Mono\', monospace; font-weight: 500; font-size: 13px">{letter}</span>'
            f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column"><span style="font-weight: 500; font-size: 13px">{title}</span><span style="font-family: \'Geist Mono\', monospace; font-size: 11.5px; color: #A9B2C0">{line}</span></span>'
            f'<span style="font-family: \'Geist Mono\', monospace; font-weight: 500; font-size: 13px">{mwh}</span>{mark}</button>')


inverter_card = f'''<div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: #12161D; border: 1px solid #232A36; border-radius: 14px; {CARD}">
<div style="width: 44px; height: 56px; flex-shrink: 0; box-sizing: border-box; border-radius: 6px; background: #181D26; border: 2px solid #2F3847; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px"><span style="width: 22px; height: 3px; border-radius: 2px; background: #FFB020"></span><span style="width: 22px; height: 3px; border-radius: 2px; background: #2F3847"></span><span style="width: 22px; height: 3px; border-radius: 2px; background: #2F3847"></span></div>
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0">
<div style="font-weight: 600; white-space: nowrap">WP-330KTL-H1</div>
<div style="font-size: 12px; color: #A9B2C0; white-space: nowrap">WattPower · 275 kW · 6 MPPT</div>
<div style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #7C8696; white-space: nowrap">65.0 A per MPPT · 28 inputs</div>
</div>
<button style="height: 36px; padding: 0 12px; background: #151A22; border: 1px solid #2F3847; border-radius: 9px; font-size: 13px; cursor: pointer; {RAISED}">Replace</button>
</div>'''
body = f'''{inverter_card}

<section style="display: flex; flex-direction: column; gap: 8px">
<div style="display: flex; align-items: center; gap: 12px">{H2}System voltage</h2><span style="margin-left: auto; font-size: 12px; color: #7C8696">Your choice</span></div>
{seg(['600 V', '1000 V', '1500 V'], '1500 V', 'System voltage', h=36, fs=14, grid=True)}
</section>

<section style="display: flex; flex-direction: column; gap: 8px">
<div style="display: flex; align-items: baseline; gap: 12px">{H2}Modules in series</h2><span style="margin-left: auto; font-family: 'Geist Mono', monospace; font-size: 12px; color: #A9B2C0">14 to 29 fit</span></div>
<div style="position: relative; height: 44px">
<div style="position: absolute; left: 0; right: 0; top: 8px; height: 8px; border-radius: 4px; background: #090C10; box-shadow: inset 0 1px 2px rgba(0,0,0,0.7)"></div>
<div style="position: absolute; left: 28%; width: 44%; top: 8px; height: 8px; border-radius: 4px; background: #3DD6A0; opacity: 0.55"></div>
<div style="position: absolute; left: calc(72% - 2px); top: 2px; width: 4px; height: 20px; border-radius: 2px; background: #FFB020; box-shadow: 0 0 0 3px rgba(255,176,32,0.2)"></div>
<span style="position: absolute; left: 28%; top: 26px; transform: translateX(-50%); font-family: 'Geist Mono', monospace; font-size: 11px; color: #A9B2C0; white-space: nowrap">14 · MPPT minimum</span>
<span style="position: absolute; left: 72%; top: 26px; transform: translateX(-50%); font-family: 'Geist Mono', monospace; font-size: 11px; color: #F2F4F7; white-space: nowrap">29 · Voc limit</span>
</div>
<div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #A9B2C0">{TICK}<span>Voc at 11.9 °C is 1,480 V, limit 1,500 V. Vmp at 64.3 °C cell is 1,097 V, MPPT minimum 500 V.</span></div>
</section>

<section style="flex-grow: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px">
<div style="display: flex; align-items: center; gap: 12px">{H2}Options</h2><span style="margin-left: auto; font-size: 12px; color: #7C8696">series × strings · kWp · DC/AC · MWh</span></div>
{option('A', 'Recommended', '29 × 22 · 357.28 · 1.30', '617.8', TICK, True)}
{option('B', 'Fills the inverter', '26 × 24 · 349.44 · 1.27', '607.7', TICK)}
{option('C', 'Lower clipping', '28 × 22 · 344.96 · 1.25', '602.9', TICK)}
{option('D', 'Below target, 2 inverters', '26 × 27 · 393.12 · 0.71', '700.9', NOTE)}
{option('E', 'Below target, 2 inverters', '28 × 25 · 392.00 · 0.71', '700.5', NOTE)}
<button style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 40px; background: transparent; border: 1px dashed #2F3847; border-radius: 12px; color: #A9B2C0; font-size: 13px; cursor: pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add your own</button>
</section>

<button style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px; background: #12161D; border: 1px solid #232A36; border-radius: 12px; text-align: left; font-size: 13px; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)"><span style="flex-grow: 1; color: #A9B2C0; white-space: nowrap">Sizing temperatures</span><span style="font-family: 'Geist Mono', monospace; font-size: 12px; white-space: nowrap">11.9 to 39.3 °C</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C8696" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>'''
s_str = replace_between(s, '<aside aria-label="Array inspector"', '</aside>', aside('Strings inspector', body))
# callout for string 12: 4th string of row 2 -> available positions 43.5..58 of row 2
cols2 = AVAIL[2]
cmid = cols2[36]
xm = colx(cmid)
ymid, zmid = 13.9 + 2.2, 0.5 + 0.6
cx = (E + A * xm + C * ymid) * 1.0255
cy = (F + B * xm + D * ymid - ZK * zmid - 50) * 1.0255
callout = f'''<div style="position: absolute; left: {cx:.0f}px; top: {cy - 58:.0f}px; width: 1px; height: 52px; background: #FFFFFF"></div>
<div style="position: absolute; left: {cx - 150:.0f}px; top: {cy - 120:.0f}px; display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; background: #12161D; border: 1px solid #2F3847; border-radius: 12px; white-space: nowrap; {FLOAT}">
<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500"><span style="width: 12px; height: 12px; border-radius: 3px; background: {MPPT[2]}"></span>String 12 · INV-1, MPPT 3</div>
<div style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #A9B2C0">29 modules · Voc cold 1,480 V · 63 m of cable</div>
</div>'''
s_str = s_str.replace('@CALLOUT@', callout)
open(P + 'StringsLens.dc.html', 'w').write(s_str)

# =====================================================================================
# STRINGS LENS, NO SYSTEM VOLTAGE YET
# =====================================================================================
nv_svg = scene(v1030, 'grid', colouring={r: [(0, len(AVAIL[r]), 'ghost', None)] for r in range(6)}, keepouts=False,
               label='3D view of the roof with all 790 module positions in grey: no strings yet')
s = swap_lens(main, 'Strings')
s = s.replace('<title>Studio, desktop</title>', '<title>Studio, Strings lens, no system voltage yet</title>')
s = s.replace('letter-spacing: -0.02em">Array</div>', 'letter-spacing: -0.02em">Strings</div>')
s = s.replace('790 positions · 28 tables · 6 rows · 1,646 m² of modules', '790 positions ready · no strings yet')
s = s.replace('<div style="position: absolute; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px">', '<div style="position: absolute; z-index: 1; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px">')
s = s.replace('<div style="position: absolute; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">', '<div style="position: absolute; z-index: 1; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">')
wrapper = f'''<div style="position: absolute; left: 10px; top: 104px; width: 964px; height: 492px">
{nv_svg}
</div>
'''
s = replace_between(s, '<div style="position: absolute; left: 10px; top: 104px; width: 964px; height: 492px">', '<div style="position: absolute; left: 24px; bottom: 116px;', wrapper, include_end=False)
s = replace_between(s, '<div style="position: absolute; left: 24px; bottom: 116px;', '<section aria-label="Design vitals"', '', include_end=False)
# vitals: only what is known
a = s.index('<section aria-label="Design vitals"')
b = s.index('</section>', a) + len('</section>')
cell = lambda l, val, u, first=False: f'<div style="display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 0 18px{"" if first else "; border-left: 1px solid #232A36"}"><div style="font-size: 12px; color: #A9B2C0">{l}</div><div style="font-family: \'Geist Mono\', monospace; font-weight: 500; font-size: 16px">{val} <span style="font-family: Geist, sans-serif; font-size: 12px; color: #A9B2C0; font-weight: 400">{u}</span></div></div>'
vit = (f'<section aria-label="Design vitals" style="position: absolute; left: 20px; right: 20px; bottom: 20px; height: 78px; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1fr 1fr 2.4fr; white-space: nowrap; background: #12161D; border: 1px solid #232A36; border-radius: 16px; {FLOAT}">'
       + cell('Roof', '3,600', 'm²', True) + cell('Positions', '790', 'modules') + cell('If all were used', '442.40', 'kWp')
       + f'<a href="StringsLensNoVoltage.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 0 18px; background: #1E1A10; border-left: 1px solid #3A3220; border-radius: 0 15px 15px 0; color: #F2F4F7"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFB020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg><span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 13px; font-weight: 500">Choose a system voltage to size the strings</span><span style="font-size: 12px; color: #A9B2C0">600, 1000 or 1500 V. Nothing is sized until you choose.</span></span></a></section>')
s = s[:a] + vit + s[b:]
body = f'''{inverter_card}

<section style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #1E1A10; border: 1px solid #FFB020; border-radius: 14px; box-shadow: 0 0 0 4px rgba(255,176,32,0.14)">
<div style="display: flex; align-items: center; gap: 10px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFB020" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg><h2 style="margin: 0; font-size: 16px; font-weight: 600">Choose a system voltage</h2></div>
<p style="margin: 0; font-size: 13px; color: #D5DAE2">Nothing is sized until you choose. This one is yours to decide: it depends on the site and its equipment.</p>
<div role="group" aria-label="System voltage" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
<button style="height: 52px; background: #151A22; border: 1px solid #2F3847; border-radius: 12px; font-family: 'Geist Mono', monospace; font-weight: 500; font-size: 15px; cursor: pointer; {RAISED}">600 V</button>
<button style="height: 52px; background: #151A22; border: 1px solid #2F3847; border-radius: 12px; font-family: 'Geist Mono', monospace; font-weight: 500; font-size: 15px; cursor: pointer; {RAISED}">1000 V</button>
<button style="height: 52px; background: #151A22; border: 1px solid #2F3847; border-radius: 12px; font-family: 'Geist Mono', monospace; font-weight: 500; font-size: 15px; cursor: pointer; {RAISED}">1500 V</button>
</div>
<div style="font-size: 12px; color: #A9B2C0">The module is rated 1500 V and the inverter 1500 V. The lowest of the three sets the limit.</div>
</section>

<section style="display: flex; flex-direction: column; gap: 8px">
{H2}Waiting for your choice</h2>
<div style="display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; height: 44px; border-bottom: 1px solid #1C222C; color: #A9B2C0"><span style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #2F3847"></span>Modules in series</div>
<div style="display: flex; align-items: center; gap: 10px; height: 44px; border-bottom: 1px solid #1C222C; color: #A9B2C0"><span style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #2F3847"></span>Stringing options and the recommendation</div>
<div style="display: flex; align-items: center; gap: 10px; height: 44px; border-bottom: 1px solid #1C222C; color: #A9B2C0"><span style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #2F3847"></span>Energy, PR and yield</div>
<div style="display: flex; align-items: center; gap: 10px; height: 44px; color: #A9B2C0"><span style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #2F3847"></span>Single-line diagram, BOM and exports</div>
</div>
</section>

<section style="display: flex; flex-direction: column; gap: 8px">
{H2}Already done</h2>
<div style="display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; height: 40px">{TICK}Layout: 790 positions</div>
<div style="display: flex; align-items: center; gap: 10px; height: 40px">{TICK}Weather: PVGIS, 8,760 hours</div>
<div style="display: flex; align-items: center; gap: 10px; height: 40px">{TICK}Shading for every module</div>
</div>
</section>'''
s = replace_between(s, '<aside aria-label="Array inspector"', '</aside>', aside('Strings inspector', body))
open(P + 'StringsLensNoVoltage.dc.html', 'w').write(s)
print('ok', f'sun az {az:.1f} el {el:.1f} v {v16[0]:.2f},{v16[1]:.2f} sunrise {rise:.2f}')
