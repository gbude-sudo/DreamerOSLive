<div align="center">

<img src="./assets/mark.png" alt="DreamerOS" width="96" />

# DreamerOS Connectors

**Build verified integrations for DreamerOS.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/gbude-sudo/DreamerOSLive/actions/workflows/pr-check.yml/badge.svg)](https://github.com/gbude-sudo/DreamerOSLive/actions/workflows/pr-check.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg)](./tsconfig.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[Quick start](#quick-start) - [Docs](./docs) - [Contributing](./CONTRIBUTING.md) - [Security](./SECURITY.md)

</div>

---

This is the open contract for wiring any external tool into the DreamerOS
AI gateway, where every connector runs through fidelity checks. It is
everything an outside builder needs and nothing they should not have: a
typed schema that defines a valid connector, the gateway endpoint contract
a connector speaks, a validator, a copy-me template, and worked examples.

The definition format is open and free to build against. The orchestration
engine, the intent fidelity runtime, and the memory layer stay in the
hosted DreamerOS service and are not in this repository.

## Features

- **Typed contract.** A connector is a single TypeScript object. If it
  compiles, it is valid - the compiler is the validator.
- **Fidelity-native.** Every connector ships a short list of
  plain-English rules describing what it can do and what stays gated.
  There is no read/write permission toggle grid.
- **MCP-native and memory-aware.** Connectors plug into the DreamerOS MCP
  surface and carry context across turns instead of firing stateless calls.
- **Portable.** A connector definition travels across vendors, so an
  integration is not locked to a single runtime.
- **Four auth modes.** OAuth, paste-token, API key, and MCP client, each
  declared as data.

## Quick start

```bash
git clone https://github.com/gbude-sudo/DreamerOSLive.git
cd DreamerOSLive
npm install
npm run validate
npm test
```

> **Status:** version 0.1.0. The contract is stable to build against; additive
> schema fields may land before 1.0, and existing fields will not be renamed
> or removed without a major version.

> **Testing against the live gateway:** `npm run validate` and `npm test`
> check your connector and the schema itself, offline, with no account
> needed. There is no public sandbox gateway. To see a connector run against
> real endpoints (paste-token connect, OAuth start, health, disconnect,
> actions), you need a hosted DreamerOS account and a Supabase access token
> for it.

Add a connector:

1. Scaffold it with the CLI (or copy `connectors/_template/connector.ts`
   by hand):
   ```bash
   node packages/cli/bin/cli.mjs scaffold slack --name Slack --category work --auth oauth --tier pro
   ```
2. Fill in the fields. The export is typed `: Provider`, so
   `npm run validate` (which runs `tsc --noEmit`) checks it against the
   schema.
3. Write at least one `ifp_rules` line in plain English: what the
   connector reads, what it can write, and what stays gated.
4. Open a pull request. CI type-checks every connector and enforces the
   copy rules.
5. A maintainer reviews and merges. The gateway team implements the
   matching endpoints and flips your connector to `live`.

See [docs/quickstart.md](./docs/quickstart.md) for the full walk-through and
[packages/cli](./packages/cli) for the CLI commands (`scaffold`, `validate`,
`list`).

## How it works

```
Your connector (this repo, public)        DreamerOS gateway (hosted, private)
+-----------------------------+           +-------------------------------+
|  Provider definition        |           |  OAuth / token exchange       |
|  ifp_rules (plain English)  |  ---->    |  Intent fidelity runtime      |
|  auth_mode, tier, category  |           |  Memory and MCP surface        |
+-----------------------------+           +-------------------------------+
        open contract                              hosted engine
```

You declare what a tool is and what it may do. The gateway enforces it.

## Repository layout

```
packages/schema/        the open contract
  src/provider.ts         Provider interface, the four unions, helpers
  src/gateway-contract.ts type-only gateway endpoint contract
  src/validate.ts         runtime validation of a connector object
  src/index.ts            public exports
packages/cli/           the command-line on-ramp (scaffold, validate, list)
connectors/             the connector registry
  _template/              copy this to start a new connector
  github/                 a real worked example (OAuth, live)
  gemini/                 worked example (paste-token, live)
  figma/                  worked example (MCP client)
  firecrawl_apikey/       worked example (API key)
docs/                   quickstart, auth modes, rules, publishing
.github/workflows/      CI: type-check plus copy checks
```

## Connector status lifecycle

| Status          | Meaning                                            |
| --------------- | -------------------------------------------------- |
| `coming_online` | Submitted, visible but pending. Endpoints not built yet. |
| `oauth_pending` | OAuth UI wired, gateway endpoints in progress.     |
| `paste_setup`   | UI is live, awaiting a user paste to connect.      |
| `live`          | Fully wired end to end, reachable at the required tier. |

## Documentation

- [Quick start](./docs/quickstart.md)
- [Auth modes](./docs/auth-modes.md)
- [Writing ifp_rules](./docs/ifp-rules.md)
- [Publishing a connector](./docs/publishing.md)

## Contributing

Pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the
connector format and review process, and the
[Code of Conduct](./CODE_OF_CONDUCT.md) before you start.

## Security

Found a vulnerability? Please report it privately. See
[SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE). The contract is free to build against; the gateway
runtime is the hosted DreamerOS service.
