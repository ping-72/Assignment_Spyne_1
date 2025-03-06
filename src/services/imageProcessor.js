import axios from "axios";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import stream from "stream";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// Get the filename and directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(
      __dirname,
      "..",
      "..",
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    )
  : null;

if (keyFilePath === null)
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

// Method to download an image from a given URL(downloadImage) -> Compress image(compressImage) -> Save compressed image(saveCompressedImage)
class ImageProcessorService {
  async downloadImage(url) {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      console.log("Original image size is :", response.data.length);
      return response.data;
    } catch (error) {
      console.error(`Error downloading image from URL: ${url}`, error);
      throw error;
    }
  }

  // Method to compress an image buffer using sharp library with a specified quality
  async compressImage(imageBuffer, quality = 20) {
    try {
      let compressedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: quality })
        .toBuffer();
      console.log(
        "Image compressed successfully, size:",
        compressedBuffer.length
      );

      return compressedBuffer;
    } catch (error) {
      console.error("Error compressing image:", error);
      throw error;
    }
  }

  async saveCompressedImage(imageBuffer, productName) {
    try {
      const filename = `${Date.now()}_compressed.jpg`;

      // Saving the file in local directory
      // -----------------------------------------------------------------------------------------------------------------------------------------
      // const outputDir = path.join(__dirname, "../output", productName);
      // await fs.mkdir(outputDir, { recursive: true });
      // // Generate a unique filename for the compressed image
      // const filePath = path.join(outputDir, filename);
      // await fs.writeFile(filePath, imageBuffer);
      // console.log("Image saved to:", filePath);
      // -----------------------------------------------------------------------------------------------------------------------------------------

      // ********************************************************************************************************************************************8888

      // Saving the file in Google Drive and retriving it directory
      // -----------------------------------------------------------------------------------------------------------------------------------------

      const bufferStream = new stream.PassThrough();
      bufferStream.end(imageBuffer);

      const fileMetaData = {
        name: filename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };
      const media = {
        MimeType: "image/jpeg",
        body: bufferStream,
      };

      const response = await drive.files.create({
        resource: fileMetaData,
        media: media,
        fields: "id, webViewLink, webContentLink",
      });

      console.log("Image uploaded to Google Drive with ID:", response.data.id);
      console.log("Web View Link:", response.data.webContentLink);
      console.log("Web Content Link:", response.data.webContentLink);

      // Write the image buffer to the file system
      // -----------------------------------------------------------------------------------------------------------------------------------------

      // Return the file path of the saved image
      return {
        downloadPath: response.data.webViewLink,
        savedPath: response.data.webContentLink,
      };
    } catch (error) {
      console.error("Error saving compressed image in Google Drive", error);
      throw error;
    }
  }
}

// Export an instance of ImageProcessorService
export default new ImageProcessorService();
