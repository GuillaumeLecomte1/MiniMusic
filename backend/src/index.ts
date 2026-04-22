import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import configRouter from './routes/config.js'
import lyricsRouter from './routes/lyrics.js'
import coverRouter from './routes/cover.js'
import musicRouter from './routes/music.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/config', configRouter)
app.use('/api/lyrics', lyricsRouter)
app.use('/api/cover', coverRouter)
app.use('/api/music', musicRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`MiniMusic API running on port ${PORT}`)
})
