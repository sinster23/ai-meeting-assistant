// packages/backend/src/modules/meeting/meeting.model.ts

import mongoose, { Schema, Document } from "mongoose";
import type { MeetingStatus, ActionItem } from "@repo/types";

export type { MeetingStatus };

export interface IMeeting extends Document {
  userId: string;
  audioPath: string;
  status: MeetingStatus;
  transcript?: string;
  summary?: string;
  keyPoints?: string[];
  actionItems?: ActionItem[];
  source: "recording" | "upload";
  originalFileName?: string;
  createdAt: Date;
  updatedAt: Date;
  durationSeconds?: number;
fileSizeBytes?: number;
}

const ActionItemSchema = new Schema<ActionItem>(
  {
    task: { type: String, required: true },
    owner: { type: String, default: null },
    deadline: { type: String, default: null },
  },
  { _id: false }
);

const MeetingSchema = new Schema<IMeeting>(
  {
    userId: { type: String, required: true, default: "anonymous" },
    audioPath: { type: String, required: true },
    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },
    transcript: { type: String },
    summary: { type: String },
    keyPoints: { type: [String], default: [] },
    actionItems: { type: [ActionItemSchema], default: [] },
    source: {
      type: String,
      enum: ["recording", "upload"],
      default: "recording",
    },
    durationSeconds: { type: Number, default: null },
fileSizeBytes:   { type: Number, default: null },
    originalFileName: { type: String },
  },
  { timestamps: true }
);

export const MeetingModel =
  (mongoose.models.Meeting as mongoose.Model<IMeeting>) ||
  mongoose.model<IMeeting>("Meeting", MeetingSchema);