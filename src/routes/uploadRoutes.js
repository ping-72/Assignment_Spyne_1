import express from "express";
// import uploadController from "../controllers/uploadController";
import uploadController from "../controllers/uploadController.js";

const router = express.Router();

// POST /api/upload - Upload CSV for processing
router.post("/", uploadController.uploadCSV, uploadController.processUpload);

export default router;
