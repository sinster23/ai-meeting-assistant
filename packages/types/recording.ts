export type RecordingStatus = "recorded" | "processing" | "completed" | "failed";

export type RecordingSource = "recording" | "upload";
 
export interface RecordingListItem {
  recordingId: string;
  status: RecordingStatus;
  source: RecordingSource;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  originalFileName: string | null;
  /** Same as recordingId — the Meeting document _id */
  meetingId: string;
  createdAt: string;
}
 
export interface StorageStats {
  totalRecordings: number;
  totalDurationSeconds: number;
  totalSizeBytes: number;
}