// packages/types/integration.ts
//
// Shared types for the integrations feature.
// Used by both the backend (integration.service.ts) and the frontend.

// ─────────────────────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────────────────────

export const PROVIDERS = ["google", "slack", "zoom", "email", "notion"] as const;
export type Provider = (typeof PROVIDERS)[number];

export type ProviderStatus = "connected" | "available" | "coming_soon";

export interface ProviderInfo {
  provider:    Provider;
  name:        string;
  description: string;
  status:      ProviderStatus;
  connectedAt: string | null; // ISO date string, null when not connected
  features:    string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Automation settings
// ─────────────────────────────────────────────────────────────────────────────

export interface AutomationSettings {
  autoSummarize:      boolean;
  autoEmailSummary:   boolean;
  autoImportCalendar: boolean;
  autoStartRecording: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// API response shapes
// ─────────────────────────────────────────────────────────────────────────────

/** GET /integrations/status */
export interface IntegrationStatusResponse {
  providers:  ProviderInfo[];
  automation: AutomationSettings;
}

/** GET /integrations/google/calendar */
export interface CalendarEvent {
  id:          string;
  title:       string;
  description: string | null;
  startAt:     string;        // ISO date string
  endAt:       string;        // ISO date string
  location:    string | null;
  meetLink:    string | null;
  attendees:   string[];
  organizer:   string | null;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

/** PATCH /integrations/automation — request body */
export type UpdateAutomationRequest = Partial<AutomationSettings>;

/** DELETE /integrations/:provider/disconnect */
export interface DisconnectResponse {
  disconnected: boolean;
  provider:     Provider;
}