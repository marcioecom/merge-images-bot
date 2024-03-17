import axios from "axios";
import "dotenv/config";
import extName from "ext-name";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { URL } from "url";

const TMP_DIR = "/tmp";

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(path.resolve(TMP_DIR));
}

export async function downloadImageToTmp(payload) {
  const mediaUrl = payload.mediaUrl;
  const contentType = payload.mediaContentType;
  const extension = extName.mime(contentType)[0].ext;
  const mediaSid = path.basename(new URL(mediaUrl).pathname);
  const filename = `${mediaSid}.${extension}`;
  const fullPath = path.resolve(`${TMP_DIR}/${filename}`);

  const fileStream = fs.createWriteStream(fullPath);

  const response = await axios.get(mediaUrl, {
    responseType: "stream",
    auth: {
      username: process.env.TWILIO_ACCOUNT_SID,
      password: process.env.TWILIO_AUTH_TOKEN,
    },
  });

  response.data.pipe(fileStream);

  // wait for the stream to finish
  await new Promise((resolve, reject) => {
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
  });

  return fullPath;
}

// Function to merge two images side by side
export async function mergeImages(image1Path, image2Path, outputPath) {
  try {
    // Load images using Sharp
    const image1 = sharp(image1Path);
    const image2 = sharp(image2Path);

    // Fetch metadata of both images
    const [metadata1, metadata2] = await Promise.all([
      image1.metadata(),
      image2.metadata(),
    ]);

    // Calculate the maximum width and height
    const maxHeight = Math.max(metadata1.height, metadata2.height);

    // Calculate the new dimensions for both images
    const newHeight1 = maxHeight;
    const newHeight2 = maxHeight;

    // Calculate the width of each image to maintain aspect ratio
    const newWidth1 = Math.round(
      (newHeight1 / metadata1.height) * metadata1.width
    );
    const newWidth2 = Math.round(
      (newHeight2 / metadata2.height) * metadata2.width
    );

    // Calculate the width and height of the canvas
    const width = newWidth1 + newWidth2;
    const height = maxHeight;

    // Create a new blank canvas with the calculated size
    const canvas = sharp({
      create: {
        width: width,
        height: height,
        channels: 4, // RGBA
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      },
    });

    // Composite the first image onto the canvas at position (0,0)
    await canvas
      .composite([
        {
          input: await image1.resize(newWidth1, newHeight1).toBuffer(),
          top: 0,
          left: 0,
        },
        {
          input: await image2.resize(newWidth2, newHeight2).toBuffer(),
          top: 0,
          left: newWidth1,
        },
      ])
      .toFile(outputPath);

    console.log("Images merged successfully!");
  } catch (error) {
    console.error("Error merging images:", error);
  }
}
