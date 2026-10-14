const ENERGY = {
  fire:     { c1: '#ffb03a', c2: '#e03a11', ink: '#ffffff' },
  water:    { c1: '#7fd4ff', c2: '#1f6bd6', ink: '#ffffff' },
  grass:    { c1: '#9be36a', c2: '#2c9e3f', ink: '#ffffff' },
  electric: { c1: '#ffe86a', c2: '#e8a800', ink: '#3a2b00' },
  psychic:  { c1: '#e08cff', c2: '#9b2fc9', ink: '#ffffff' },
  fighting: { c1: '#e59a63', c2: '#a64b2a', ink: '#ffffff' },
  darkness: { c1: '#7d84b5', c2: '#232741', ink: '#ffffff' },
  metal:    { c1: '#e6edf5', c2: '#8794a5', ink: '#2a2f36' },
  dragon:   { c1: '#ffe08a', c2: '#b9862a', ink: '#3a2b00' },
  fairy:    { c1: '#ffc2e0', c2: '#f0539b', ink: '#ffffff' },
  colorless:{ c1: '#ffffff', c2: '#b9bdc4', ink: '#3a3f46' },
}

export function energyMeta(type) {
  return ENERGY[type] || ENERGY.colorless
}

function circle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.closePath()
}

function glyph(ctx, type, r) {
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = Math.max(1.2, r * 0.09)
  const s = r * 0.62
  switch (type) {
    case 'fire': {
      ctx.beginPath()
      ctx.moveTo(0, -s * 1.15)
      ctx.bezierCurveTo(s * 0.75, -s * 0.35, s * 0.7, s * 0.5, 0, s * 1.05)
      ctx.bezierCurveTo(-s * 0.7, s * 0.5, -s * 0.75, -s * 0.35, 0, -s * 1.15)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    case 'water': {
      ctx.beginPath()
      ctx.moveTo(0, -s * 1.1)
      ctx.bezierCurveTo(s * 0.85, -s * 0.1, s * 0.7, s * 0.95, 0, s * 1.0)
      ctx.bezierCurveTo(-s * 0.7, s * 0.95, -s * 0.85, -s * 0.1, 0, -s * 1.1)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    case 'grass': {
      ctx.beginPath()
      ctx.ellipse(0, 0, s * 0.55, s * 1.0, Math.PI / 4, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'
      ctx.beginPath()
      ctx.moveTo(-s * 0.6, s * 0.6); ctx.lineTo(s * 0.6, -s * 0.6)
      ctx.stroke()
      break
    }
    case 'electric': {
      ctx.beginPath()
      ctx.moveTo(s * 0.3, -s * 1.15)
      ctx.lineTo(-s * 0.5, s * 0.1)
      ctx.lineTo(-s * 0.05, s * 0.1)
      ctx.lineTo(-s * 0.3, s * 1.15)
      ctx.lineTo(s * 0.5, -s * 0.1)
      ctx.lineTo(s * 0.05, -s * 0.1)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    case 'psychic': {
      circle(ctx, 0, 0, s * 0.95)
      ctx.stroke()
      circle(ctx, 0, 0, s * 0.42)
      ctx.fill()
      break
    }
    case 'fighting': {
      ctx.beginPath()
      ctx.moveTo(-s * 0.9, s * 0.5)
      ctx.lineTo(-s * 0.9, -s * 0.15)
      ctx.quadraticCurveTo(-s * 0.9, -s * 0.75, -s * 0.3, -s * 0.75)
      ctx.lineTo(s * 0.35, -s * 0.75)
      ctx.quadraticCurveTo(s * 0.95, -s * 0.75, s * 0.9, -s * 0.1)
      ctx.lineTo(s * 0.9, s * 0.5)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    case 'darkness': {
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.95, Math.PI * 0.35, Math.PI * 1.65)
      ctx.arc(s * 0.45, 0, s * 0.8, Math.PI * 1.5, Math.PI * 0.5, true)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    case 'metal': {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2
        const x = Math.cos(a) * s * 0.95
        const y = Math.sin(a) * s * 0.95
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    case 'dragon': {
      ctx.beginPath()
      ctx.moveTo(0, -s * 1.05)
      ctx.lineTo(s * 0.75, 0)
      ctx.lineTo(0, s * 1.05)
      ctx.lineTo(-s * 0.75, 0)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    case 'fairy': {
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i - Math.PI / 2
        const rad = i % 2 === 0 ? s * 1.05 : s * 0.4
        const x = Math.cos(a) * rad
        const y = Math.sin(a) * rad
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      break
    }
    default: {
      circle(ctx, 0, 0, s * 0.85)
      ctx.stroke()
      break
    }
  }
}

export function drawEnergy(ctx, x, y, r, type) {
  const m = energyMeta(type)
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r)
  g.addColorStop(0, m.c1)
  g.addColorStop(1, m.c2)
  ctx.save()
  circle(ctx, x, y, r)
  ctx.fillStyle = g
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, r * 0.14)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.stroke()
  ctx.save()
  ctx.translate(x, y)
  glyph(ctx, type, r)
  ctx.restore()
  ctx.restore()
}
