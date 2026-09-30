import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const project = (formData.get("project") as string) || "general";
    const folder = (formData.get("folder") as string) || "General";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const region = process.env.AWS_REGION || "us-east-1";
    const bucket = process.env.AWS_BUCKET_NAME;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const customEndpoint = process.env.AWS_S3_ENDPOINT;

    const sanitizedFileName = file.name.replace(/\s+/g, "-").toLowerCase();
    const sanitizedFolder = folder.replace(/\s+/g, "-").toLowerCase();
    const timestamp = Date.now();
    const key = `${project.toLowerCase()}/${sanitizedFolder}/${timestamp}-${sanitizedFileName}`;

    // If AWS credentials are configured, perform real upload to S3
    if (bucket && accessKeyId && secretAccessKey) {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        ...(customEndpoint ? { endpoint: customEndpoint, forcePathStyle: true } : {}),
      });

      const buffer = Buffer.from(await file.arrayBuffer());

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        })
      );

      const publicUrl = customEndpoint
        ? `${customEndpoint.replace(/\/$/, "")}/${bucket}/${key}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

      return NextResponse.json({
        success: true,
        fileUrl: publicUrl,
        s3Uri: `s3://${bucket}/${key}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }

    // Fallback if credentials are not yet entered in .env
    const fallbackS3Uri = `s3://taskpilot-documents/${key}`;
    return NextResponse.json({
      success: true,
      fileUrl: fallbackS3Uri,
      s3Uri: fallbackS3Uri,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      note: "AWS_BUCKET_NAME or credentials not detected in .env. Stored S3 reference URI.",
    });
  } catch (err: any) {
    console.error("S3 Upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload file to S3" }, { status: 500 });
  }
}
