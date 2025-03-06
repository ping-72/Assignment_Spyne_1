import express from "express";
import statusController from "../controllers/statusController.js";

const router = express.Router();

// GET /api/status/:requestId - Check processing status
router.get("/:requestId", statusController.checkStatus);

export default router;
