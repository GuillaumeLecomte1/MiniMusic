import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function ApiKeyConfig() {
  const [apiKey, setApiKey] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['apiConfig'],
    queryFn: api.config.get,
  })

  const saveMutation = useMutation({
    mutationFn: api.config.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiConfig'] })
      setApiKey('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.config.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiConfig'] })
    },
  })

  if (isLoading) {
    return <div className="loading"><div className="spinner"></div> Loading...</div>
  }

  return (
    <div className="card">
      <h2>API Configuration</h2>

      {!data?.hasApiKey ? (
        <div>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Configure your MiniMax API key to enable music generation.
          </p>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your MiniMax API key"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => saveMutation.mutate({ apiKey })}
            disabled={!apiKey || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save API Key'}
          </button>
          {saveMutation.isError && (
            <p className="error" style={{ marginTop: '1rem' }}>{saveMutation.error.message}</p>
          )}
        </div>
      ) : (
        <div>
          <p className="success" style={{ marginBottom: '1rem' }}>
            API Key configured: {data.maskedKey}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Removing...' : 'Remove API Key'}
          </button>
        </div>
      )}
    </div>
  )
}
