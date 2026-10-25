// Envío de notificaciones Web Push (lo que permite que lleguen al iPhone con la app cerrada).
// Implementa el cifrado aes128gcm (RFC 8291) y la firma VAPID (RFC 8292) con WebCrypto, sin librerías.

const te = new TextEncoder()

export const b64u = {
  enc: (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0)),
}
const cat = (...a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length } return o }
const hmac = async (key: Uint8Array, data: Uint8Array) =>
  new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), data))

export interface Vapid { publicKey: string; privateKey: string; subject: string }
export interface Sub { endpoint: string; p256dh: string; auth: string }

// cifra el mensaje para una suscripción (la clave del celular solo la conoce el celular)
export async function encrypt(sub: Sub, payload: Uint8Array, salt = crypto.getRandomValues(new Uint8Array(16)), local?: CryptoKeyPair) {
  const uaPublic = b64u.dec(sub.p256dh), authSecret = b64u.dec(sub.auth)
  const kp = local || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey))
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, kp.privateKey, 256))
  // claves de contenido (HKDF con SHA-256)
  const prkKey = await hmac(authSecret, ecdh)
  const ikm = await hmac(prkKey, cat(te.encode('WebPush: info\0'), uaPublic, asPublic, new Uint8Array([1])))
  const prk = await hmac(salt, ikm)
  const cek = (await hmac(prk, cat(te.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16)
  const nonce = (await hmac(prk, cat(te.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12)
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(payload, new Uint8Array([2]))))
  const header = new Uint8Array(21 + asPublic.length)
  header.set(salt, 0); new DataView(header.buffer).setUint32(16, 4096); header[20] = asPublic.length; header.set(asPublic, 21)
  return cat(header, ct)
}

// firma VAPID: identifica a Renueva ante el servicio de notificaciones de Apple/Google/Mozilla
export async function vapidAuth(endpoint: string, v: Vapid) {
  const pub = b64u.dec(v.publicKey)
  const jwk = { kty: 'EC', crv: 'P-256', d: v.privateKey, x: b64u.enc(pub.slice(1, 33)), y: b64u.enc(pub.slice(33, 65)), ext: true }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const enc = (o: unknown) => b64u.enc(te.encode(JSON.stringify(o)))
  const unsigned = `${enc({ typ: 'JWT', alg: 'ES256' })}.${enc({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: v.subject })}`
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(unsigned)))
  return `vapid t=${unsigned}.${b64u.enc(sig)}, k=${v.publicKey}`
}

// envía; devuelve el código HTTP (404/410 = el celular ya no tiene esa suscripción)
export async function sendPush(sub: Sub, data: unknown, v: Vapid): Promise<number> {
  const body = await encrypt(sub, te.encode(JSON.stringify(data)))
  const r = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { Authorization: await vapidAuth(sub.endpoint, v), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '3600', Urgency: 'high' },
    body,
  })
  await r.body?.cancel()
  return r.status
}
