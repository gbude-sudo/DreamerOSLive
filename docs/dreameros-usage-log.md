# DreamerOS usage log

A public-safe record of how DreamerOS itself is used to build and maintain
this repository. Each entry documents the governed workflow that produced a
change: which DreamerOS surfaces were called, how model routing was decided,
and what the session produced. It exists for three reasons: it is working
evidence that the governance layer described in this repo is real and in
daily use, it feeds product and marketing learning, and it serves as
training material for DreamerOS itself.

Entries are append-only. Internal findings, credentials, and private
infrastructure detail are out of scope for this file by policy.

---

## 2026-08-06 - Public-readiness overhaul (this repository)

**Actor:** Claude Code (local Windows session), governed by the DreamerOS
session package.

**DreamerOS surfaces used this session:**

| Surface | Purpose | Outcome |
| --- | --- | --- |
| `session_package` | Hydrate the session with the governance contract, critical pins, and mode overlay before any work | CONNECTED, fresh (non-cached) package served |
| `state` | Load operator priorities, active blockers, and verified facts | Current sprint context loaded and honored |
| `canon` | Query canonical documents relevant to the work | Canon consulted before acting |
| `recall` | Check for active braid beacons before touching files | No competing strand claimed this repo; safe to proceed |
| `remember` (beacon) | Publish a BRAID BEACON claiming file scope for this strand | Beacon active for the duration of the change |
| `remember` (anchors) | Bank audit results and the operator's compute-routing canon as durable cross-session memory | Continuity preserved for the next session, any engine |

**Model routing (operator canon):** local PC compute first for builds,
tests, greps, and git; small models (Claude Haiku) for bounded remedial
subtasks; larger models only where judgment is required; remote offload via
DreamerOS governed routing when the local machine is not the right place to
run something. Nine Haiku subagents handled bounded read-only review work
in this arc; the main session handled synthesis, decisions, and writes.

**What this session shipped here:** repository security review of the full
working tree and git history (clean), a package identity for the schema
(`@dreameros/connectors-schema`), npm workspaces wiring, a unit test suite
for the runtime validator and tier helpers, a CI test step, and README
corrections (worked-example list, stability statement).

**Braid discipline:** beacon published before first file touch, sealed on
PR open. Every logical change ships as a pull request with a complete,
human-readable description.
