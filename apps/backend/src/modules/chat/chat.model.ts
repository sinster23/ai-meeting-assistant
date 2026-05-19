// packages/backend/src/modules/chat/chat.model.ts
//
// Persists per-meeting chat history so conversations can be resumed
// and later used for analytics or UX ("show previous questions").

import mongoose, { Schema, Document } from "mongoose";

export type ChatRole = "user" | "assistant";

export interface IChatMessage extends Document {
  meetingId: string;
  userId:    string;
  role:      ChatRole;
  content:   string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    meetingId: { type: String, required: true, index: true },
    userId:    { type: String, required: true, index: true },
    role:      { type: String, enum: ["user", "assistant"], required: true },
    content:   { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound index — fast retrieval of a meeting's full conversation in order
ChatMessageSchema.index({ meetingId: 1, createdAt: 1 });

// userId index for potential cross-meeting history queries
ChatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessageModel =
  (mongoose.models.ChatMessage as mongoose.Model<IChatMessage>) ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);