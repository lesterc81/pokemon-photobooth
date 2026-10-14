import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DESIGNS, FRAMES, FILTERS } from './lib/designs.js'
import { renderOutput } from './lib/renderCard.js'
import { FORMATS, getFormat, computePlacement } from './lib/formats.js'
import { computeLayout, OUTLINE_GLOW } from './lib/layout.js'
import { useCamera } from './hooks/useCamera.js'

const EMPTY = new Set()

function initialQuery(key, valid, fallback) {
  if (typeof window === 'undefined') return fallback
  const q = new URLSearchParams(window.location.search).get(key)
  return valid.includes(q) ? q : fallback
}

const INITIAL_DESIGN_ID = initialQuery('design', DESIGNS.map((d) => d.id), DESIGNS[0].id)
const INITIAL_DESIGN = DESIGNS.find((d) => d.id === INITIAL_DESIGN_ID) || DESIGNS[0]
const INITIAL_FORMAT_ID = initialQuery('format', FORMATS.map((f) => f.id), FORMATS[0].id)

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function captureVideoFrame(video) {
  const c = document.createElement('canvas')
  c.width = video.videoWidth
  c.height = video.videoHeight
  const ctx = c.getContext('2d')
  ctx.translate(c.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.94)
}

function normalizeAttacks(d) {
  return d.attacks.map((a) => ({ name: a.name, dmg: a.damage, desc: a.desc }))
}

function Editable({ box, value, onChange, onFocus, onBlur, editing, out }) {
  const { outW, outH, cardX, cardY, scale } = out
  const unit = outW / 100
  return (
    <input
      className={`ov-input ${editing ? 'editing' : ''}`}
      value={value}
      spellCheck={false}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value)}
      style={{
        left: `${((cardX + box.x * scale) / outW) * 100}%`,
        top: `${((cardY + box.y * scale) / outH) * 100}%`,
        width: `${((box.w * scale) / outW) * 100}%`,
        height: `${((box.h * scale) / outH) * 100}%`,
        fontSize: `${(box.size * scale) / unit}cqi`,
        lineHeight: `${(box.h * scale) / unit}cqi`,
        fontWeight: box.weight,
        fontStyle: box.italic ? 'italic' : 'normal',
        fontFamily: box.family,
        color: editing ? box.color : 'transparent',
        textAlign: box.align,
        textShadow: editing && box.shadow !== 'none' ? OUTLINE_GLOW : 'none',
        caretColor: box.color,
      }}
    />
  )
}

