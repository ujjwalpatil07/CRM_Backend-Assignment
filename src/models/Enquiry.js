import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    courseInterest: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Optimize public and counselor-specific enquiry queries.
enquirySchema.index({ claimedBy: 1, createdAt: -1 });
enquirySchema.index({ claimedBy: 1, claimedAt: -1 });

const Enquiry = mongoose.model("Enquiry", enquirySchema);

export default Enquiry;
