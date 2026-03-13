import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export default async function compressImage(req, _res, next) {
  if (!req.file) return next();

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return next();

  try {
    const outputPath = req.file.path.replace(/\.[^.]+$/, '.webp');

    await sharp(req.file.path)
      .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Remove original, update req.file to point to compressed version
    await fs.unlink(req.file.path);
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);
    req.file.mimetype = 'image/webp';

    next();
  } catch (err) {
    // If compression fails, continue with original file
    next();
  }
}
