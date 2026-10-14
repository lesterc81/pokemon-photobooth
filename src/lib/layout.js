export const CARD_W = 750
export const CARD_H = 1050
export const PAD = 26

export const CL = PAD + 28
export const CR = CARD_W - PAD - 28

export const FONT_HEAD = '"Baloo 2", "Arial Black", "Segoe UI", sans-serif'
export const FONT_BODY = '"Nunito", "Segoe UI", system-ui, sans-serif'

export const HP_RED = '#ee1c25'
export const CREAM = '#141414'
export const INK = '#14110c'

let mctx = null
function measureCtx() {
  if (!mctx) mctx = document.createElement('canvas').getContext('2d')
  return mctx
}

function textWidth(text, weight, family, size) {
  const c = measureCtx()
  c.font = `${weight} ${size}px ${family}`
  return c.measureText(text || ' ').width
}

export function fitSize(text, weight, family, maxWidth, maxSize, minSize = 13) {
  let size = maxSize
  while (size > minSize && textWidth(text, weight, family, size) > maxWidth) size -= 1
  return size
}

export const OUTLINE_GLOW =
  '1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff, ' +
  '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, ' +
  '2px 3px 4px rgba(0,0,0,0.35)'

const DARK_GLOW = '0 2px 4px rgba(0,0,0,0.6)'

function field(box, extra = {}) {
  return { ...box, shadow: extra.shadow || OUTLINE_GLOW }
}

export function computeLayout(design, meta) {
  const inner = { x: PAD, y: PAD, w: CARD_W - PAD * 2, h: CARD_H - PAD * 2, r: 44 }
  const ink = design.ink
  const inkSoft = ink + 'dd'

  const pill = { x: CL, y: 40, w: 214, h: 46, r: 13 }
  const stage = field({
    x: pill.x + 8, y: pill.y + 3, w: pill.w - 16, h: pill.h - 6,
    size: fitSize(meta.stage, 800, FONT_HEAD, pill.w - 30, 26, 13),
    align: 'center', color: INK, weight: 800, family: FONT_HEAD,
  }, { shadow: 'none' })

  const headerY = 94
  const headerH = 76

  const energyTop = { cx: CR - 34, cy: headerY + headerH / 2, r: 34, type: design.energy }

  const hpBoxW = 116
  const hpNum = field({
    x: energyTop.cx - energyTop.r - 16 - hpBoxW, y: headerY, w: hpBoxW, h: headerH,
    size: fitSize(String(meta.hp), 800, FONT_HEAD, hpBoxW, 54, 24),
    align: 'left', color: HP_RED, weight: 800, family: FONT_HEAD,
  })

  const name = field({
    x: CL, y: headerY, w: hpNum.x - 20 - CL, h: headerH,
    size: fitSize(meta.name, 800, FONT_HEAD, hpNum.x - 20 - CL, 56, 22),
    align: 'left', color: ink, weight: 800, family: FONT_HEAD,
  })

  const hpLabel = {
    right: hpNum.x - 8, cy: headerY + headerH / 2 - 4, size: 32,
  }

  const art = { x: CL, y: 192, w: CR - CL, h: 380 }

  const captionY = art.y + art.h + 16
  const caption = field({
    x: CL, y: captionY, w: 456, h: 44,
    size: fitSize(meta.caption, 600, FONT_BODY, 456, 25, 14),
    align: 'left', color: inkSoft, weight: 600, italic: true, family: FONT_BODY,
  })
  const number = field({
    x: 530, y: captionY, w: CR - 530, h: 44,
    size: 23, align: 'right', color: inkSoft, weight: 700, family: FONT_BODY,
  })

  const rule1Y = captionY + caption.h + 12

  const attacks = (meta.attacks || []).map((a, i) => {
    const cost = design.attacks[i]?.cost || []
    const nameX = CL + cost.length * 52 + 16
    const topY = rule1Y + 14 + i * 112
    const dmgX = 560
    return {
      cost, costCy: topY + 34, costX: CL,
      name: field({
        x: nameX, y: topY, w: dmgX - 24 - nameX, h: 62,
        size: fitSize(a.name, 800, FONT_HEAD, dmgX - 24 - nameX, 38, 17),
        align: 'left', color: ink, weight: 800, family: FONT_HEAD,
      }),
      dmg: field({
        x: dmgX, y: topY + 2, w: CR - dmgX, h: 60,
        size: fitSize(a.dmg, 800, FONT_HEAD, CR - dmgX, 46, 18),
        align: 'right', color: ink, weight: 800, family: FONT_HEAD,
      }),
      desc: field({
        x: nameX, y: topY + 66, w: CR - nameX, h: 38,
        size: fitSize(a.desc, 600, FONT_BODY, CR - nameX, 23, 12),
        align: 'left', color: inkSoft, weight: 600, italic: true, family: FONT_BODY,
      }),
    }
  })

  const lastBottom = rule1Y + 14 + Math.max(1, attacks.length) * 112 - 6
  const rule2Y = lastBottom + 4

  const labels = { y: rule2Y + 8, h: 30, size: 20 }
  const valuesCy = labels.y + labels.h + 28
  const footer = { y: valuesCy + 30, h: 28, size: 20 }

  const cols = [0, 1, 2].map((i) => inner.x + (inner.w * (2 * i + 1)) / 6)

  return {
    inner, pill, stage, name, hpNum, hpLabel, energyTop,
    art, caption, number, rule1Y, attacks, rule2Y,
    labels, valuesCy, footer, cols, ink, inkSoft,
  }
}