export default function App() {
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const { videoRef, status: camStatus, error: camError, start: startCam, stop: stopCam } = useCamera()

  const [designId, setDesignId] = useState(INITIAL_DESIGN_ID)
  const [formatId, setFormatId] = useState(INITIAL_FORMAT_ID)
  const [frame, setFrame] = useState('rect')
  const [filter, setFilter] = useState('none')
  const [photo, setPhoto] = useState(null)
  const [flash, setFlash] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [shotMsg, setShotMsg] = useState('')
  const [editing, setEditing] = useState(null)
  const [fontTick, setFontTick] = useState(0)

  const design = useMemo(() => DESIGNS.find((d) => d.id === designId) || DESIGNS[0], [designId])
  const format = useMemo(() => getFormat(formatId), [formatId])
  const placement = useMemo(() => computePlacement(format), [format])
  const wide = format.kind === 'wallpaper' && format.w > format.h
  const wrapMax = wide ? 660 : format.w < format.h ? 380 : 460

  const [meta, setMeta] = useState({
    name: INITIAL_DESIGN.defaultName,
    hp: String(INITIAL_DESIGN.defaultHp),
    stage: 'BASIC',
    caption: 'Smile! Nakuha na ang kuha.',
    number: '001/151',
    attacks: normalizeAttacks(INITIAL_DESIGN),
  })

  useEffect(() => {
    let alive = true
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { if (alive) setFontTick((t) => t + 1) })
    }
    return () => { alive = false }
  }, [])

  const applyDesign = useCallback((d) => {
    setDesignId(d.id)
    setMeta((m) => ({
      ...m,
      name: d.defaultName,
      hp: String(d.defaultHp),
      stage: 'BASIC',
      attacks: normalizeAttacks(d),
    }))
  }, [])

  const L = useMemo(
    () => computeLayout(design, meta),
    [design, meta, fontTick]
  )

  const paint = useCallback((skip = EMPTY) => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderOutput(canvas, { format, placement, design, photo, frame, filter, meta, L, skip })
  }, [format, placement, design, photo, frame, filter, meta, L])

  useEffect(() => {
    paint(editing ? new Set([editing]) : EMPTY)
  }, [paint, editing])

  const set = (key) => (v) => setMeta((m) => ({ ...m, [key]: v }))

  const setAttack = (i, key) => (v) =>
    setMeta((m) => ({
      ...m,
      attacks: m.attacks.map((a, idx) => (idx === i ? { ...a, [key]: v } : a)),
    }))

  const snap = useCallback(async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    setFlash(true)
    setTimeout(() => setFlash(false), 260)
    const dataUrl = captureVideoFrame(video)
    try {
      const img = await loadImage(dataUrl)
      setPhoto({ el: img, mirrored: false })
      setShotMsg('Kunan na! Nakuha na ang litrato.')
      stopCam()
    } catch {
      setShotMsg('Hindi ma-capture ang frame. Subukan ulit.')
    }
  }, [videoRef, stopCam])

  const shoot = useCallback(() => {
    if (camStatus !== 'ready' || countdown > 0) return
    setCountdown(3)
    let n = 3
    const tick = setInterval(() => {
      n -= 1
      setCountdown(n)
      if (n <= 0) {
        clearInterval(tick)
        snap()
      }
    }, 900)
  }, [camStatus, countdown, snap])

  const onFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      setPhoto({ el: img, mirrored: false })
      setShotMsg('Litrato loaded!')
    } catch {
      setShotMsg('Hindi ma-basa ang file. Subukan ang ibang format.')
    }
    URL.revokeObjectURL(url)
    e.target.value = ''
  }, [])

  const download = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    paint(EMPTY)
    const a = document.createElement('a')
    const slug = (meta.name || design.id).toLowerCase().replace(/\s+/g, '-')
    a.download = `${slug}-${format.id}-${placement.outW}x${placement.outH}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
    paint(editing ? new Set([editing]) : EMPTY)
  }, [paint, meta.name, design.id, editing, format.id, placement])

  const attackFields = (i) => {
    const a = L.attacks[i]
    const m = meta.attacks[i]
    if (!a || !m) return null
    return (
      <>
        <Editable out={placement} box={a.name} value={m.name} editing={editing === `a${i}name`}
          onChange={setAttack(i, 'name')} onFocus={() => setEditing(`a${i}name`)} onBlur={() => setEditing(null)} />
        <Editable out={placement} box={a.dmg} value={m.dmg} editing={editing === `a${i}dmg`}
          onChange={setAttack(i, 'dmg')} onFocus={() => setEditing(`a${i}dmg`)} onBlur={() => setEditing(null)} />
        <Editable out={placement} box={a.desc} value={m.desc} editing={editing === `a${i}desc`}
          onChange={setAttack(i, 'desc')} onFocus={() => setEditing(`a${i}desc`)} onBlur={() => setEditing(null)} />
      </>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-ball" />
          <div>
            <h1>Card Booth</h1>
            <p>Photobooth na mukhang trading card</p>
          </div>
        </div>
        <button className="btn primary" onClick={download}>I-download ang card</button>
      </header>

      <main className={`layout ${wide ? 'wide' : ''}`}>
        <section className="stage">
          <div className="card-wrap" style={{ maxWidth: wrapMax }}>
            <div className="card-frame">
              <canvas ref={canvasRef} className="card-canvas" />
              <div className="ov">
                <Editable out={placement} box={L.stage} value={meta.stage} editing={editing === 'stage'}
                  onChange={set('stage')} onFocus={() => setEditing('stage')} onBlur={() => setEditing(null)} />
                <Editable out={placement} box={L.name} value={meta.name} editing={editing === 'name'}
                  onChange={set('name')} onFocus={() => setEditing('name')} onBlur={() => setEditing(null)} />
                <Editable out={placement} box={L.hpNum} value={meta.hp} editing={editing === 'hp'}
                  onChange={set('hp')} onFocus={() => setEditing('hp')} onBlur={() => setEditing(null)} />
                <Editable out={placement} box={L.caption} value={meta.caption} editing={editing === 'caption'}
                  onChange={set('caption')} onFocus={() => setEditing('caption')} onBlur={() => setEditing(null)} />
                <Editable out={placement} box={L.number} value={meta.number} editing={editing === 'number'}
                  onChange={set('number')} onFocus={() => setEditing('number')} onBlur={() => setEditing(null)} />
                {meta.attacks.map((_, i) => attackFields(i))}
              </div>
            </div>
          </div>
          <p className="edit-hint">I-click ang kahit anong text sa card para i-edit ito.</p>
        </section>

        <aside className="panel">
          <div className="block">
            <h2>1. Kumuha ng litrato</h2>
            <div className="cam">
              <div className="cam-screen">
                <video ref={videoRef} playsInline muted autoPlay className="cam-video" />
                {camStatus !== 'ready' && (
                  <div className="cam-empty">
                    {camStatus === 'starting' ? 'Binubuksan ang camera…' : 'Naka-off ang camera'}
                  </div>
                )}
                {countdown > 0 && <div className="countdown">{countdown}</div>}
                {flash && <div className="flash" />}
              </div>
              <div className="cam-actions">
                {camStatus === 'ready' ? (
                  <>
                    <button className="btn accent" onClick={shoot} disabled={countdown > 0}>
                      {countdown > 0 ? 'Kumuha…' : 'Kunan!'}
                    </button>
                    <button className="btn ghost" onClick={stopCam}>Ikansela</button>
                  </>
                ) : (
                  <button className="btn accent" onClick={startCam}>Buksan ang camera</button>
                )}
                <button className="btn ghost" onClick={() => fileRef.current?.click()}>
                  Mag-upload ng litrato
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              </div>
              {camError && <p className="hint error">{camError}</p>}
              {shotMsg && <p className="hint">{shotMsg}</p>}
            </div>
          </div>

          <div className="block">
            <h2>2. Pumili ng output size</h2>
            <div className="fmt-grid">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  className={`fmt ${f.id === formatId ? 'active' : ''}`}
                  onClick={() => setFormatId(f.id)}
                >
                  <span className={`fmt-thumb ${f.w > f.h ? 'land' : 'port'}`} />
                  <span className="fmt-label">{f.label}</span>
                  <span className="fmt-sub">{f.sub}</span>
                </button>
              ))}
            </div>
            <p className="hint" style={{ margin: '12px 0 0' }}>
              {format.kind === 'card'
                ? 'Eksaktong sukat ng trading card (2.5" × 3.5" @ 300 DPI).'
                : `Wallpaper: naka-center ang card sa themed background (${placement.outW} × ${placement.outH} px).`}
            </p>
          </div>

          <div className="block">
            <h2>3. Pumili ng card design</h2>
            <div className="design-grid">
              {DESIGNS.map((d) => (
                <button
                  key={d.id}
                  className={`swatch ${d.id === designId ? 'active' : ''}`}
                  style={{ background: `linear-gradient(145deg, ${d.bg[0]}, ${d.bg[1]}, ${d.bg[2]})`, color: d.ink }}
                  onClick={() => applyDesign(d)}
                >
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="block row3">
            <div>
              <h2>4. Frame</h2>
              <div className="chips">
                {FRAMES.map((f) => (
                  <button key={f.id} className={`chip ${frame === f.id ? 'active' : ''}`} onClick={() => setFrame(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2>5. Filter</h2>
              <div className="chips">
                {FILTERS.map((f) => (
                  <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="block">
            <h2>6. I-edit ang card</h2>
            <p className="hint" style={{ margin: 0 }}>
              I-click ang text sa card (pangalan, HP, caption, attacks) para i-edit nang diretso.
            </p>
          </div>
        </aside>
      </main>

      <footer className="foot">
        Tip: buksan sa HTTPS o localhost para gumana ang camera. Static site — kaya diretsong deploy sa Netlify.
      </footer>
    </div>
  )
}
