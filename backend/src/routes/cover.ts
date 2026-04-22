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

router.post('/preprocess', async (req, res) => {
  try {
    const apiKey = await getActiveApiKey()
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured' })
    }

    const { audio_url, audio_base64 } = req.body

    if (!audio_url && !audio_base64) {
      return res.status(400).json({ error: 'Either audio_url or audio_base64 is required' })
    }

    // Create project record
    const project = await prisma.coverProject.create({
      data: {
        model: 'music-cover',
        audioUrl: audio_url,
        audioBase64: audio_base64 ? 'provided' : null,
        status: 'processing',
      },
    })

    // Call MiniMax API
    const client = createMiniMaxClient(apiKey)
    const result = await client.coverPreprocess({
      model: 'music-cover',
      audio_url,
      audio_base64,
    })

    // Update project with result
    await prisma.coverProject.update({
      where: { id: project.id },
      data: {
        coverFeatureId: result.cover_feature_id,
        formattedLyrics: result.formatted_lyrics,
        structureResult: JSON.parse(result.structure_result || '{}'),
        audioDuration: result.audio_duration,
        status: 'completed',
        traceId: result.trace_id,
      },
    })

    res.json({
      id: project.id,
      coverFeatureId: result.cover_feature_id,
      formattedLyrics: result.formatted_lyrics,
      structureResult: JSON.parse(result.structure_result || '{}'),
      audioDuration: result.audio_duration,
      status: 'completed',
    })
  } catch (error: any) {
    console.error('Error preprocessing cover:', error)
    res.status(500).json({ error: error.message || 'Failed to preprocess cover' })
  }
})

router.get('/preprocess/:id', async (req, res) => {
  try {
    const project = await prisma.coverProject.findUnique({
      where: { id: req.params.id },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({
      id: project.id,
      model: project.model,
      audioUrl: project.audioUrl,
      coverFeatureId: project.coverFeatureId,
      formattedLyrics: project.formattedLyrics,
      structureResult: project.structureResult,
      audioDuration: project.audioDuration,
      status: project.status,
      createdAt: project.createdAt,
    })
  } catch (error: any) {
    console.error('Error fetching cover:', error)
    res.status(500).json({ error: 'Failed to fetch cover project' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const projects = await prisma.coverProject.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json(projects)
  } catch (error: any) {
    console.error('Error fetching covers:', error)
    res.status(500).json({ error: 'Failed to fetch cover projects' })
  }
})

export default router
