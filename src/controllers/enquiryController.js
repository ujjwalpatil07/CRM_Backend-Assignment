import mongoose from "mongoose";
import Enquiry from "../models/Enquiry.js";

// CREATE PUBLIC ENQUIRY
// No authentication required.

export const createEnquiry = async (req, res, next) => {
  try {
    const { name, email, phone, courseInterest, message } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof courseInterest !== "string" ||
      !courseInterest.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email and course interest are required.",
      });
    }

    if (
      (phone !== undefined && typeof phone !== "string") ||
      (message !== undefined && typeof message !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone and message must be strings.",
      });
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      courseInterest: courseInterest.trim(),
      message: message?.trim() || "",

      // Initially every enquiry is public.
      claimedBy: null,
      claimedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL PUBLIC / UNCLAIMED ENQUIRIES
// Authentication required.

export const getPublicEnquiries = async (req, res, next) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 20;

    const filter = {
      claimedBy: null,
    };

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Public enquiries fetched successfully.",

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      enquiries,
    });
  } catch (error) {
    next(error);
  }
};

// CLAIM AN ENQUIRY
// Authentication required.

export const claimEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    // Atomic operation: only one employee can claim a lead.
    const enquiry = await Enquiry.findOneAndUpdate(
      {
        _id: id,
        claimedBy: null,
      },
      {
        $set: {
          claimedBy: req.user.id,
          claimedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (enquiry) {
      return res.status(200).json({
        success: true,
        message: "Enquiry claimed successfully.",
        enquiry,
      });
    }

    const existingEnquiry = await Enquiry.findById(id);

    if (!existingEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.status(409).json({
      success: false,
      message: "This enquiry has already been claimed.",
    });
  } catch (error) {
    next(error);
  }
};

// GET ENQUIRIES CLAIMED BY LOGGED-IN EMPLOYEE
// Authentication required.

export const getMyEnquiries = async (req, res, next) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 20;

    const filter = {
      claimedBy: req.user.id,
    };

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .sort({ claimedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Your enquiries fetched successfully.",

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      enquiries,
    });
  } catch (error) {
    next(error);
  }
};
