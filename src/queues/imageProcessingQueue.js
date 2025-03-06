import Queue from "bull";
import imageProcessorService from "../services/imageProcessor.js";
import ProductImage from "../models/productImage.js";
import ProcessingRequest from "../models/processingRequest.js";

const imageProcessingQueue = new Queue("image-processing", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Start → Update productImage status to "PROCESSING" → Process images (download, compress, save) → Update productImage with output URLs and status to "COMPLETED" → Update ProcessingRequest → End (or Error → Update productImage and ProcessingRequest to "FAILED" → End)
imageProcessingQueue.process(async (job) => {
  const { productImage, requestId } = job.data;

  try {
    await ProductImage.findByIdAndUpdate(productImage._id, {
      status: "PROCESSING",
    });

    const outputUrls = [];
    const downloadUrls = [];
    for (const inputUrl of productImage.inputUrls) {
      const imageBuffer = await imageProcessorService.downloadImage(inputUrl);

      const compressedBuffer = await imageProcessorService.compressImage(
        imageBuffer
      );

      const { downloadPath, savedPath } =
        await imageProcessorService.saveCompressedImage(
          compressedBuffer,
          productImage.productName
        );

      outputUrls.push(savedPath);
      downloadUrls.push(downloadPath);
    }

    await ProductImage.findByIdAndUpdate(productImage._id, {
      outputUrls,
      downloadUrls,
      status: "COMPLETED",
    });

    await ProcessingRequest.findOneAndUpdate(
      { requestId },
      {
        $inc: { processedImages: 1 },
        $set: {
          status:
            outputUrls.length === productImage.inputUrls.length
              ? "COMPLETED"
              : "PROCESSING",
        },
      }
    );

    return { success: true, outputUrls, downloadUrls };
  } catch (error) {
    await ProductImage.findByIdAndUpdate(productImage._id, {
      status: "FAILED",
    });

    await ProcessingRequest.findOneAndUpdate(
      { requestId },
      {
        status: "FAILED",
        $inc: { processedImages: 1 },
      }
    );

    throw error;
  }
});

imageProcessingQueue.on("failed", async (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err}`);
});

export default imageProcessingQueue;
