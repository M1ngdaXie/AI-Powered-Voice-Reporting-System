import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;

// R2 is optional — if env vars are absent, audio is not stored (dev mode)
export const r2Enabled =
  Boolean(R2_ENDPOINT) && Boolean(R2_ACCESS_KEY_ID) && Boolean(R2_SECRET_ACCESS_KEY) && Boolean(R2_BUCKET);

const s3 = r2Enabled
  ? new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export async function uploadAudio(
  key: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<void> {
  if (!s3) throw new Error("R2 not configured");
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: contentType,
    }),
  );
}

export async function downloadAudio(key: string): Promise<Uint8Array> {
  if (!s3) throw new Error("R2 not configured");
  const res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  if (!res.Body) throw new Error(`R2 object not found: ${key}`);
  return new Uint8Array(await res.Body.transformToByteArray());
}
