import multer from "multer";
import path from "path";
import CSVParser from "../services/csvParser.js";
import ProcessingRequest from "../models/processingRequest.js";
import ProductImage from "../models/productImage.js";
import { generateRequestId } from "../utils/requestIdGenerator.js";
import imageProcessingQueue from "../queues/imageProcessingQueue.js";

// Configure multer for file upload
const upload = multer({
  dest: "uploads/csv/",
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

class UploadController {
  // Single file upload middleware
  uploadCSV = upload.single("csvFile");

  async processUpload(req, res) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "No CSV file uploaded",
        });
      }

      // Generate unique request ID
      const requestId = generateRequestId();

      // Create processing request record
      const processingRequest = new ProcessingRequest({
        requestId,
        status: "PENDING",
      });
      await processingRequest.save();

      // Parse CSV
      const csvData = await CSVParser.parseCSV(req.file.path);

      // Create product image records and enqueue jobs
      const productImages = await Promise.all(
        csvData.map(async (productData) => {
          const productImage = new ProductImage({
            requestId: processingRequest._id,
            productName: productData.productName,
            inputUrls: productData.inputUrls,
            status: "PENDING",
          });
          await productImage.save();
          console.log("Product image saved successfully");

          // Add to processing queue
          imageProcessingQueue.add({
            productImage: productImage.toObject(),
            requestId,
          });

          return productImage;
        })
      );

      // Update processing request with total images
      await ProcessingRequest.findByIdAndUpdate(processingRequest._id, {
        totalImages: productImages.length,
        products: productImages.map((p) => p._id),
      });

      // Respond with request ID
      res.status(202).json({
        status: "success",
        requestId,
        message: "CSV processing started",
      });
    } catch (error) {
      console.error("Upload processing error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to process CSV",
        error: error.message,
      });
    }
  }
}

export default new UploadController();
