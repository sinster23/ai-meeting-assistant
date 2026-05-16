// packages/backend/src/modules/search/search.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import { searchMeetings } from "./search.service";

const router = Router();

// ── POST /search/query ────────────────────────────────────────────────────
//
// Body: { query: string }
// Response: { answer: string, sources: SourceMeeting[] }
//
// Currently userId is hardcoded to "anonymous" (matching the rest of the
// codebase). Swap for req.user.id once auth is added.

router.post(
  "/query",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query: unknown = req.body?.query;

      if (typeof query !== "string" || !query.trim()) {
        res.status(400).json({ error: "query must be a non-empty string." });
        return;
      }

      if (query.length > 1000) {
        res.status(400).json({ error: "query must be 1000 characters or fewer." });
        return;
      }

      // Sanitize — strip leading/trailing whitespace; keep original otherwise
      const sanitizedQuery = query.trim();

      // userId = "anonymous" until auth is implemented
      const userId = "anonymous";

      const result = await searchMeetings(sanitizedQuery, userId);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;