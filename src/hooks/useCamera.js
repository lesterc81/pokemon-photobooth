import { useCallback, useEffect, useRef, useState } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('Hindi supported ng browser na ito ang camera. Gamitin mo na lang ang upload.')
      return false
    }
    try {
      setStatus('starting')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setStatus('ready')
      return true
    } catch (e) {
      setStatus('error')
      setError(
        e?.name === 'NotAllowedError'
          ? 'Hindi pinayagan ang camera. I-enable mo sa browser tapos ulitin, o mag-upload na lang ng litrato.'
          : 'Hindi mabuksan ang camera. Mag-upload na lang ng litrato.'
      )
      return false
    }
  }, [])

  useEffect(() => stop, [stop])

  return { videoRef, status, error, start, stop }
}
