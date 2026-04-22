import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function LyricsGenerator() {
  const [mode, setMode] = useState<'write_full_song' | 'edit'>('write_full_song')
  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [title, setTitle] = useState('')
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: api.lyrics.generate,
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleSubmit = () => {
    mutation.mutate({
      mode,
      prompt: prompt || undefined,
      lyrics: mode === 'edit' ? lyrics : undefined,
      title: title || undefined,
    })
  }

  return (
    <div>
      <div className="card">
        <h2>Lyrics Generator</h2>

        <div className="form-group">
          <label>Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="write_full_song">Write Full Song</option>
            <option value="edit">Edit / Continue</option>
          </select>
        </div>

        <div className="form-group">
          <label>Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
          />
        </div>

        <div className="form-group">
          <label>Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === 'write_full_song' 
              ? 'A cheerful love song about a summer day at the beach'
              : 'Make it more upbeat, add a chorus'}
          />
        </div>

        {mode === 'edit' && (
          <div className="form-group">
            <label>Existing Lyrics</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste existing lyrics here..."
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Generating...' : 'Generate Lyrics'}
        </button>

        {mutation.isError && (
          <p className="error" style={{ marginTop: '1rem' }}>{mutation.error.message}</p>
        )}
      </div>

      {result && (
        <div className="card">
          <h2>Generated Lyrics</h2>
          <p><strong>Title:</strong> {result.songTitle}</p>
          <p><strong>Style:</strong> {result.styleTags}</p>
          <div className="result-box" style={{ marginTop: '1rem' }}>
            <pre>{result.lyrics}</pre>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              localStorage.setItem('lastLyrics', result.lyrics)
            }}
          >
            Save for Music Generator
          </button>
        </div>
      )}
    </div>
  )
}
