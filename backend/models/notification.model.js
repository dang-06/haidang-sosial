import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: ["like", "comment", "tag", "follow", "mention", "reply"],
    required: true
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
  isRead: { type: Boolean, default: false },
  message: { type: String },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
