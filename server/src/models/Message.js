import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    attachments: [
      {
        url: String,
        publicId: String,
        originalName: String,
        resourceType: String,
        size: Number
      }
    ],
    isInternal: { type: Boolean, default: false },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

messageSchema.index({ ticket: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
