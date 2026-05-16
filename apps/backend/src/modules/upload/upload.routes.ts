// packages/backend/src/modules/upload/upload.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import { MeetingModel } from "../meeting/meeting.model";

const router = Router();

// ── GET /uploads ──────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploads = await MeetingModel.find({ userId: "anonymous", source: "upload" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(
      uploads.map((r) => ({
        recordingId:      (r._id as unknown as { toString(): string }).toString(),
        status:           r.status,
        source:           r.source ?? "upload",
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

// ── GET /uploads/stats ────────────────────────────────────────────────────

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploads = await MeetingModel.find({ userId: "anonymous", source: "upload" }).lean();

    const totalRecordings     = uploads.length;
    const totalDurationSeconds = uploads.reduce(
      (sum, m) => sum + ((m as any).durationSeconds ?? 0),
      0
    );
    const totalSizeBytes = uploads.reduce(
      (sum, m) => sum + ((m as any).fileSizeBytes ?? 0),
      0
    );

    res.json({ totalRecordings, totalDurationSeconds, totalSizeBytes });
  } catch (err) {
    next(err);
  }
});

// ── GET /uploads/:id ──────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const upload = await MeetingModel.findOne({
      _id: req.params.id,
      userId: "anonymous",
      source: "upload",
    }).lean();

    if (!upload) {
      res.status(404).json({ error: "Upload not found." });
      return;
    }

    res.json({
      recordingId:      (upload._id as unknown as { toString(): string }).toString(),
      status:           upload.status,
      source:           upload.source ?? "upload",
      originalFileName: upload.originalFileName ?? null,
      durationSeconds:  (upload as any).durationSeconds ?? null,
      fileSizeBytes:    (upload as any).fileSizeBytes ?? null,
      meetingId:        (upload._id as unknown as { toString(): string }).toString(),
      createdAt:        upload.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /uploads/:id ───────────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const upload = await MeetingModel.findOneAndDelete({
      _id: req.params.id,
      userId: "anonymous",
      source: "upload",
    }).lean();

    if (!upload) {
      res.status(404).json({ error: "Upload not found." });
      return;
    }

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ── POST /uploads/:id/retry ───────────────────────────────────────────────

router.post("/:id/retry", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const upload = await MeetingModel.findOneAndUpdate(
      { _id: req.params.id, userId: "anonymous", source: "upload" },
      { $set: { status: "processing" } },
      { new: true }
    ).lean();

    if (!upload) {
      res.status(404).json({ error: "Upload not found." });
      return;
    }

    // TODO: enqueue reprocessing job here
    res.json({
      recordingId: (upload._id as unknown as { toString(): string }).toString(),
      status:      upload.status,
    });
  } catch (err) {
    next(err);
  }
});

export default router;