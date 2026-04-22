import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { createMiniMaxClient } from '../lib/minimax.js'
import { decrypt } from '../lib/crypto.js'

const router = Router()

async function getActiveApiKey(): Promise<string | null> {
  const config = await prisma.apiConfig.findFirst({
    where: { isActive: true },
  })

  if (!config) return null

  return decrypt(config.apiKey, process.env.ENCRYPTION_KEY || '')
}

router.post('/', async (req, res) => {
  try {
    const apiKey = await getActiveApiKey()
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured' })
    }

    const {
      model,
      prompt,
      lyrics,
      stream,
      output_format,
      audio_setting,
      lyrics_optimizer,
      is_instrumental,
      audio_url,
      audio_base64,
      cover_feature_id,
      lyricsProjectId,
      coverProjectId,
    } = req.body

    const validModels = ['music-2.6', 'music-cover', 'music-2.6-free', 'music-cover-free']
    if (model && !validModels.includes(model)) {
      return res.status(400).json({ error: `Invalid model. Must be one of: ${validModels.join(', ')}` })
    }

    // Create project record
    const project = await prisma.musicProject.create({
      data: {
        model: model || 'music-2.6',
        prompt,
        lyrics,
        isInstrumental: is_instrumental || false,
        lyricsOptimizer: lyrics_optimizer || false,
        outputFormat: output_format || 'url',
        sampleRate: audio_setting?.sample_rate,
        bitrate: audio_setting?.bitrate,
        format: audio_setting?.format,
        lyricsProjectId,
        coverProjectId,
        status: 1,
      },
    })

    // Call MiniMax API
    const client = createMiniMaxClient(apiKey)
    const result = await client.generateMusic({
      model: model || 'music-2.6',
      prompt,
      lyrics,
      stream: stream || false,
      output_format: output_format || 'url',
      audio_setting,
      lyrics_optimizer,
      is_instrumental,
      audio_url,
      audio_base64,
      cover_feature_id,
    })

    // Update project with result
    await prisma.musicProject.update({
      where: { id: project.id },
      data: {
        audioHex: result.data.audio,
        status: result.data.status,
        musicDuration: result.extra_info?.music_duration,
        traceId: result.trace_id,
      },
    })

    res.json({
      id: project.id,
      status: result.data.status,
      audio: result.data.audio,
      musicDuration: result.extra_info?.music_duration,
      traceId: result.trace_id,
    })
  } catch (error: any) {
    console.error('Error generating music:', error)
    res.status(500).json({ error: error.message || 'Failed to generate music' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.musicProject.findUnique({
      where: { id: req.params.id },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({
      id: project.id,
      model: project.model,
      prompt: project.prompt,
      lyrics: project.lyrics,
      isInstrumental: project.isInstrumental,
      outputFormat: project.outputFormat,
      audioUrl: project.audioUrl,
      audioHex: project.audioHex ? '***' : null,
      status: project.status,
      musicDuration: project.musicDuration,
      createdAt: project.createdAt,
    })
  } catch (error: any) {
    console.error('Error fetching music:', error)
    res.status(500).json({ error: 'Failed to fetch music project' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const projects = await prisma.musicProject.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lyricsProject: true,
        coverProject: true,
      },
    })

    res.json(projects)
  } catch (error: any) {
    console.error('Error fetching music projects:', error)
    res.status(500).json({ error: 'Failed to fetch music projects' })
  }
})

export default router
