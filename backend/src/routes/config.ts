import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { encrypt, decrypt } from '../lib/crypto.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const config = await prisma.apiConfig.findFirst({
      where: { isActive: true },
    })

    if (!config) {
      return res.json({ hasApiKey: false })
    }

    const apiKey = decrypt(config.apiKey, process.env.ENCRYPTION_KEY || '')

    res.json({
      hasApiKey: true,
      maskedKey: '***' + apiKey.slice(-4),
      createdAt: config.createdAt,
    })
  } catch (error) {
    console.error('Error fetching config:', error)
    res.status(500).json({ error: 'Failed to fetch config' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { apiKey } = req.body

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' })
    }

    // Deactivate all existing keys
    await prisma.apiConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Encrypt and save new key
    const encryptedKey = encrypt(apiKey, process.env.ENCRYPTION_KEY || '')
    
    const config = await prisma.apiConfig.create({
      data: {
        apiKey: encryptedKey,
        isActive: true,
      },
    })

    res.json({
      success: true,
      id: config.id,
    })
  } catch (error) {
    console.error('Error saving config:', error)
    res.status(500).json({ error: 'Failed to save config' })
  }
})

router.delete('/', async (_req, res) => {
  try {
    await prisma.apiConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting config:', error)
    res.status(500).json({ error: 'Failed to delete config' })
  }
})

export default router
