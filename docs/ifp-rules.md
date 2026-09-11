# Writing ifp_rules

IFP stands for intent fidelity protocol: the check that reads a
connector's rules and holds its actions to them.

`ifp_rules` is the heart of a DreamerOS connector and the thing that sets
it apart. Instead of a grid of read/write permission
toggles, every connector ships a short list of plain-English rules that
say what it can do and what stays gated. The gateway checks the intent
behind these rules through the intent fidelity three-axis check (Intent x
Integrity x Trust) plus its evaluation and verification passes.

## What a good rule says

Write each rule for a human reading the card, not for a machine:

1. What the connector reads, and why that helps ("reads your repo metadata
   so answers use real pull requests, not guesses").
2. What it can write, and that writes are held for approval ("commits and
   PRs are held for your approval before anything fires").
3. What is logged ("every action logged to your audit trail with the
   originating intent").
4. How the user revokes ("disconnect from the provider settings; the
   gateway revokes on the next call").

## Rules of thumb

- At least one rule is required. Three to five is typical.
- Name the write actions explicitly. "Write actions are gated" is weaker
  than "commits, PRs, and comments are gated."
- Never claim a capability the gateway does not deliver. Mis-selling a
  connector fails the fidelity check; it is not a copy choice.
- No marketing language, no em dashes, no emojis. Plain operational copy.

## Example (GitHub)

```
Reads your repo metadata only. Never reads private code without explicit per-action approval.
Write actions (commits, PRs, comments) gated by the intent fidelity three-axis check before send.
Revoked tokens detected within 5 minutes - reconnect prompt fires automatically.
All actions logged to your audit trail (Elite tier - export anytime).
```
