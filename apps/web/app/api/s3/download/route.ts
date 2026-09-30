import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const fileUrl = searchParams.get("fileUrl");

    const region = process.env.AWS_REGION || "us-east-1";
    const bucket = process.env.AWS_BUCKET_NAME;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const customEndpoint = process.env.AWS_S3_ENDPOINT;

    // Parse S3 key from s3:// URI or key parameter or HTTP URL
    let s3Key = key;
    if (!s3Key && fileUrl) {
      if (fileUrl.startsWith("s3://")) {
        const withoutPrefix = fileUrl.replace(/^s3:\/\/[^\/]+\//, "");
        s3Key = withoutPrefix;
      } else if (fileUrl.includes(".amazonaws.com/")) {
        s3Key = fileUrl.split(".amazonaws.com/")[1];
      }
    }

    if (bucket && accessKeyId && secretAccessKey && s3Key) {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        ...(customEndpoint ? { endpoint: customEndpoint, forcePathStyle: true } : {}),
      });

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      });

      // Generate a signed download URL valid for 1 hour
      const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return NextResponse.redirect(downloadUrl);
    }

    if (fileUrl && fileUrl.startsWith("http")) {
      return NextResponse.redirect(fileUrl);
    }

    return NextResponse.json({
      error: "Unable to generate download URL. Check S3 credentials or file URL.",
      fileUrl,
    }, { status: 400 });
  } catch (err: any) {
    console.error("S3 Download error:", err);
    return NextResponse.json({ error: err.message || "Failed to download file" }, { status: 500 });
  }
}
