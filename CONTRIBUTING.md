# Contributing a connector

Thanks for building on DreamerOS. A connector is a single typed object
that declares what an external tool is, how it authenticates, what tier it
requires, and - in plain English - what it can do under the fidelity checks
the gateway runs.

## Rules

1. One connector per pull request. Keep the diff reviewable.
2. Your connector file must export a `connector` typed as `Provider`. The
   type is the contract; `npx tsc --noEmit` is the validation.
3. At least one `ifp_rules` line is required. Write it for a human: what
   the connector reads, what it can write, and what stays gated behind
   approval. No marketing copy.
4. No em dashes or en dashes anywhere - code, comments, docs, or PR body.
   Use a spaced hyphen. CI scans for U+2014 and U+2013 and fails the PR.
5. No emojis in connector copy.
6. New connectors start at `status: "coming_online"` unless you are also
   the gateway author landing the endpoints in the same cycle.
7. Never put a real secret, token, client id, or client secret in this
   repo. Auth material lives in the gateway environment. Connector files
   are public.

## Review

A maintainer checks the schema (CI does most of it), the `ifp_rules` copy,
and whether the gateway can honor the declared `auth_mode`. See
`docs/publishing.md` for what happens after merge.
