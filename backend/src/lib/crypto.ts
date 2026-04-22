import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

export function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key.slice(0, 32)), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + authTag.toString('hex') + encrypted
}

export function decrypt(encryptedText: string, key: string): string {
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex')
  const authTag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, IV_LENGTH * 4), 'hex')
  const encrypted = encryptedText.slice(IV_LENGTH * 4)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key.slice(0, 32)), iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
