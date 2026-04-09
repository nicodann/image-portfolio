import type { Handler, HandlerEvent } from '@netlify/functions'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import Busboy from 'busboy'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'

// ---------------------------------------------------------------------------
// Cloudinary config
// ---------------------------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
// Hardcoded — never derived from user input.
const ARTWORKS_PATH = 'content/artworks.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Artwork {
  id: string
  title: string
  year: number
  description: string
  imageUrl: string
}

interface ParsedForm {
  fields: Record<string, string>
  file: { buffer: Buffer; mimetype: string } | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verify the JWT by calling the Netlify Identity /user endpoint. */
async function verifyToken(token: string): Promise<boolean> {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL
  if (!siteUrl) {
    console.error('No site URL env var (URL / DEPLOY_PRIME_URL) available for token verification.')
    return false
  }
  try {
    const res = await fetch(`${siteUrl}/.netlify/identity/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/** Parse a multipart/form-data request body using Busboy. */
function parseMultipart(event: HandlerEvent): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {}
    let file: ParsedForm['file'] = null

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body ?? '', 'base64')
      : Buffer.from(event.body ?? '')

    const bb = Busboy({
      headers: event.headers as Record<string, string>,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB hard limit
    })

    bb.on('field', (name, value) => {
      fields[name] = value
    })

    bb.on('file', (_name, stream, info) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => {
        file = { buffer: Buffer.concat(chunks), mimetype: info.mimeType }
      })
    })

    bb.on('finish', () => resolve({ fields, file }))
    bb.on('error', reject)

    bb.write(rawBody)
    bb.end()
  })
}

/** Upload a Buffer to Cloudinary and return the secure URL. */
function uploadToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'portfolio' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('No Cloudinary result'))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

/** Read → append → write artworks.json via the GitHub Contents API. */
async function appendArtwork(artwork: Artwork): Promise<void> {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'

  if (!token || !repo) throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO env vars')

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // GET current file
  const getRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${ARTWORKS_PATH}?ref=${branch}`,
    { headers }
  )
  if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`)

  const fileData = await getRes.json() as { content: string; sha: string }
  const current: Artwork[] = JSON.parse(
    Buffer.from(fileData.content, 'base64').toString('utf-8')
  )

  const updated = [...current, artwork]
  const newContent = Buffer.from(JSON.stringify(updated, null, 2) + '\n').toString('base64')

  // PUT updated file
  const putRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${ARTWORKS_PATH}`,
    {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Add artwork: ${artwork.title}`,
        content: newContent,
        sha: fileData.sha,
        branch,
      }),
    }
  )
  if (!putRes.ok) throw new Error(`GitHub PUT failed: ${putRes.status}`)
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  // --- Auth ---
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'] ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing authorization token' }) }
  }

  const tokenValid = await verifyToken(token)
  if (!tokenValid) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) }
  }

  // --- Parse form ---
  let parsed: ParsedForm
  try {
    parsed = await parseMultipart(event)
  } catch (err) {
    console.error('Form parse error:', err)
    return { statusCode: 400, body: JSON.stringify({ error: 'Failed to parse form data' }) }
  }

  const { fields, file } = parsed

  if (!file) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No file provided' }) }
  }

  // --- Validate file type ---
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid file type. Accepted: JPEG, PNG, WebP.' }),
    }
  }

  // --- Validate required fields ---
  const { title, year, description } = fields
  if (!title || !year || !description) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: title, year, description' }) }
  }

  // --- Sharp processing ---
  let processedBuffer: Buffer
  try {
    processedBuffer = await sharp(file.buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .withMetadata() // preserves ICC colour profile and other metadata
      .toBuffer()
  } catch (err) {
    console.error('Sharp error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Image processing failed' }) }
  }

  // --- Cloudinary upload ---
  let imageUrl: string
  try {
    imageUrl = await uploadToCloudinary(processedBuffer)
  } catch (err) {
    console.error('Cloudinary error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Image upload failed' }) }
  }

  // --- Build artwork entry ---
  const artwork: Artwork = {
    id: Date.now().toString(),
    title,
    year: parseInt(year, 10),
    description,
    imageUrl,
  }

  // --- Commit to GitHub ---
  try {
    await appendArtwork(artwork)
  } catch (err) {
    console.error('GitHub error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save artwork metadata' }) }
  }

  // --- In local dev, also write directly to disk so the Next.js server sees it immediately ---
  if (process.env.NETLIFY_DEV === 'true') {
    const localPath = join(process.cwd(), ARTWORKS_PATH)
    const current: Artwork[] = JSON.parse(readFileSync(localPath, 'utf-8'))
    writeFileSync(localPath, JSON.stringify([...current, artwork], null, 2) + '\n')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(artwork),
  }
}
