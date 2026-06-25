import crypto from 'crypto';

const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.SMTP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('SMTP encryption key is not configured.');
  }
  // Hash the key to ensure it is exactly 32 bytes long required for aes-256-cbc
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptSmtpPass(text: string): string {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptSmtpPass(text: string): string {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const textParts = text.split(':');
  
  if (textParts.length !== 2) {
    throw new Error('Invalid encrypted format.');
  }
  
  const iv = Buffer.from(textParts.shift() as string, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}
