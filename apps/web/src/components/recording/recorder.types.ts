// apps/web/components/recording/recorder.types.ts

export type RecordingState = "idle" | "recording" | "stopped" | "error";

export interface RecorderResult {
  blob: Blob | null;
  duration: number;
}

export interface UseRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  result: RecorderResult | null;
  error: string | null;
  durationSeconds: number;
}