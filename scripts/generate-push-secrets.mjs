import fs from 'node:fs'
import { randomBytes, generateKeyPairSync } from 'node:crypto'

const projectRoot = process.cwd()
const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: { format: 'jwk' },
  privateKeyEncoding: { format: 'jwk' }
})
const applicationServerKey = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(publicKey.x, 'base64url'),
  Buffer.from(publicKey.y, 'base64url')
]).toString('base64url')
const exportedVapidKeys = JSON.stringify({ publicKey, privateKey })
const cronSecret = randomBytes(32).toString('hex')

const frontendEnvPath = `${projectRoot}/.env.local`
let frontendEnv = ''
try { frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8') } catch {}
const publicKeyLine = `VITE_WEB_PUSH_PUBLIC_KEY=${applicationServerKey}`
if (/^VITE_WEB_PUSH_PUBLIC_KEY=.*$/m.test(frontendEnv)) {
  frontendEnv = frontendEnv.replace(/^VITE_WEB_PUSH_PUBLIC_KEY=.*$/m, publicKeyLine)
} else {
  frontendEnv = `${frontendEnv.trimEnd()}${frontendEnv.trim() ? '\n' : ''}${publicKeyLine}\n`
}
fs.writeFileSync(frontendEnvPath, frontendEnv, 'utf8')

const serverEnvPath = `${projectRoot}/supabase/.env.push.local`
fs.writeFileSync(serverEnvPath, [
  `PUSH_VAPID_KEYS='${exportedVapidKeys}'`,
  `PUSH_VAPID_SUBJECT=${process.env.PUSH_VAPID_SUBJECT || 'mailto:admin@example.com'}`,
  `PUSH_CRON_SECRET=${cronSecret}`,
  ''
].join('\n'), 'utf8')

console.log('Generated a VAPID key pair and cron secret.')
console.log('Public browser key added to .env.local.')
console.log('Private server values saved to supabase/.env.push.local (ignored by Git).')
console.log('Set PUSH_VAPID_SUBJECT to a real contact email before deploying the Edge Function.')
