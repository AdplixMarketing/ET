import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

let s3;
function getClient() {
  if (!s3) {
    s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
}

const BUCKET = () => process.env.R2_BUCKET || 'flowfi-uploads';

export async function uploadToR2(filePath, key, contentType) {
  const body = fs.readFileSync(filePath);
  await getClient().send(new PutObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return key;
}

export async function getFromR2(key) {
  const response = await getClient().send(new GetObjectCommand({
    Bucket: BUCKET(),
    Key: key,
  }));
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFromR2(key) {
  await getClient().send(new DeleteObjectCommand({
    Bucket: BUCKET(),
    Key: key,
  }));
}
