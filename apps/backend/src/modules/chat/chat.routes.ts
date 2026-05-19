// packages/backend/src/modules/chat/chat.routes.ts
//
// Mounts under /meetings/:id/chat (registered in server.ts via meetingRoutes,
// or as a standalone router — see integration note at the bottom).
//
// Endpoints:
//   POST /meetings/:id/chat        → ask a question about the meeting
//   GET  /meetings/:id/chat/history → fetch previous messages (for page reload)

import { Router, Request, Response, NextFunction } from "express";
import { chatWithMeeting, getChatHistory } from "./chat.service";
import { requireAuth } from "../auth/auth.middleware";

const router = Router({ mergeParams: true }); // mergeParams exposes :id from parent

// Auth guard — all chat endpoints require a valid session
router.use(requireAuth);

// ── POST /meetings/:id/chat ───────────────────────────────────────────────

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meetingId = req.params.id;
      const message: unknown = req.body?.message;

      if (typeof message !== "string" || !message.trim()) {
        res.status(400).json({ error: "message must be a non-empty string." });
        return;
      }

      if (message.length > 2000) {
        res.status(400).json({ error: "message must be 2000 characters or fewer." });
        return;
      }

      const result = await chatWithMeeting(
        meetingId,
        req.user.id,
        message.trim(),
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /meetings/:id/chat/history ────────────────────────────────────────

router.get(
  "/history",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meetingId = req.params.id;

      const history = await getChatHistory(meetingId, req.user.id);

      res.json({ history });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

// ── Integration note ──────────────────────────────────────────────────────
//
// In meeting.routes.ts, add:
//
//   import chatRouter from "../chat/chat.routes";
//   router.use("/:id/chat", chatRouter);
//
// This makes chatRouter inherit the :id param from meeting.routes.ts and
// produces the clean URL structure:
//
//   POST /meetings/:id/chat
//   GET  /meetings/:id/chat/history