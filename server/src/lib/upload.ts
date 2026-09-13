import { randomUUID } from 'crypto'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { HttpError } from './http-error.js'

/** Dossier server/uploads, indépendant du dossier depuis lequel le serveur est lancé */
export const UPLOADS_DIR = fileURLToPath(new URL('../../uploads', import.meta.url))

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  // L'extension vient du type MIME et non du nom fourni par le client
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXTENSIONS[file.mimetype]}`),
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!(file.mimetype in EXTENSIONS)) {
      cb(new HttpError(400, "Format d'image non supporté (jpeg, png ou webp uniquement)"))
      return
    }
    cb(null, true)
  },
})

/** Supprime un fichier uploadé à partir de son URL publique (/uploads/xxx.jpg). */
export function removeUploadedFile(imageUrl: string | null | undefined) {
  if (!imageUrl?.startsWith('/uploads/')) return
  const filePath = path.join(UPLOADS_DIR, path.basename(imageUrl))
  fs.promises.unlink(filePath).catch(() => {
    // fichier déjà absent : rien à faire
  })
}
