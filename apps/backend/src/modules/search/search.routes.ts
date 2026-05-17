// packages/backend/src/modules/search/search.routes.ts
//
// Changes vs original:
//   • requireAuth applied — search is scoped to the authenticated user
//   • userId sourced from req.user.id (session), not hardcoded "anonymous"

import { Router, Request, Response, NextFunction } from "express";
import { searchMeetings } from "./search.service";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

// ── POST /search/query ────────────────────────────────────────────────────

router.post(
  "/query",
  requireAuth,
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

      const result = await searchMeetings(query.trim(), req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;