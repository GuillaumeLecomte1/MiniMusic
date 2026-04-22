import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function CoverGenerator() {
  const [audioUrl, setAudioUrl] = useState('')
  const [step, setStep] = useState<'preprocess' | 'generate'>('preprocess')
  const [preprocessResult, setPreprocessResult] = useState<any>(null)
  const [lyrics, setLyrics] = useState('')
  const [prompt, setPrompt] = useState('')
  const [musicResult, setMusicResult] = useState<any>(null)

  const preprocessMutation = useMutation({
    mutationFn: api.cover.preprocess,
    onSuccess: (data) => {
      setPreprocessResult(data)
      setLyrics(data.formattedLyrics || '')
      setStep('generate')
    },
  })

  const musicMutation = useMutation({
    mutationFn: api.music.generate,
    onSuccess: (data) => {
      setMusicResult(data)
    },
  })

  const handlePreprocess = () => {
    preprocessMutation.mutate({
      audio_url: audioUrl,
    })
  }

  const handleGenerateCover = () => {
    musicMutation.mutate({
      model: 'music-cover',
      prompt,
      lyrics,
      cover_feature_id: preprocessResult.coverFeatureId,
    })
  }

  return (
    <div>
      <div className="card">
        <h2>Cover Generator</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Upload a reference audio to create a cover with new style and/or lyrics.
        </p>

        {step === 'preprocess' && (
          <>
            <div className="form-group">
              <label>Audio URL</label>
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/song.mp3"
              />
            </div>

            <p className="muted" style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
              Supported: MP3, WAV, FLAC | Duration: 6 seconds - 6 minutes | Max: 50MB
            </p>

            <button
              className="btn btn-primary"
              onClick={handlePreprocess}
              disabled={!audioUrl || preprocessMutation.isPending}
            >
              {preprocessMutation.isPending ? 'Processing...' : 'Preprocess Audio'}
            </button>

            {preprocessMutation.isError && (
              <p className="error" style={{ marginTop: '1rem' }}>{preprocessMutation.error.message}</p>
            )}
          </>
        )}

        {step === 'generate' && preprocessResult && (
          <>
            <div className="result-box">
              <p><strong>Cover Feature ID:</strong> {preprocessResult.coverFeatureId}</p>
              <p><strong>Duration:</strong> {Math.round(preprocessResult.audioDuration)}s</p>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Style Prompt</label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Pop, upbeat, summer vibe"
              />
            </div>

            <div className="form-group">
              <label>Lyrics (edit if needed)</label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Extracted lyrics..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleGenerateCover}
                disabled={!lyrics || !prompt || musicMutation.isPending}
              >
                {musicMutation.isPending ? 'Generating...' : 'Generate Cover'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setStep('preprocess')
                  setPreprocessResult(null)
                }}
              >
                Start Over
              </button>
            </div>

            {musicMutation.isError && (
              <p className="error" style={{ marginTop: '1rem' }}>{musicMutation.error.message}</p>
            )}
          </>
        )}
      </div>

      {musicResult && (
        <div className="card">
          <h2>Generated Cover</h2>
          <p><strong>Status:</strong> {musicResult.status === 2 ? 'Completed' : 'Processing'}</p>
          
          {musicResult.audio && (
            <div style={{ marginTop: '1rem' }}>
              <a href={musicResult.audio} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Download Cover
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
