const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export interface ApiConfigResponse {
  hasApiKey: boolean
  maskedKey?: string
  createdAt?: string
}

export interface SaveConfigRequest {
  apiKey: string
}

export interface LyricsRequest {
  mode: 'write_full_song' | 'edit'
  prompt?: string
  lyrics?: string
  title?: string
}

export interface LyricsResponse {
  id: string
  songTitle: string
  styleTags: string
  lyrics: string
  status: string
}

export interface CoverPreprocessRequest {
  audio_url?: string
  audio_base64?: string
}

export interface CoverPreprocessResponse {
  id: string
  coverFeatureId: string
  formattedLyrics: string
  structureResult: any
  audioDuration: number
  status: string
}

export interface MusicRequest {
  model?: string
  prompt?: string
  lyrics?: string
  stream?: boolean
  output_format?: 'url' | 'hex'
  audio_setting?: {
    sample_rate?: number
    bitrate?: number
    format?: 'mp3' | 'wav' | 'pcm'
  }
  lyrics_optimizer?: boolean
  is_instrumental?: boolean
  audio_url?: string
  audio_base64?: string
  cover_feature_id?: string
  lyricsProjectId?: string
  coverProjectId?: string
}

export interface MusicResponse {
  id: string
  status: number
  audio?: string
  musicDuration?: number
  traceId: string
}

export const api = {
  config: {
    get: () => fetchJson<ApiConfigResponse>('/config'),
    save: (data: SaveConfigRequest) => fetchJson<{ success: boolean }>('/config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: () => fetchJson<{ success: boolean }>('/config', { method: 'DELETE' }),
  },

  lyrics: {
    generate: (data: LyricsRequest) => fetchJson<LyricsResponse>('/lyrics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    get: (id: string) => fetchJson<any>(`/lyrics/${id}`),
    list: () => fetchJson<any[]>('/lyrics'),
  },

  cover: {
    preprocess: (data: CoverPreprocessRequest) => fetchJson<CoverPreprocessResponse>('/cover/preprocess', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    get: (id: string) => fetchJson<any>(`/cover/preprocess/${id}`),
    list: () => fetchJson<any[]>('/cover'),
  },

  music: {
    generate: (data: MusicRequest) => fetchJson<MusicResponse>('/music', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    get: (id: string) => fetchJson<any>(`/music/${id}`),
    list: () => fetchJson<any[]>('/music'),
  },
}
