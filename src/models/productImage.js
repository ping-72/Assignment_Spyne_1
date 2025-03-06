import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProcessingRequest",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  inputUrls: [
    {
      type: String,
      required: true,
    },
  ],
  outputUrls: [
    {
      type: String,
      required: true,
    },
  ],
  downloadUrls: [
    {
      type: String,
      required: true,
    },
  ],
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED", "PROCESSING"],
    default: "PENDING",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProductImage = mongoose.model("ProductImage", productImageSchema);

export default ProductImage;
