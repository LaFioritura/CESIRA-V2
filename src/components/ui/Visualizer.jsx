import React, { useRef, useEffect } from 'react'
import { getAnalyser } from '../../engine/audio.js'
import { GENRE_CLR } from '../../engine/constants.js'

export default function Visualizer({ genre, width=96, height=18 }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const gc = GENRE_CLR[genre] || '#ff4444'

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      const an = getAnalyser(); if (!an) return
      const data = new Uint8Array(an.frequencyBinCount)
      an.getByteFrequencyData(data)
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const barW = W / data.length
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] / 255) * H
        const alpha = 0.3 + (v / H) * 0.7
        ctx.fillStyle = `${gc}${Math.round(alpha * 255).toString(16).padStart(2,'0')}`
        ctx.fillRect(i * barW, H - v, barW - 0.5, v)
      }
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [genre])

  return <canvas ref={canvasRef} width={width} height={height} style={{ opacity:0.65, borderRadius:2 }} />
}
