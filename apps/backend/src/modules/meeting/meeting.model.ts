// packages/backend/src/modules/meeting/meeting.model.ts
//
// Changes vs original:
//   • userId no longer defaults to "anonymous" — it is required and always
//     set from the authenticated session
//   • Added index on userId for efficient per-user queries

import mongoose, { Schema, Document } from "mongoose";
import type { MeetingStatus, ActionItem } from "@repo/types";

export type { MeetingStatus };

export interface IMeeting extends Document {
  userId:           string;
  audioPath:        string;
  status:           MeetingStatus;
  transcript?:      string;
  summary?:         string;
  keyPoints?:       string[];
  actionItems?:     ActionItem[];
  source:           "recording" | "upload";
  originalFileName?: string;
  durationSeconds?: number;
  fileSizeBytes?:   number;
  createdAt:        Date;
  updatedAt:        Date;
}

const ActionItemSchema = new Schema<ActionItem>(
  {
    task:     { type: String, required: true },
    owner:    { type: String, default: null },
    deadline: { type: String, default: null },
  },
  { _id: false }
);

const MeetingSchema = new Schema<IMeeting>(
  {
    userId: {
      type:     String,
      required: true,
      index:    true,   // ← index for efficient per-user queries
    },
    audioPath: { type: String, required: true },
    status: {
      type:    String,
      enum:    ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },
    transcript:       { type: String },
    summary:          { type: String },
    keyPoints:        { type: [String], default: [] },
    actionItems:      { type: [ActionItemSchema], default: [] },
    source: {
      type:    String,
      enum:    ["recording", "upload"],
      default: "recording",
    },
    durationSeconds:  { type: Number, default: null },
    fileSizeBytes:    { type: Number, default: null },
    originalFileName: { type: String },
  },
  { timestamps: true }
);

// Compound index — fast lookup of all meetings for a user, newest first
MeetingSchema.index({ userId: 1, createdAt: -1 });

export const MeetingModel =
  (mongoose.models.Meeting as mongoose.Model<IMeeting>) ||
  mongoose.model<IMeeting>("Meeting", MeetingSchema);