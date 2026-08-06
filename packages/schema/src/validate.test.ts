// ============================================================
// DreamerOS Connectors - runtime validator tests
// ============================================================
// Run with: npm test (tsx --test). No build step required.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { validateConnector, validateRegistry } from "./validate.js";
import {
  mapToProviderTier,
  tierRank,
  userMeetsTier,
  type Provider,
} from "./provider.js";

function validConnector(overrides: Partial<Provider> = {}): Provider {
  return {
    id: "example_tool",
    name: "Example Tool",
    category: "work",
    auth_mode: "oauth",
    status: "coming_online",
    icon_slug: "example",
    tagline: "One line on what this connector gives the operator.",
    tier_required: "pro",
    ifp_rules: [
      "Reads project data so answers use real data, not guesses.",
      "Write actions are held for approval before anything fires.",
    ],
    ...overrides,
  };
}

test("a complete connector validates", () => {
  const result = validateConnector(validConnector());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("non-object input is rejected", () => {
  for (const input of [null, undefined, 42, "connector", []]) {
    const result = validateConnector(input);
    assert.equal(result.valid, false, `expected invalid for ${String(input)}`);
  }
});

test("missing or empty id is rejected", () => {
  const result = validateConnector(validConnector({ id: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("id is required")));
});

test("id must be lowercase snake_case", () => {
  const result = validateConnector(validConnector({ id: "Bad-Id" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("snake_case")));
});

test("unknown category is rejected", () => {
  const result = validateConnector(
    validConnector({ category: "nonsense" as Provider["category"] })
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.startsWith("category must be one of")));
});

test("unknown auth_mode, status, and tier are each rejected", () => {
  const bad = validateConnector({
    ...validConnector(),
    auth_mode: "magic",
    status: "someday",
    tier_required: "free",
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.some((e) => e.startsWith("auth_mode must be one of")));
  assert.ok(bad.errors.some((e) => e.startsWith("status must be one of")));
  assert.ok(bad.errors.some((e) => e.startsWith("tier_required must be one of")));
});

test("ifp_rules must be a non-empty array of non-empty strings", () => {
  const empty = validateConnector(validConnector({ ifp_rules: [] }));
  assert.equal(empty.valid, false);

  const blankEntry = validateConnector(validConnector({ ifp_rules: ["ok", " "] }));
  assert.equal(blankEntry.valid, false);
});

test("all problems are reported in one pass, not just the first", () => {
  const result = validateConnector({ id: "Bad-Id", ifp_rules: [] });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 4, `expected several errors, got: ${result.errors.join("; ")}`);
});

test("a sound registry validates", () => {
  const registry = [validConnector(), validConnector({ id: "second_tool" })];
  const result = validateRegistry(registry);
  assert.equal(result.valid, true);
});

test("duplicate registry ids are rejected", () => {
  const registry = [validConnector(), validConnector()];
  const result = validateRegistry(registry);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate connector id: example_tool")));
});

test("registry errors name the failing connector and index", () => {
  const registry = [validConnector(), validConnector({ id: "second_tool", tagline: "" })];
  const result = validateRegistry(registry);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("connector[1] (second_tool)")));
});

test("tier ladder ranks light < pro < elite", () => {
  assert.ok(tierRank("light") < tierRank("pro"));
  assert.ok(tierRank("pro") < tierRank("elite"));
});

test("gateway-canonical tiers map onto the provider ladder", () => {
  assert.equal(mapToProviderTier("light"), "light");
  assert.equal(mapToProviderTier("dreamweaver_solo"), "pro");
  assert.equal(mapToProviderTier("dreamweaver_duo"), "pro");
  assert.equal(mapToProviderTier("HC"), "elite");
  assert.equal(mapToProviderTier("founder"), "elite");
  assert.equal(mapToProviderTier("unknown_tier"), null);
});

test("userMeetsTier enforces the ladder and rejects unknowns", () => {
  assert.equal(userMeetsTier("elite", "pro"), true);
  assert.equal(userMeetsTier("light", "pro"), false);
  assert.equal(userMeetsTier(null, "light"), false);
  assert.equal(userMeetsTier("unknown_tier", "light"), false);
});
