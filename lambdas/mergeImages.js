import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import "dotenv/config";
import fs from "fs";
import log from "lambda-log";
import twilio from "twilio";
import { downloadImageToTmp, mergeImages } from "../utils/images.js";

const s3Client = new S3Client();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function handler(event) {
  log.info("start mergeImages");
  for (const message of event.Records) {
    const bodyData = JSON.parse(message.body);

    const localImagesPromises = bodyData.imagesUrl.map((image) => {
      return downloadImageToTmp({
        mediaUrl: image.mediaUrl,
        mediaContentType: image.mediaContentType,
      });
    });

    const localImagesPath = await Promise.allSettled(localImagesPromises);
    log.info("Local Images Path", { localImagesPath });

    const fileName = `${randomUUID()}-mergedImage.jpeg`;
    const outputPath = `/tmp/${fileName}`;
    await mergeImages(
      localImagesPath[0].value,
      localImagesPath[1].value,
      outputPath
    );

    // upload the merged image to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
        Body: fs.createReadStream(outputPath),
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
    );
    log.info("Image uploaded to S3");

    const mediaUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    await twilioClient.messages.create({
      body: "Sua imagem foi mesclada com sucesso!",
      to: `whatsapp:+${bodyData.whatsappId}`,
      from: `whatsapp:+${process.env.TWILIO_PHONE_NUMBER}`,
      mediaUrl: [mediaUrl],
    });
    log.info("Message sent to user", {
      whatsappId: bodyData.whatsappId,
      mediaUrl,
    });
  }
  log.info("end mergeImages");
}
