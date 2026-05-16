// packages/types/meeting.ts
export interface Meeting {
  id: string;
  userId: string;
  audioPath?: string;
  transcript?: string;
  summary?: string;
  keyPoints?: string[];
  actionItems?: ActionItem[];
  status: MeetingStatus;
  createdAt: string;
}

export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
}

export type MeetingStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export type RecordingState = "idle" | "recording" | "stopped" | "error";

export interface UploadMeetingResponse {
  meetingId: string;
  status: "uploaded";
}

export interface MeetingStatusResponse {
  meetingId: string;
  status: MeetingStatus;
  transcript: string | null;
  summary: string | null;
  keyPoints: string[];
  actionItems: ActionItem[];
  createdAt: string;
}