import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { uploadToR2 } from '../services/r2.service.js';

export default async function compressImage(req, _res, next) {
  if (!req.file) return next();

  const ext = path.extname(req.file.originalname).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);

  try {
    let filePath = req.file.path;
    let contentType = req.file.mimetype;
    let filename = req.file.filename;

    // Compress images to webp
    if (isImage) {
      const outputPath = req.file.path.replace(/\.[^.]+$/, '.webp');
      await sharp(req.file.path)
        .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(outputPath);

      await fs.unlink(req.file.path);
      filePath = outputPath;
      contentType = 'image/webp';
      filename = path.basename(outputPath);
    }

    // Upload to R2
    const key = `${req.userId}/${filename}`;
    await uploadToR2(filePath, key, contentType);

    // Clean up local file
    await fs.unlink(filePath);

    // Store the R2 key as the path (not local filesystem path)
    req.file.path = key;
    req.file.filename = filename;
    req.file.mimetype = contentType;

    next();
  } catch (err) {
    console.error('compressImage/R2 upload error:', err);
    // If R2 fails, keep local file path as fallback
    next();
  }
}
