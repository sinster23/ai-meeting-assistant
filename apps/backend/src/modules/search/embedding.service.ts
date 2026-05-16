// packages/backend/src/modules/search/embedding.service.ts
//
// Uses @huggingface/transformers (v3) — the official successor to @xenova/transformers.
// Does NOT require sharp for text-only pipelines, so no Windows native module issues.
//
// Model  : Xenova/all-MiniLM-L6-v2
// Output : 384-dim normalised float32 vectors
// Storage: model downloads once to .cache/huggingface (~25 MB), then loads from disk
//
// Install:
//   bun remove @xenova/transformers
//   bun add @huggingface/transformers

import { pipeline, env } from "@huggingface/transformers";
import type { FeatureExtractionPipeline } from "@huggingface/transformers";

// Disable the browser cache check — we're in Node
env.useBrowserCache = false;
env.allowLocalModels = false;   // always fetch from HF hub on first run

// ── Singleton model loader ────────────────────────────────────────────────
// Model loads once per process lifetime. A loadPromise guard prevents a
// double-download race if two requests arrive before the first load completes.

class EmbeddingService {
  private static model: FeatureExtractionPipeline | null = null;
  private static loadPromise: Promise<FeatureExtractionPipeline> | null = null;

  static async getModel(): Promise<FeatureExtractionPipeline> {
    if (this.model) return this.model;

    if (this.loadPromise) return this.loadPromise;

    console.info(
      "[embedding] Loading Xenova/all-MiniLM-L6-v2 — first run downloads ~25 MB…"
    );

    this.loadPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    ).then((m) => {
      this.model = m as FeatureExtractionPipeline;
      this.loadPromise = null;
      console.info("[embedding] Model ready.");
      return this.model;
    });

    return this.loadPromise;
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/** Embed a single string → 384-dim float array. */
export async function embedText(text: string): Promise<number[]> {
  const model = await EmbeddingService.getModel();
  const output = await model(text.trim(), { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Embed multiple strings sequentially.
 * The model stays loaded in memory so this is fast despite being sequential.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const model = await EmbeddingService.getModel();
  const results: number[][] = [];

  for (const text of texts) {
    const output = await model(text.trim(), { pooling: "mean", normalize: true });
    results.push(Array.from(output.data as Float32Array));
  }

  return results;
}

/** Cosine similarity — used by the in-process fallback search. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Call once at server startup to pre-load the model.
 * Prevents the first real request from paying the cold-start cost.
 *
 * Usage in src/app.ts (before app.listen):
 *   import { warmupEmbedding } from "./modules/search/embedding.service";
 *   await warmupEmbedding();
 */
export async function warmupEmbedding(): Promise<void> {
  await EmbeddingService.getModel();
}

/** Atlas Vector Search index numDimensions value for this model. */
export const EMBEDDING_DIMENSIONS = 384;