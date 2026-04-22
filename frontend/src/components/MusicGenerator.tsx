import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function MusicGenerator() {
  const [model, setModel] = useState('music-2.6')
  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [isInstrumental, setIsInstrumental] = useState(false)
  const [lyricsOptimizer, setLyricsOptimizer] = useState(false)
  const [outputFormat, setOutputFormat] = useState<'url' | 'hex'>('url')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const saved = localStorage.getItem('lastLyrics')
    if (saved) {
      setLyrics(saved)
    }
  }, [])

  const mutation = useMutation({
    mutationFn: api.music.generate,
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleSubmit = () => {
    mutation.mutate({
      model: model as any,
      prompt: prompt || undefined,
      lyrics: !isInstrumental ? lyrics : undefined,
      is_instrumental: isInstrumental,
      lyrics_optimizer: lyricsOptimizer,
      output_format: outputFormat,
    })
  }

  const downloadAudio = () => {
    if (result?.audioHex) {
      const blob = new Blob(
        [new Uint8Array(result.audioHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)))],
        { type: 'audio/mp3' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mini-music-${result.id}.mp3`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Music Generator</h2>

        <div className="form-group">
          <label>Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="music-2.6">Music 2.6 (paid)</option>
            <option value="music-2.6-free">Music 2.6 Free</option>
          </select>
        </div>

        <div className="form-group">
          <label>Prompt (style, mood)</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Indie folk, melancholic, introspective"
          />
        </div>

        <div className="form-group">
          <label>Lyrics</label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Paste lyrics or generate from previous step..."
            disabled={isInstrumental}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={isInstrumental}
              onChange={(e) => setIsInstrumental(e.target.checked)}
            />
            Instrumental
          </label>

          {!lyrics && !isInstrumental && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={lyricsOptimizer}
                onChange={(e) => setLyricsOptimizer(e.target.checked)}
              />
              Auto-generate lyrics from prompt
            </label>
          )}
        </div>

        <div className="form-group">
          <label>Output Format</label>
          <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as any)}>
            <option value="url">URL (download link)</option>
            <option value="hex">Hex (embedded)</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Generating...' : 'Generate Music'}
        </button>

        {mutation.isError && (
          <p className="error" style={{ marginTop: '1rem' }}>{mutation.error.message}</p>
        )}
      </div>

      {result && (
        <div className="card">
          <h2>Generated Music</h2>
          <p><strong>Status:</strong> {result.status === 2 ? 'Completed' : 'Processing'}</p>
          {result.musicDuration && (
            <p><strong>Duration:</strong> {Math.round(result.musicDuration / 1000)}s</p>
          )}
          
          {result.audio && outputFormat === 'url' && (
            <div style={{ marginTop: '1rem' }}>
              <a href={result.audio} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Download Audio
              </a>
            </div>
          )}

          {result.audioHex && (
            <button className="btn btn-primary" onClick={downloadAudio} style={{ marginTop: '1rem' }}>
              Download (from hex)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
