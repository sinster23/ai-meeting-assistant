// packages/backend/src/modules/search/meeting-chunk.model.ts
//
// Stores transcript chunks alongside their all-MiniLM-L6-v2 embeddings (384-dim).

import mongoose, { Schema, Document } from "mongoose";

export interface IMeetingChunk extends Document {
  meetingId: string;
  userId: string;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];  // 384-dim — all-MiniLM-L6-v2
  createdAt: Date;
}

const MeetingChunkSchema = new Schema<IMeetingChunk>(
  {
    meetingId:  { type: String, required: true, index: true },
    userId:     { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    chunkText:  { type: String, required: true },
    embedding:  { type: [Number], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MeetingChunkSchema.index({ meetingId: 1, chunkIndex: 1 });
MeetingChunkSchema.index({ userId: 1 });

export const MeetingChunkModel =
  (mongoose.models.MeetingChunk as mongoose.Model<IMeetingChunk>) ||
  mongoose.model<IMeetingChunk>("MeetingChunk", MeetingChunkSchema);

// ── Atlas Vector Search index definition (optional but recommended) ────────
//
// Collection : meetingchunks
// Index name : meeting_chunks_vector_index
//
// {
//   "fields": [
//     {
//       "type": "vector",
//       "path": "embedding",
//       "numDimensions": 384,       ← all-MiniLM-L6-v2 output size
//       "similarity": "cosine"
//     },
//     {
//       "type": "filter",
//       "path": "userId"
//     }
//   ]
// }
//
// Without this index the service automatically falls back to in-process
// cosine similarity — correct results, slower for large datasets.