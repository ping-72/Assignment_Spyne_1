import mongoose from "mongoose";

const processingRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
    default: "PENDING",
  },
  totalImages: {
    type: Number,
    default: 0,
  },
  processedImages: {
    type: Number,
    default: 0,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductImage",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ProcessingRequest", processingRequestSchema);
