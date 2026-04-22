import axios, { AxiosInstance } from 'axios'

const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimax.io'

export interface GenerateLyricsParams {
  mode: 'write_full_song' | 'edit'
  prompt?: string
  lyrics?: string
  title?: string
}

export interface GenerateLyricsResponse {
  song_title: string
  style_tags: string
  lyrics: string
  base_resp: {
    status_code: number
    status_msg: string
  }
}

export interface CoverPreprocessParams {
  model: 'music-cover'
  audio_url?: string
  audio_base64?: string
}

export interface CoverPreprocessResponse {
  cover_feature_id: string
  formatted_lyrics: string
  structure_result: string
  audio_duration: number
  trace_id: string
  base_resp: {
    status_code: number
    status_msg: string
  }
}

export interface MusicGenerationParams {
  model: 'music-2.6' | 'music-cover' | 'music-2.6-free' | 'music-cover-free'
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
}

export interface MusicGenerationResponse {
  data: {
    status: number
    audio?: string
  }
  trace_id: string
  extra_info?: {
    music_duration: number
    music_sample_rate: number
    music_channel: number
    bitrate: number
    music_size: number
  }
  base_resp: {
    status_code: number
    status_msg: string
  }
}

class MiniMaxClient {
  private client: AxiosInstance

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: MINIMAX_API_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async generateLyrics(params: GenerateLyricsParams): Promise<GenerateLyricsResponse> {
    const response = await this.client.post<GenerateLyricsResponse>('/v1/lyrics_generation', params)
    return response.data
  }

  async coverPreprocess(params: CoverPreprocessParams): Promise<CoverPreprocessResponse> {
    const response = await this.client.post<CoverPreprocessResponse>('/v1/music_cover_preprocess', params)
    return response.data
  }

  async generateMusic(params: MusicGenerationParams): Promise<MusicGenerationResponse> {
    const response = await this.client.post<MusicGenerationResponse>('/v1/music_generation', params)
    return response.data
  }
}

export function createMiniMaxClient(apiKey: string): MiniMaxClient {
  return new MiniMaxClient(apiKey)
}

export default MiniMaxClient
