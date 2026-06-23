import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    resourceType: String,
    originalName: String,
    size: Number
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting_on_customer", "resolved", "closed"],
      default: "open"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    category: { type: String, default: "General" },
    tags: [{ type: String, trim: true }],
    attachments: [attachmentSchema],
    ai: {
      summary: String,
      suggestedReply: String,
      sentiment: {
        label: { type: String, enum: ["positive", "neutral", "negative", "angry"], default: "neutral" },
        score: { type: Number, default: 0 }
      },
      detectedPriority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
      }
    },
    firstResponseAt: Date,
    resolvedAt: Date
  },
  { timestamps: true }
);

ticketSchema.index({ title: "text", description: "text", tags: "text" });
ticketSchema.index({ status: 1, priority: 1, assignedTo: 1 });
ticketSchema.index({ customer: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });

export default mongoose.model("Ticket", ticketSchema);
