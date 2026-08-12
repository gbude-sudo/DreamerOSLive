// ============================================================
// DreamerOS Connectors - Gateway endpoint contract (types only)
// ============================================================
// Type-only declarations for the gateway endpoints a connector speaks to
// once it is promoted from a pre-live status to 'live'. No runtime logic
// lives here; this file is the single source of truth for the request and
// response shapes the gateway honors.
//
// All endpoints live under /api/v1/integrations/{provider}/* on the gateway
// (two, `/connections` and `/providers`, sit on /api/v1/integrations/* with
// no provider segment). A frontend proxies them under
// /api/integrations/{provider}/*.
//
// Coverage note (added 2026-08-12): this file covers the connect, health,
// disconnect, and action lifecycle a connector author needs. The gateway
// also serves `GET /api/v1/integrations/connection-contract` (customer-safe
// connection copy for the /connect UI) and `GET
// /api/v1/integrations/{provider}/runs`-adjacent sync endpoints already
// marked DEFERRED below. `connection-contract` is gateway-internal render
// data, not a shape a connector author calls directly, so it stays out of
// this file on purpose rather than by omission.
// ============================================================

/**
 * GET /api/v1/integrations/{provider}/oauth/start
 * Begins an OAuth flow. The gateway mints a CSRF state, persists the pending
 * link, and returns the upstream authorize URL the browser should redirect to.
 * Auth: Supabase access token in the Authorization Bearer header.
 * Corrected 2026-08-12: this route is GET on the live gateway, not POST.
 * The live response also does not carry a `state` field; the state token
 * rides inside `authorize_url` as a query param.
 */
export interface OAuthStartResponse {
  authorize_url: string;
  provider: string;
}

/**
 * GET /api/v1/integrations/{provider}/oauth/callback?code={code}&state={state}
 * The provider redirects here after consent. The gateway exchanges the code
 * for tokens, stores them encrypted, and 302-redirects back to /connect with
 * a status query param (connected | denied | error | state_mismatch).
 */
export interface OAuthCallbackQuery {
  code: string;
  state: string;
}

/**
 * POST /api/v1/integrations/{provider}/paste-token
 * Paste-token / api-key connect flow. The user pastes a PAT; the gateway
 * verifies it upstream, stores it against the user, and returns the resolved
 * identity and granted scopes. 400 on a bad token.
 */
export interface PasteTokenRequest {
  token: string;
  display_label?: string;
}

export interface PasteTokenResponse {
  connected: boolean;
  id: string;
  provider: string;
  identity: string | null;
  scopes: string[];
}

/**
 * GET /api/v1/integrations/{provider}/health
 * Live connection health for a paste-token / api-key provider. Drives the
 * per-card health pill.
 */
export interface IntegrationHealthResponse {
  alive: boolean;
  connected: boolean;
  status: string | null;
  last_checked: string | null;
}

/**
 * GET /api/v1/integrations/connections
 * All of the user's connections in one call, newest health first.
 */
export interface IntegrationConnection {
  provider: string;
  identity?: string | null;
  status?: string | null;
  last_health_check_at?: string | null;
}

export interface IntegrationConnectionsResponse {
  connections: IntegrationConnection[];
  count: number;
}

/**
 * DELETE /api/v1/integrations/{provider}
 * Revokes the upstream token (best effort), deletes encrypted credentials,
 * and marks the link disconnected.
 * Corrected 2026-08-12: this route is DELETE on `/{provider}` on the live
 * gateway, not POST on a `/{provider}/disconnect` path. The live response
 * shape is also `{ disconnected, provider }`, not `{ ok }`.
 */
export interface DisconnectResponse {
  disconnected: boolean;
  provider: string;
}

/**
 * GET /api/v1/integrations/providers
 * The full list of provider modules the gateway knows about. This is what
 * the frontend reads to render the connection grid; it is broader than any
 * one user's connected set.
 */
export interface KnownProvidersResponse {
  providers: unknown[];
  count: number;
}

/**
 * GET /api/v1/integrations/{provider}/events?limit=20
 * The most recent `connector_action` governance events for this provider,
 * scoped to the calling user. Read-only, newest first. Added 2026-08-12:
 * this route existed on the live gateway before this file listed it.
 */
export interface ProviderEvent {
  action: string | null;
  ok: boolean;
  ifp_verdict: string | null;
  latency_ms: number | null;
  cost_usd: number;
  error: string | null;
  created_at: string;
}

export interface ProviderEventsResponse {
  provider: string;
  events: ProviderEvent[];
  count: number;
}

/**
 * GET /api/v1/integrations/usage?days=30
 * Per-provider action counts for the calling user across every connected
 * provider, most-used first. Added 2026-08-12: this route existed on the
 * live gateway before this file listed it.
 */
export interface ProviderUsage {
  provider: string;
  actions: number;
  ok: number;
  failed: number;
  last_used_at: string;
}

export interface UsageResponse {
  days: number;
  providers: ProviderUsage[];
  count: number;
}

/**
 * POST /api/v1/integrations/{provider}/actions/{action}
 * Executes one IFP-gated connector action. The action name must be on the
 * gateway's allowlist for that provider (see the provider's own module for
 * which actions it exposes); an action outside the allowlist 404s. Body is
 * forwarded to the action as keyword arguments. Added 2026-08-12: this
 * route existed on the live gateway before this file listed it.
 */
export interface ConnectorActionRequest {
  [key: string]: unknown;
}

export interface ConnectorActionResponse {
  provider: string;
  action: string;
  ifp_verdict: string;
  latency_ms: number;
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * POST /api/v1/integrations/{provider}/sync/trigger
 * DEFERRED: enqueues an on-demand sync run. Returns the run id and initial
 * status so the UI can poll for completion. Shape is the intended contract
 * for when the gateway sync pipeline ships.
 */
export interface SyncTriggerResponse {
  run_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
}

/**
 * GET /api/v1/integrations/{provider}/runs?limit=20
 * DEFERRED: most recent sync runs for the provider, newest first.
 */
export interface IntegrationRun {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  started_at: string;
  finished_at: string | null;
  summary: string;
}

export interface IntegrationRunsResponse {
  runs: IntegrationRun[];
}

/**
 * Standardized shell-state response a proxy returns before the matching
 * gateway endpoint is implemented. Status 501.
 */
export interface IntegrationShellResponse {
  error: "shell";
  provider: string;
  message: string;
}
