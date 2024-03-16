// import sharp from 'sharp';

export async function mergeImagesFake(image1Path, image2Path) {
  return (
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?" +
    "ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
  );
}

// Function to merge two images side by side
// export async function mergeImages(image1Path, image2Path, outputPath) {
//   try {
//     // Load images using Sharp
//     const image1 = sharp(image1Path);
//     const image2 = sharp(image2Path);

//     // Fetch metadata of both images
//     const [metadata1, metadata2] = await Promise.all([image1.metadata(), image2.metadata()]);

//     // Calculate the maximum width and height
//     const maxHeight = Math.max(metadata1.height, metadata2.height);

//     // Calculate the new dimensions for both images
//     const newHeight1 = maxHeight;
//     const newHeight2 = maxHeight;

//     // Calculate the width of each image to maintain aspect ratio
//     const newWidth1 = Math.round((newHeight1 / metadata1.height) * metadata1.width);
//     const newWidth2 = Math.round((newHeight2 / metadata2.height) * metadata2.width);

//     // Calculate the width and height of the canvas
//     const width = newWidth1 + newWidth2;
//     const height = maxHeight;

//     // Create a new blank canvas with the calculated size
//     const canvas = sharp({
//         create: {
//             width: width,
//             height: height,
//             channels: 4, // RGBA
//             background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
//         }
//     });

//     // Composite the first image onto the canvas at position (0,0)
//     await canvas.composite([
//       { input: await image1.resize(newWidth1, newHeight1).toBuffer(), top: 0, left: 0 },
//       { input: await image2.resize(newWidth2, newHeight2).toBuffer(), top: 0, left: newWidth1 }
//     ]).toFile(outputPath);

//     console.log('Images merged successfully!');
//   } catch (error) {
//     console.error('Error merging images:', error);
//   }
// }

// // Example usage
// const image1Path = 'image1.jpeg';
// const image2Path = 'image2.jpeg';
// const outputPath = 'output.jpg';

// mergeImages(image1Path, image2Path, outputPath);
