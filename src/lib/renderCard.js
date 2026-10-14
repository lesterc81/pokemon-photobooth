import { drawEnergy } from './energy.js'
import { FILTERS } from './designs.js'
import { computePlacement } from './formats.js'
import { CARD_W, CARD_H, CL, CR, FONT_HEAD, FONT_BODY, HP_RED, CREAM, INK } from './layout.js'

export { CARD_W, CARD_H }

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

function fillText(ctx, text, x, y, opts = {}) {
  const {
    size = 32, weight = 900, color = '#000', align = 'left',
    baseline = 'middle', family = FONT_HEAD, maxWidth, italic = false,
  } = opts
  ctx.save()
  const apply = (s) => {
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${s}px ${family}`
  }
  let s = size
  apply(s)
  if (maxWidth) {
    while (ctx.measureText(text).width > maxWidth && s > 10) apply(--s)
  }
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(text, x, y)
  ctx.restore()
}

function outlineText(ctx, text, x, y, opts = {}) {
  const { outline = '#fff', width = 4, ...rest } = opts
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  const measure = () => {
    const { size, weight, family = FONT_HEAD, italic } = rest
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`
  }
  measure()
  let size = rest.size
  if (rest.maxWidth) {
    while (ctx.measureText(text).width > rest.maxWidth && size > 10) {
      size -= 1
      rest.size = size
      measure()
    }
  }
  ctx.textAlign = rest.align || 'left'
  ctx.textBaseline = rest.baseline || 'middle'
  ctx.lineWidth = width
  ctx.strokeStyle = outline
  ctx.strokeText(text, x, y)
  ctx.fillStyle = rest.color
  ctx.fillText(text, x, y)
  ctx.restore()
}

