import ProcessingRequest from "../models/processingRequest.js";
import ProductImage from "../models/productImage.js";

//  |  1. Receive request ID  ->  2. Find request request ID ->  3. Prepare detailed status of  ->  4. Return status   |

class StatusController {
  async checkStatus(req, res) {
    try {
      const { requestId } = req.params;

      // Find the processing request
      const processingRequest = await ProcessingRequest.findOne({
        requestId,
      }).populate("products");

      if (!processingRequest) {
        return res.status(404).json({
          status: "error",
          message: "Request not found",
        });
      }

      // Prepare detailed status
      const productStatus = await Promise.all(
        processingRequest.products.map(async (product) => ({
          productName: product.productName,
          status: product.status,
          inputUrls: product.inputUrls,
          outputUrls: product.outputUrls,
        }))
      );

      res.json({
        status: "success",
        requestId,
        overallStatus: processingRequest.status,
        totalImages: processingRequest.totalImages,
        processedImages: processingRequest.processedImages,
        products: productStatus,
      });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve status",
        error: error.message,
      });
    }
  }
}

export default new StatusController();
