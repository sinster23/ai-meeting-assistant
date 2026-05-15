// packages/backend/src/modules/meeting/meeting.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { uploadMeeting } from "./meeting.service";
import { MeetingModel } from "./meeting.model";

const router = Router();

// ── Multer config ─────────────────────────────────────────────────────────
// Accepts both audio and video — ffmpeg handles audio extraction downstream

const ALLOWED_MIME_BASES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const base = file.mimetype.split(";")[0].trim().toLowerCase();
    if (ALLOWED_MIME_BASES.includes(base)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ── POST /meetings/upload ─────────────────────────────────────────────────

router.post(
  "/upload",
  upload.single("audio"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided." });
        return;
      }

      // Distinguish recording blobs from manual uploads via optional header
      const source =
        req.headers["x-upload-source"] === "recording" ? "recording" : "upload";

      const result = await uploadMeeting(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        source
      );

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /meetings ─────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meetings = await MeetingModel.find({ userId: "anonymous" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(
      meetings.map((m) => ({
        meetingId: (m._id as unknown as { toString(): string }).toString(),
        status: m.status,
        summary: m.summary ?? null,
        source: m.source ?? "recording",
        originalFileName: m.originalFileName ?? null,
        createdAt: m.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ── GET /meetings/:id ─────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingModel.findById(req.params.id).lean();

    if (!meeting) {
      res.status(404).json({ error: "Meeting not found." });
      return;
    }

    res.json({
      meetingId: (meeting._id as unknown as { toString(): string }).toString(),
      status: meeting.status,
      transcript: meeting.transcript ?? null,
      summary: meeting.summary ?? null,
      keyPoints: meeting.keyPoints ?? [],
      actionItems: meeting.actionItems ?? [],
      source: meeting.source ?? "recording",
      originalFileName: meeting.originalFileName ?? null,
      createdAt: meeting.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;