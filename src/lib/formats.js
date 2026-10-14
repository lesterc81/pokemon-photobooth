import { CARD_W, CARD_H } from './layout.js'

// Trading card = 2.5" x 3.5" = 750 x 1050 px @ 300 DPI (exact 5:7)
export const FORMATS = [
  { id: 'card', label: 'Actual Card', sub: '5:7 • 300 DPI', w: 750, h: 1050, kind: 'card' },
  { id: 'phone', label: 'Phone', sub: '9:19.5', w: 1080, h: 2340, kind: 'wallpaper' },
  { id: 'story', label: 'Story / Reel', sub: '9:16', w: 1080, h: 1920, kind: 'wallpaper' },
  { id: 'square', label: 'Square', sub: '1:1', w: 1080, h: 1080, kind: 'wallpaper' },
  { id: 'desktop', label: 'Desktop', sub: '16:9', w: 1920, h: 1080, kind: 'wallpaper' },
]

export function getFormat(id) {
  return FORMATS.find((f) => f.id === id) || FORMATS[0]
}

export const WALLPAPER_MARGIN_X = 0.08
export const WALLPAPER_MARGIN_Y = 0.07

export function computePlacement(format) {
  const { w: outW, h: outH, kind } = format
  if (kind === 'card') {
    return { outW, outH, cardX: 0, cardY: 0, cardW: outW, cardH: outH, scale: outW / CARD_W }
  }
  const fit = Math.min(
    (outW * (1 - WALLPAPER_MARGIN_X * 2)) / CARD_W,
    (outH * (1 - WALLPAPER_MARGIN_Y * 2)) / CARD_H
  )
  const cardW = CARD_W * fit
  const cardH = CARD_H * fit
  return {
    outW, outH,
    cardX: (outW - cardW) / 2,
    cardY: (outH - cardH) / 2,
    cardW, cardH,
    scale: fit,
  }
}
