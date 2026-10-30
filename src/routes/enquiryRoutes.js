import express from "express";

import authenticate from "../middleware/authMiddleware.js";

import {
  createEnquiry,
  getPublicEnquiries,
  claimEnquiry,
  getMyEnquiries,
} from "../controllers/enquiryController.js";

const router = express.Router();

// Public route.
router.post("/", createEnquiry);

// All routes below this middleware require JWT authentication.
router.use(authenticate);

// Get all unclaimed enquiries.
router.get("/public", getPublicEnquiries);

// Get enquiries claimed by logged-in employee.
router.get("/my", getMyEnquiries);

// Claim an enquiry.
router.post("/:id/claim", claimEnquiry);

export default router;
