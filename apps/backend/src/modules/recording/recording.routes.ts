// packages/backend/src/modules/recording/recording.routes.ts
//
// Changes vs original:
//   • requireAuth applied to all routes
//   • userId sourced from req.user.id (session)

import { Router, Request, Response, NextFunction } from "express";
import { MeetingModel } from "../meeting/meeting.model";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.use(requireAuth);

// ── GET /recordings ───────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordings = await MeetingModel.find({
      userId: req.user.id,
      source: "recording",
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(
      recordings.map((r) => ({
        recordingId:      (r._id as unknown as { toString(): string }).toString(),
        status:           r.status,
        source:           r.source ?? "recording",
        durationSeconds:  (r as any).durationSeconds ?? null,
        fileSizeBytes:    (r as any).fileSizeBytes ?? null,
        originalFileName: r.originalFileName ?? null,
        meetingId:        (r._id as unknown as { toString(): string }).toString(),
        createdAt:        r.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ── GET /recordings/stats ─────────────────────────────────────────────────

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meetings = await MeetingModel.find({
      userId: req.user.id,
      source: "recording",
    }).lean();

    res.json({
      totalRecordings:     meetings.length,
      totalDurationSeconds: meetings.reduce((s, m) => s + ((m as any).durationSeconds ?? 0), 0),
      totalSizeBytes:       meetings.reduce((s, m) => s + ((m as any).fileSizeBytes ?? 0), 0),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /recordings/:id ───────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingModel.findOne({
      _id:    req.params.id,
      userId: req.user.id,
      source: "recording",
    }).lean();

    if (!meeting) {
      res.status(404).json({ error: "Recording not found." });
      return;
    }

    res.json({
      recordingId:      (meeting._id as unknown as { toString(): string }).toString(),
      status:           meeting.status,
      source:           meeting.source ?? "recording",
      originalFileName: meeting.originalFileName ?? null,
      durationSeconds:  (meeting as any).durationSeconds ?? null,
      fileSizeBytes:    (meeting as any).fileSizeBytes ?? null,
      meetingId:        (meeting._id as unknown as { toString(): string }).toString(),
      createdAt:        meeting.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /recordings/:id ────────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingModel.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user.id,
    }).lean();

    if (!meeting) {
      res.status(404).json({ error: "Recording not found." });
      return;
    }

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ── POST /recordings/:id/retry ────────────────────────────────────────────

router.post("/:id/retry", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { status: "processing" } },
      { new: true }
    ).lean();

    if (!meeting) {
      res.status(404).json({ error: "Recording not found." });
      return;
    }

    res.json({
      recordingId: (meeting._id as unknown as { toString(): string }).toString(),
      status:      meeting.status,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

