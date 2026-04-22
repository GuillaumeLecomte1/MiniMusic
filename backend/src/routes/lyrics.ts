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

    const { mode, prompt, lyrics, title } = req.body

    if (!mode || !['write_full_song', 'edit'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "write_full_song" or "edit"' })
    }

    if (mode === 'edit' && !lyrics) {
      return res.status(400).json({ error: 'Lyrics required for edit mode' })
    }

    // Create project record
    const project = await prisma.lyricsProject.create({
      data: {
        mode,
        prompt,
        lyrics,
        title,
        status: 'processing',
      },
    })

    // Call MiniMax API
    const client = createMiniMaxClient(apiKey)
    const result = await client.generateLyrics({
      mode,
      prompt,
      lyrics,
      title,
    })

    // Update project with result
    await prisma.lyricsProject.update({
      where: { id: project.id },
      data: {
        resultTitle: result.song_title,
        styleTags: result.style_tags,
        resultLyrics: result.lyrics,
        status: 'completed',
        traceId: result.base_resp.status_code === 0 ? 'success' : result.base_resp.status_msg,
      },
    })

    res.json({
      id: project.id,
      songTitle: result.song_title,
      styleTags: result.style_tags,
      lyrics: result.lyrics,
      status: 'completed',
    })
  } catch (error: any) {
    console.error('Error generating lyrics:', error)
    res.status(500).json({ error: error.message || 'Failed to generate lyrics' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.lyricsProject.findUnique({
      where: { id: req.params.id },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({
      id: project.id,
      title: project.title,
      mode: project.mode,
      prompt: project.prompt,
      lyrics: project.lyrics,
      resultTitle: project.resultTitle,
      styleTags: project.styleTags,
      resultLyrics: project.resultLyrics,
      status: project.status,
      createdAt: project.createdAt,
    })
  } catch (error: any) {
    console.error('Error fetching lyrics:', error)
    res.status(500).json({ error: 'Failed to fetch lyrics project' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const projects = await prisma.lyricsProject.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json(projects)
  } catch (error: any) {
    console.error('Error fetching lyrics:', error)
    res.status(500).json({ error: 'Failed to fetch lyrics projects' })
  }
})

export default router