function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function drawPattern(ctx, design, x, y, w, h) {
  let hash = 0
  for (let i = 0; i < design.id.length; i++) hash = (hash * 31 + design.id.charCodeAt(i)) >>> 0
  const rnd = seededRandom(hash + 1)

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.15

  switch (design.pattern) {
    case 'rays': {
      ctx.translate(x + w / 2, y + h * 0.3)
      ctx.globalAlpha = 0.11
      for (let i = 0; i < 26; i++) {
        ctx.save()
        ctx.rotate((Math.PI * 2 * i) / 26)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(40, 1500)
        ctx.lineTo(-40, 1500)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      break
    }
    case 'stripes': {
      ctx.lineWidth = 24
      ctx.globalAlpha = 0.09
      for (let i = -h; i < w + h; i += 70) {
        ctx.beginPath()
        ctx.moveTo(x + i, y)
        ctx.lineTo(x + i + h, y + h)
        ctx.stroke()
      }
      break
    }
    case 'dots': {
      ctx.globalAlpha = 0.2
      for (let yy = 0; yy < h; yy += 52) {
        for (let xx = (yy / 52) % 2 ? 26 : 0; xx < w; xx += 52) {
          ctx.beginPath()
          ctx.arc(x + xx, y + yy, 7, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case 'stars': {
      ctx.globalAlpha = 0.45
      for (let i = 0; i < 64; i++) {
        const cx = x + rnd() * w
        const cy = y + rnd() * h
        const r = 2 + rnd() * 7
        ctx.beginPath()
        for (let p = 0; p < 8; p++) {
          const a = (Math.PI / 4) * p - Math.PI / 2
          const rad = p % 2 === 0 ? r : r * 0.35
          p === 0 ? ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
                  : ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
        }
        ctx.closePath()
        ctx.fill()
      }
      break
    }
    case 'waves': {
      ctx.lineWidth = 7
      ctx.globalAlpha = 0.16
      for (let yy = 20; yy < h; yy += 58) {
        ctx.beginPath()
        for (let xx = 0; xx <= w; xx += 14) {
          const py = y + yy + Math.sin(xx / 42) * 12
          xx === 0 ? ctx.moveTo(x + xx, py) : ctx.lineTo(x + xx, py)
        }
        ctx.stroke()
      }
      break
    }
    case 'grid': {
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.18
      for (let xx = 0; xx <= w; xx += 48) {
        ctx.beginPath(); ctx.moveTo(x + xx, y); ctx.lineTo(x + xx, y + h); ctx.stroke()
      }
      for (let yy = 0; yy <= h; yy += 48) {
        ctx.beginPath(); ctx.moveTo(x, y + yy); ctx.lineTo(x + w, y + yy); ctx.stroke()
      }
      break
    }
    case 'rings': {
      ctx.lineWidth = 5
      ctx.globalAlpha = 0.14
      for (let r = 50; r < 900; r += 52) {
        ctx.beginPath()
        ctx.arc(x + w / 2, y + h * 0.3, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }
    case 'holo': {
      ctx.globalAlpha = 1
      const bands = ['#ff5f6d', '#ffc371', '#9be15d', '#5ee7df', '#b490ca', '#ff9a9e']
      bands.forEach((c, i) => {
        ctx.save()
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = c
        ctx.lineWidth = 44
        ctx.beginPath()
        ctx.moveTo(x - 140 + i * 90, y + h + 140)
        ctx.lineTo(x + w * 0.55 + i * 90, y - 140)
        ctx.stroke()
        ctx.restore()
      })
      break
    }
    case 'galaxy': {
      const neb = ctx.createRadialGradient(x + w * 0.62, y + h * 0.35, 10, x + w * 0.62, y + h * 0.35, h * 0.75)
      neb.addColorStop(0, 'rgba(255,255,255,0.35)')
      neb.addColorStop(0.45, 'rgba(180,150,255,0.18)')
      neb.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = neb
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 140; i++) {
        const cx = x + rnd() * w
        const cy = y + rnd() * h
        const r = rnd() < 0.9 ? 0.8 + rnd() * 1.8 : 3 + rnd() * 4
        ctx.globalAlpha = 0.4 + rnd() * 0.6
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'candy': {
      ctx.lineWidth = 34
      ctx.lineCap = 'round'
      for (let i = -h; i < w + h; i += 96) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(x + i, y)
        ctx.lineTo(x + i + h, y + h)
        ctx.stroke()
        ctx.strokeStyle = 'rgba(0,0,0,0.16)'
        ctx.beginPath()
        ctx.moveTo(x + i + 34, y)
        ctx.lineTo(x + i + 34 + h, y + h)
        ctx.stroke()
      }
      break
    }
    case 'circuit': {
      ctx.globalAlpha = 0.85
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      const step = 120
      for (let gy = 0; gy <= h; gy += step) {
        for (let gx = 0; gx <= w; gx += step) {
          const px = x + gx
          const py = y + gy
          const dir = rnd() < 0.5
          ctx.beginPath()
          ctx.moveTo(px, py)
          if (dir) { ctx.lineTo(px + step / 2, py); ctx.lineTo(px + step / 2, py + step / 2) }
          else { ctx.lineTo(px, py + step / 2); ctx.lineTo(px + step / 2, py + step / 2) }
          ctx.stroke()
          if (rnd() < 0.4) {
            ctx.beginPath()
            ctx.arc(px, py, 7, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      break
    }
    case 'confetti': {
      const cols = ['#ffffff', '#ffe066', '#ff6b6b', '#4dd0e1', '#8affc1', '#c0a4ff']
      for (let i = 0; i < 120; i++) {
        const cx = x + rnd() * w
        const cy = y + rnd() * h
        const s = 6 + rnd() * 12
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(rnd() * Math.PI * 2)
        ctx.globalAlpha = 0.5 + rnd() * 0.4
        ctx.fillStyle = cols[(rnd() * cols.length) | 0]
        if (rnd() < 0.5) ctx.fillRect(-s / 2, -s / 4, s, s / 2)
        else { ctx.beginPath(); ctx.arc(0, 0, s / 2.6, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      }
      break
    }
    case 'hearts': {
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 46; i++) {
        const cx = x + rnd() * w
        const cy = y + rnd() * h
        const s = 9 + rnd() * 20
        ctx.globalAlpha = 0.16 + rnd() * 0.32
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate((rnd() - 0.5) * 0.6)
        ctx.beginPath()
        ctx.moveTo(0, s * 0.32)
        ctx.bezierCurveTo(s * 0.9, -s * 0.4, s * 0.35, -s * 1.1, 0, -s * 0.5)
        ctx.bezierCurveTo(-s * 0.35, -s * 1.1, -s * 0.9, -s * 0.4, 0, s * 0.32)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      break
    }
    case 'bubbles': {
      for (let i = 0; i < 40; i++) {
        const cx = x + rnd() * w
        const cy = y + rnd() * h
        const r = 10 + rnd() * 46
        ctx.globalAlpha = 0.12 + rnd() * 0.22
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 0.4
        ctx.lineWidth = 3
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
      }
      break
    }
    case 'zigzag': {
      ctx.lineWidth = 12
      ctx.globalAlpha = 0.2
      const amp = 26
      for (let yy = 0; yy <= h + 60; yy += 60) {
        ctx.beginPath()
        for (let xx = 0; xx <= w; xx += amp * 2) {
          const py = y + yy + ((xx / (amp * 2)) % 2 === 0 ? -amp : amp)
          xx === 0 ? ctx.moveTo(x + xx, py) : ctx.lineTo(x + xx, py)
        }
        ctx.stroke()
      }
      break
    }
    case 'checker': {
      const s = 90
      ctx.globalAlpha = 0.14
      for (let gy = 0; gy < h; gy += s) {
        for (let gx = 0; gx < w; gx += s) {
          if (((gx / s) + (gy / s)) % 2 === 0) ctx.fillRect(x + gx, y + gy, s, s)
        }
      }
      break
    }
    case 'crosshatch': {
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.12
      for (let i = -h; i < w + h; i += 20) {
        ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke()
      }
      break
    }
    case 'scribble': {
      ctx.lineWidth = 4
      ctx.globalAlpha = 0.14
      ctx.lineCap = 'round'
      for (let i = 0; i < 90; i++) {
        const cx = x + rnd() * w
        const cy = y + rnd() * h
        const len = 24 + rnd() * 70
        const a = rnd() * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.quadraticCurveTo(
          cx + Math.cos(a + 0.6) * len * 0.5, cy + Math.sin(a + 0.6) * len * 0.5,
          cx + Math.cos(a) * len, cy + Math.sin(a) * len
        )
        ctx.stroke()
      }
      break
    }
    default:
      break
  }
  ctx.restore()
}

function drawHolo(ctx, strength, x, y, w, h) {
  if (!strength) return
  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = strength
  const g = ctx.createLinearGradient(x, y + h, x + w, y)
  g.addColorStop(0, '#ff004c')
  g.addColorStop(0.2, '#ff9900')
  g.addColorStop(0.4, '#ffee00')
  g.addColorStop(0.6, '#00e5a0')
  g.addColorStop(0.8, '#00b3ff')
  g.addColorStop(1, '#a600ff')
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
  ctx.restore()

  ctx.save()
  ctx.globalCompositeOperation = 'soft-light'
  ctx.globalAlpha = 0.8
  for (let i = -h; i < w + h; i += 128) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath()
    ctx.moveTo(x + i, y + h)
    ctx.lineTo(x + i + 66, y + h)
    ctx.lineTo(x + i + 66 + h, y)
    ctx.lineTo(x + i + h, y)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function photoClipPath(ctx, frame, x, y, w, h) {
  ctx.beginPath()
  if (frame === 'arch') {
    const r = w / 2
    ctx.moveTo(x, y + h)
    ctx.lineTo(x, y + r)
    ctx.arc(x + r, y + r, r, Math.PI, 0)
    ctx.lineTo(x + w, y + h)
    ctx.closePath()
  } else if (frame === 'circle') {
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2)
    ctx.closePath()
  } else if (frame === 'rounded') {
    rr(ctx, x, y, w, h, 52)
  } else {
    rr(ctx, x, y, w, h, 6)
  }
}

function boxBlur(src, W, H, radius) {
  if (radius <= 0) return src
  const tmp = new Float32Array(W * H)
  const out = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0, cnt = 0
      for (let k = -radius; k <= radius; k++) {
        const xx = x + k
        if (xx >= 0 && xx < W) { sum += src[y * W + xx]; cnt++ }
      }
      tmp[y * W + x] = sum / cnt
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0, cnt = 0
      for (let k = -radius; k <= radius; k++) {
        const yy = y + k
        if (yy >= 0 && yy < H) { sum += tmp[yy * W + x]; cnt++ }
      }
      out[y * W + x] = sum / cnt
    }
  }
  return out
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function noiseField(W, H, fx, fy, seed, K = 3) {
  const out = new Float32Array(W * H)
  const rnd = mulberry32(seed)
  const ax = [], ay = [], ph = []
  for (let i = 0; i < K; i++) {
    ax.push(fx * (0.5 + rnd()))
    ay.push(fy * (0.5 + rnd()))
    ph.push(rnd() * Math.PI * 2)
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let s = 0
      for (let i = 0; i < K; i++) s += Math.sin(x * ax[i] + y * ay[i] + ph[i])
      out[y * W + x] = s / K
    }
  }
  return out
}

function processHandDrawn(src, dst, W, H) {
  const n = W * H
  const gray = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const j = i << 2
    gray[i] = 0.299 * src[j] + 0.587 * src[j + 1] + 0.114 * src[j + 2]
  }
  const sm = boxBlur(gray, W, H, 2)

  const e = new Float32Array(n)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const tl = sm[i - W - 1], t = sm[i - W], tr = sm[i - W + 1]
      const l = sm[i - 1], r = sm[i + 1]
      const bl = sm[i + W - 1], b = sm[i + W], br = sm[i + W + 1]
      const gx = (tr + 2 * r + br) - (tl + 2 * l + bl)
      const gy = (bl + 2 * b + br) - (tl + 2 * t + tr)
      e[i] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  const wobX = noiseField(W, H, 0.032, 0.042, 1337)
  const wobY = noiseField(W, H, 0.038, 0.028, 7331)
  const hatchN = noiseField(W, H, 0.09, 0.09, 4242)

  const levels = 5
  const step = 255 / (levels - 1)
  const sat = 1.22
  const paper = 0.08
  const inkR = 30, inkG = 27, inkB = 34

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const j = i << 2

      let r = src[j], g = src[j + 1], b = src[j + 2]
      const gg = 0.299 * r + 0.587 * g + 0.114 * b
      r = gg + (r - gg) * sat
      g = gg + (g - gg) * sat
      b = gg + (b - gg) * sat
      r = Math.round(r / step) * step
      g = Math.round(g / step) * step
      b = Math.round(b / step) * step
      r = r * (1 - paper) + 255 * paper
      g = g * (1 - paper) + 255 * paper
      b = b * (1 - paper) + 255 * paper

      const dark = Math.max(0, Math.min(1, (170 - sm[i]) / 170))
      if (dark > 0.02) {
        const s1 = x + y + hatchN[i] * 6
        const s2 = x - y + hatchN[i] * 6
        const p1 = ((s1 % 8) + 8) % 8
        const p2 = ((s2 % 8) + 8) % 8
        let hatch = 0
        if (p1 < 1.7) hatch += 1
        if (p2 < 1.7) hatch += 0.8
        const cell = Math.floor((x + y) * 0.35 + hatchN[i] * 2)
        const dash = (cell & 1) ? 1 : 0.35
        hatch = Math.min(1, hatch) * dark * (0.55 + 0.45 * dash)
        r *= 1 - 0.55 * hatch
        g *= 1 - 0.55 * hatch
        b *= 1 - 0.55 * hatch
      }

      const xx = Math.round(x + wobX[i] * 3)
      const yy = Math.round(y + wobY[i] * 3)
      let mag = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = xx + dx, py = yy + dy
          if (px >= 0 && px < W && py >= 0 && py < H) {
            const v = e[py * W + px]
            if (v > mag) mag = v
          }
        }
      }
      let line = (mag / 1020) * 1.35
      line = Math.max(0, Math.min(1, (line - 0.12) / 0.30))
      const tex = 0.68 + 0.32 * ((hash2(x * 7 + 3, y * 11 + 5) + hatchN[i] * 0.5) * 0.5 + 0.5)
      line *= tex

      r = r * (1 - line) + inkR * line
      g = g * (1 - line) + inkG * line
      b = b * (1 - line) + inkB * line

      const gr = 0.965 + 0.035 * hash2(x * 13 + 1, y * 17 + 9)
      dst[j] = Math.max(0, Math.min(255, r * gr))
      dst[j + 1] = Math.max(0, Math.min(255, g * gr))
      dst[j + 2] = Math.max(0, Math.min(255, b * gr))
      dst[j + 3] = 255
    }
  }
}

function processEffect(src, dst, W, H, kind) {
  if (kind === 'handrawn') { processHandDrawn(src, dst, W, H); return }
  const n = W * H
  const gray = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const j = i << 2
    gray[i] = 0.299 * src[j] + 0.587 * src[j + 1] + 0.114 * src[j + 2]
  }
  const radius = kind === 'sketch' ? 1 : 2
  const sm = boxBlur(gray, W, H, radius)

  const levels = kind === 'cartoon' ? 4 : kind === 'doodle' ? 5 : 0
  const edgeGain = kind === 'cartoon' ? 1.7 : kind === 'doodle' ? 1.25 : 1.5
  const edgeGamma = kind === 'sketch' ? 0.85 : 0.7
  const sat = kind === 'cartoon' ? 1.45 : kind === 'doodle' ? 1.18 : 0
  const paper = kind === 'cartoon' ? 0.05 : 0.16
  const inkR = 38, inkG = 34, inkB = 44

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const j = i << 2
      let gx = 0, gy = 0
      if (x > 0 && x < W - 1 && y > 0 && y < H - 1) {
        const tl = sm[i - W - 1], t = sm[i - W], tr = sm[i - W + 1]
        const l = sm[i - 1], r = sm[i + 1]
        const bl = sm[i + W - 1], b = sm[i + W], br = sm[i + W + 1]
        gx = (tr + 2 * r + br) - (tl + 2 * l + bl)
        gy = (bl + 2 * b + br) - (tl + 2 * t + tr)
      }
      const mag = Math.min(1, (Math.sqrt(gx * gx + gy * gy) / 255) * edgeGain)
      const edge = Math.pow(mag, edgeGamma)

      if (kind === 'sketch') {
        const line = 1 - edge
        const shade = 0.82 + 0.18 * (sm[i] / 255)
        const v = Math.max(0, 255 * line * shade)
        dst[j] = dst[j + 1] = dst[j + 2] = v
        dst[j + 3] = 255
      } else {
        let r = src[j], g = src[j + 1], b = src[j + 2]
        if (sat) {
          const gg = 0.299 * r + 0.587 * g + 0.114 * b
          r = gg + (r - gg) * sat
          g = gg + (g - gg) * sat
          b = gg + (b - gg) * sat
        }
        if (levels) {
          const step = 255 / (levels - 1)
          r = Math.round(r / step) * step
          g = Math.round(g / step) * step
          b = Math.round(b / step) * step
        }
        r = r * (1 - paper) + 255 * paper
        g = g * (1 - paper) + 255 * paper
        b = b * (1 - paper) + 255 * paper
        dst[j] = r * (1 - edge) + inkR * edge
        dst[j + 1] = g * (1 - edge) + inkG * edge
        dst[j + 2] = b * (1 - edge) + inkB * edge
        dst[j + 3] = 255
      }
    }
  }
}

const effectCache = new WeakMap()

function effectLayer(img, w, h, kind, mirrored) {
  const W = Math.max(1, Math.round(w))
  const H = Math.max(1, Math.round(h))
  const key = `${kind}|${W}x${H}|${mirrored ? 1 : 0}`
  const hit = effectCache.get(img)
  if (hit && hit.key === key) return hit.canvas

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const cx = c.getContext('2d', { willReadFrequently: true })
  const sw = img.naturalWidth || img.width
  const sh = img.naturalHeight || img.height
  const scale = Math.max(W / sw, H / sh)
  const dw = sw * scale
  const dh = sh * scale
  const dx = (W - dw) / 2
  const dy = (H - dh) / 2
  cx.save()
  if (mirrored) { cx.translate(W, 0); cx.scale(-1, 1) }
  cx.drawImage(img, dx, dy, dw, dh)
  cx.restore()

  const src = cx.getImageData(0, 0, W, H)
  const out = cx.createImageData(W, H)
  processEffect(src.data, out.data, W, H, kind)
  cx.putImageData(out, 0, 0)

  effectCache.set(img, { key, canvas: c })
  return c
}

function drawPhoto(ctx, photo, filterId, frame, x, y, w, h) {
  const filter = FILTERS.find((f) => f.id === filterId) || FILTERS[0]
  const effect = filter.kind

  ctx.save()
  photoClipPath(ctx, frame, x, y, w, h)
  ctx.clip()
  ctx.fillStyle = '#3b3f46'
  ctx.fillRect(x, y, w, h)

  const img = photo && photo.el
  if (img && img.naturalWidth) {
    if (effect) {
      ctx.drawImage(effectLayer(img, w, h, effect, photo.mirrored), x, y, w, h)
    } else {
      const sw = img.naturalWidth || img.width
      const sh = img.naturalHeight || img.height
      const scale = Math.max(w / sw, h / sh)
      const dw = sw * scale
      const dh = sh * scale
      const dx = x + (w - dw) / 2
      const dy = y + (h - dh) / 2
      ctx.save()
      if (filter.css && filter.css !== 'none') ctx.filter = filter.css
      if (photo.mirrored) {
        ctx.translate(x + w / 2, 0)
        ctx.scale(-1, 1)
        ctx.translate(-(x + w / 2), 0)
      }
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
    }
  } else {
    ctx.fillStyle = '#454a52'
    ctx.fillRect(x, y, w, h)
    fillText(ctx, 'Kunan o mag-upload ng litrato', x + w / 2, y + h / 2, {
      size: 30, weight: 700, color: 'rgba(255,255,255,0.6)', align: 'center', family: FONT_BODY,
    })
  }

  if (!effect) {
    const shine = ctx.createLinearGradient(x, y, x + w * 0.6, y + h)
    shine.addColorStop(0, 'rgba(255,255,255,0.28)')
    shine.addColorStop(0.4, 'rgba(255,255,255,0.04)')
    shine.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = shine
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()

  // thick dark art-frame border (classic style)
  ctx.save()
  photoClipPath(ctx, frame, x, y, w, h)
  ctx.lineWidth = 12
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.restore()
}

function drawEnergyCost(ctx, cost, x, cy, r = 22) {
  let cx = x
  cost.forEach((type) => {
    drawEnergy(ctx, cx + r, cy, r, type)
    cx += r * 2 + 8
  })
  return cx
}

function star(ctx, cx, cy, r, color) {
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 === 0 ? r : r * 0.44
    const px = cx + Math.cos(a) * rad
    const py = cy + Math.sin(a) * rad
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'
  ctx.stroke()
  ctx.restore()
}

function drawWallpaper(ctx, design, w, h) {
  const [c1, c2, c3] = design.bg
  const g = ctx.createLinearGradient(0, 0, w * 0.35, h)
  g.addColorStop(0, c1)
  g.addColorStop(0.5, c2)
  g.addColorStop(1, c3)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.3, 20, w * 0.5, h * 0.3, Math.max(w, h) * 0.72)
  glow.addColorStop(0, 'rgba(255,255,255,0.42)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  drawPattern(ctx, design, 0, 0, w, h)
  drawHolo(ctx, design.holo, 0, 0, w, h)

  const shade = ctx.createLinearGradient(0, 0, 0, h)
  shade.addColorStop(0, 'rgba(0,0,0,0.14)')
  shade.addColorStop(0.45, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.42)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, w, h)

  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.78)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

let cardBuf = null
function cardCanvas() {
  if (!cardBuf) {
    cardBuf = document.createElement('canvas')
    cardBuf.width = CARD_W
    cardBuf.height = CARD_H
  }
  return cardBuf
}

export function renderOutput(canvas, opts) {
  const { format, design, placement } = opts
  const pl = placement || computePlacement(format)
  const { outW, outH, cardX, cardY, cardW, cardH } = pl

  const buf = cardCanvas()
  renderCard(buf, opts)

  const ctx = canvas.getContext('2d')
  canvas.width = outW
  canvas.height = outH
  ctx.clearRect(0, 0, outW, outH)

  if (format.kind === 'wallpaper') {
    drawWallpaper(ctx, design, outW, outH)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = Math.max(22, cardW * 0.07)
    ctx.shadowOffsetY = Math.max(10, cardW * 0.035)
    ctx.drawImage(buf, cardX, cardY, cardW, cardH)
    ctx.restore()
  } else {
    ctx.drawImage(buf, cardX, cardY, cardW, cardH)
  }
}

export function renderCard(canvas, opts) {
  const { design, photo, frame, filter, meta, L, skip = null } = opts
  const ctx = canvas.getContext('2d')
  canvas.width = CARD_W
  canvas.height = CARD_H
  ctx.clearRect(0, 0, CARD_W, CARD_H)

  const inner = L.inner
  const ink = L.ink

  // --- cream border + card face ---
  ctx.save()
  rr(ctx, 0, 0, CARD_W, CARD_H, 58)
  ctx.clip()
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.restore()

  const BW = 24
  ctx.save()
  rr(ctx, BW, BW, CARD_W - BW * 2, CARD_H - BW * 2, 46)
  ctx.clip()
  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.restore()

  const FX = BW + 8
  const FY = BW + 8
  const FW = CARD_W - FX * 2
  const FH = CARD_H - FY * 2

  ctx.save()
  rr(ctx, FX, FY, FW, FH, 40)
  ctx.clip()

  const [c1, c2, c3] = design.bg
  const g = ctx.createLinearGradient(FX, FY, FX + FW * 0.4, FY + FH)
  g.addColorStop(0, c1)
  g.addColorStop(0.5, c2)
  g.addColorStop(1, c3)
  ctx.fillStyle = g
  ctx.fillRect(FX, FY, FW, FH)

  const glow = ctx.createRadialGradient(FX + FW * 0.3, FY + 90, 20, FX + FW * 0.3, FY + 90, FW)
  glow.addColorStop(0, 'rgba(255,255,255,0.5)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(FX, FY, FW, FH)

  drawPattern(ctx, design, FX, FY, FW, FH)
  drawHolo(ctx, design.holo, FX, FY, FW, FH)

  // --- stage pill background ---
  const p = L.pill
  ctx.save()
  rr(ctx, p.x, p.y, p.w, p.h, p.r)
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.restore()

  const drawField = (key, box, text) => {
    if (skip && skip.has(key)) return
    const tx = box.align === 'right' ? box.x + box.w
      : box.align === 'center' ? box.x + box.w / 2 : box.x
    const ty = box.y + box.h / 2
    const o = {
      size: box.size, weight: box.weight, color: box.color, align: box.align,
      family: box.family, italic: box.italic, maxWidth: box.w - 4,
    }
    if (box.shadow === 'none') {
      fillText(ctx, text, tx, ty, o)
    } else {
      outlineText(ctx, text, tx, ty, { ...o, outline: '#ffffff', width: Math.max(4, box.size * 0.14) })
    }
  }

  drawField('stage', L.stage, meta.stage)
  drawField('name', L.name, meta.name)
  drawField('hp', L.hpNum, meta.hp)
  drawField('caption', L.caption, meta.caption)
  drawField('number', L.number, meta.number)

  // --- HP label (value is editable overlay) ---
  outlineText(ctx, 'HP', L.hpLabel.right, L.hpLabel.cy, {
    size: L.hpLabel.size, weight: 900, color: HP_RED, align: 'right',
    outline: '#fff', width: 5, maxWidth: 120, family: FONT_HEAD,
  })

  // --- top-right type symbol ---
  drawEnergy(ctx, L.energyTop.cx, L.energyTop.cy, L.energyTop.r, L.energyTop.type)

  // --- art window ---
  const a = L.art
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  rr(ctx, a.x, a.y, a.w, a.h, 6)
  ctx.fillStyle = '#000'
  ctx.fill()
  ctx.restore()
  drawPhoto(ctx, photo, filter, frame, a.x, a.y, a.w, a.h)

  // --- dividers ---
  const divider = (y) => {
    ctx.save()
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(CL - 4, y)
    ctx.lineTo(CR + 4, y)
    ctx.stroke()
    ctx.restore()
  }
  divider(L.rule1Y)
  divider(L.rule2Y)

  // --- energy costs + attack text (attack text is editable overlay) ---
  L.attacks.forEach((atk, i) => {
    drawEnergyCost(ctx, atk.cost, atk.costX, atk.costCy, 22)
    const m = meta.attacks[i]
    if (m) {
      drawField(`a${i}name`, atk.name, m.name)
      drawField(`a${i}dmg`, atk.dmg, m.dmg)
      drawField(`a${i}desc`, atk.desc, m.desc)
    }
  })

  // --- weakness / resistance / retreat ---
  const labels = ['WEAKNESS', 'RESISTANCE', 'RETREAT COST']
  L.labels && labels.forEach((t, i) => {
    fillText(ctx, t, L.cols[i], L.labels.y + L.labels.h / 2, {
      size: L.labels.size, weight: 800, color: ink, align: 'center', family: FONT_BODY,
      maxWidth: 190,
    })
  })

  const vy = L.valuesCy
  // weakness
  drawEnergy(ctx, L.cols[0] - 30, vy, 24, design.weakness)
  fillText(ctx, '×2', L.cols[0] + 6, vy, { size: 30, weight: 900, color: ink, align: 'left' })
  // resistance
  drawEnergy(ctx, L.cols[1] - 46, vy, 24, design.resistance)
  fillText(ctx, '-30', L.cols[1] - 8, vy, { size: 30, weight: 900, color: ink, align: 'left' })
  // retreat
  if (design.retreat === 0) {
    fillText(ctx, '0', L.cols[2], vy, { size: 30, weight: 900, color: ink, align: 'center' })
  } else {
    const total = design.retreat * 34 - 8
    let rx = L.cols[2] - total / 2
    for (let i = 0; i < design.retreat; i++) {
      drawEnergy(ctx, rx + 16, vy, 16, 'colorless')
      rx += 34
    }
  }

  // --- footer ---
  const f = L.footer
  const fy = f.y + f.h / 2
  fillText(ctx, `Illus. CardBooth  •  ${design.setCode}`, CL, fy, {
    size: f.size, weight: 700, color: ink, family: FONT_BODY, maxWidth: 420,
  })
  fillText(ctx, design.rarity, CR - 34, fy, {
    size: f.size, weight: 800, color: ink, align: 'right', family: FONT_BODY, maxWidth: 170,
  })
  star(ctx, CR - 14, fy, 13, design.rarity.includes('Holo') || design.rarity.includes('Rare') ? '#ffd93b' : '#e8e8e8')

  ctx.restore()

  // --- inner face outline ---
  ctx.save()
  rr(ctx, FX, FY, FW, FH, 40)
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.stroke()
  ctx.restore()

  // --- outer edge ---
  ctx.save()
  rr(ctx, 2.5, 2.5, CARD_W - 5, CARD_H - 5, 57)
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.restore()
}
