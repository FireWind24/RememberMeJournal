import { useEffect, useRef } from 'react'
const LOFI_TRACKS: { mode: string; label: string; emoji: string; color: string }[] = []
import { useLofi } from '@/hooks'
import type { LofiMode } from '@/types'

// Web Audio API ambient sound engine
class AmbientAudio {
  private ctx: AudioContext | null = null
  private nodes: AudioNode[] = []

  start(mode: LofiMode) {
    this.stop()
    this.ctx = new AudioContext()
    const ctx = this.ctx

    if (mode === 'rainy_cafe') {
      // Pink noise rain
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886*b0 + white*0.0555179; b1 = 0.99332*b1 + white*0.0750759
        b2 = 0.96900*b2 + white*0.1538520; b3 = 0.86650*b3 + white*0.3104856
        b4 = 0.55000*b4 + white*0.5329522; b5 = -0.7616*b5 - white*0.0168980
        data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362) * 0.11
        b6 = white * 0.115926
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0.4
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1200
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start()
      this.nodes = [src, gain, filter]

      // Cafe low hum
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 60
      const g2 = ctx.createGain()
      g2.gain.value = 0.05
      osc.connect(g2).connect(ctx.destination)
      osc.start()
      this.nodes.push(osc, g2)

    } else if (mode === 'summer_meadow') {
      // Gentle white noise wind
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 0.25
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 800
      filter.Q.value = 0.5
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start()

      // Soft chirp tones
      const chirpFreqs = [440, 554, 659, 880]
      chirpFreqs.forEach((freq, i) => {
        const o = ctx.createOscillator()
        o.type = 'sine'
        o.frequency.value = freq
        const g = ctx.createGain()
        g.gain.value = 0
        // LFO to pulse
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 0.3 + i * 0.1
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 0.03
        lfo.connect(lfoGain).connect(g.gain)
        o.connect(g).connect(ctx.destination)
        o.start(); lfo.start()
        this.nodes.push(o, g, lfo, lfoGain)
      })
      this.nodes.push(src, gain, filter)

    } else if (mode === 'deep_focus') {
      // Binaural-style drone
      const freqs = [40, 80, 120]
      freqs.forEach(freq => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const gain = ctx.createGain()
        gain.gain.value = freq === 40 ? 0.15 : 0.06
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        this.nodes.push(osc, gain)
      })
      // Slow pulse LFO on main tone
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.1
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.04
      lfo.connect(lfoGain)
      // Very subtle high shimmer
      const shimmer = ctx.createOscillator()
      shimmer.type = 'triangle'
      shimmer.frequency.value = 528
      const sg = ctx.createGain()
      sg.gain.value = 0.02
      shimmer.connect(sg).connect(ctx.destination)
      shimmer.start(); lfo.start()
      this.nodes.push(shimmer, sg, lfo, lfoGain)
    }
  }

  stop() {
    this.nodes.forEach(n => {
      try { (n as AudioBufferSourceNode).stop?.() } catch { /* already stopped */ }
      n.disconnect()
    })
    this.nodes = []
    if (this.ctx) { this.ctx.close(); this.ctx = null }
  }
}

const audio = new AmbientAudio()

export function LofiBar() {
  const { lofiMode, isPlaying, setLofiMode, togglePlay } = useLofi()
  const playingRef = useRef(isPlaying)
  const modeRef = useRef(lofiMode)

  useEffect(() => {
    playingRef.current = isPlaying
    modeRef.current = lofiMode
    if (isPlaying && lofiMode !== 'off') {
      audio.start(lofiMode)
    } else {
      audio.stop()
    }
    return () => { audio.stop() }
  }, [isPlaying, lofiMode])

  const current = LOFI_TRACKS.find(t => t.mode === lofiMode)

  return (
    <div className="lofi-bar">
      <button
        onClick={togglePlay}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: isPlaying ? 'var(--sage)' : 'var(--sage-light)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: isPlaying ? 'white' : 'var(--sage-mid)',
          transition: 'background 0.2s, transform 0.15s var(--spring)',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.85)')}
        onMouseUp={e => (e.currentTarget.style.transform = '')}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause music' : 'Play ambient music'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
          {current?.label ?? 'Lo-fi radio'}
        </div>
        {isPlaying && (
          <div style={{ fontSize: 9, color: 'var(--sage-mid)', fontWeight: 600, marginTop: 1 }}>
            Now playing ♪
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {LOFI_TRACKS.map(track => (
          <button
            key={track.mode}
            onClick={() => setLofiMode(track.mode as LofiMode)}
            title={track.label}
            style={{
              fontSize: 10, padding: '3px 8px',
              borderRadius: 8,
              background: lofiMode === track.mode ? 'var(--sage)' : 'var(--sage-light)',
              color: lofiMode === track.mode ? 'white' : 'var(--sage-mid)',
              border: 'none', cursor: 'pointer',
              fontWeight: 700, fontFamily: 'Quicksand, sans-serif',
              transition: 'background 0.15s, color 0.15s, transform 0.15s var(--spring)',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={e => (e.currentTarget.style.transform = '')}
          >
            {track.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
