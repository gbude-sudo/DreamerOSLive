#!/usr/bin/env python3
"""Detect method and path drift between the SDK gateway contract and the gateway.

The contract file packages/schema/src/gateway-contract.ts declares each gateway
endpoint in a JSDoc header line, for example:

    * GET /api/v1/integrations/{provider}/oauth/start

This script reads every such declaration and compares it against the gateway's
OpenAPI document. A declaration is drift when the path exists on the gateway but
under a different method, or when the path does not exist at all.

Blocks marked DEFERRED describe endpoints the gateway has not shipped yet. They
are reported but never fail the run.

Endpoints the gateway serves that the contract does not declare are reported as
coverage notes only. The contract excludes some routes on purpose.

Python standard library only. No install step, so the job stays cheap.

Usage:
    contract_drift_check.py --contract PATH [--spec URL_OR_FILE] [--expect-drift N]

Exit codes:
    0  no drift, or the live spec was unreachable and --allow-unreachable is set
    1  drift found (or --expect-drift did not match)
    2  the script could not run at all
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request

METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE")
DECLARATION = re.compile(
    r"^\s*\*\s*(" + "|".join(METHODS) + r")\s+(/api/v1/\S+)\s*$"
)


def parse_contract(text):
    """Return a list of (method, path, deferred, line_number) declarations.

    A declaration is deferred when the word DEFERRED appears in the same JSDoc
    block. The block runs from the opening marker to the closing marker.
    """
    lines = text.splitlines()
    blocks = []
    start = None
    for index, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("/**"):
            start = index
        elif stripped.startswith("*/") and start is not None:
            blocks.append((start, index))
            start = None

    found = []
    for first, last in blocks:
        body = lines[first : last + 1]
        deferred = any("DEFERRED" in entry for entry in body)
        for offset, line in enumerate(body):
            match = DECLARATION.match(line)
            if match:
                path = match.group(2).split("?", 1)[0].rstrip("/")
                found.append((match.group(1), path, deferred, first + offset + 1))
    return found


def load_spec(source):
    """Load an OpenAPI document from a URL or a local file."""
    if source.startswith("http://") or source.startswith("https://"):
        request = urllib.request.Request(
            source, headers={"User-Agent": "dreameros-contract-drift-check"}
        )
        with urllib.request.urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))
    with open(source, "r", encoding="utf-8") as handle:
        return json.load(handle)


def spec_methods(spec):
    """Return {path: sorted list of upper case methods} from an OpenAPI document."""
    table = {}
    for path, operations in (spec.get("paths") or {}).items():
        served = sorted(
            method.upper()
            for method in operations
            if method.lower() in [entry.lower() for entry in METHODS]
        )
        if served:
            table[path.rstrip("/")] = served
    return table


def check(declarations, served):
    """Return (drift list, deferred list, coverage note list)."""
    drift = []
    deferred = []
    for method, path, is_deferred, line in declarations:
        if is_deferred:
            deferred.append((method, path, line))
            continue
        if path not in served:
            drift.append(
                "line %d: %s %s is declared, but the gateway serves no such path"
                % (line, method, path)
            )
        elif method not in served[path]:
            drift.append(
                "line %d: %s %s is declared, but the gateway serves %s"
                % (line, method, path, " and ".join(served[path]))
            )

    declared_pairs = {
        (method, path) for method, path, is_deferred, _ in declarations if not is_deferred
    }
    declared_paths = {path for _, path in declared_pairs}
    notes = []
    for path in sorted(served):
        if not path.startswith("/api/v1/integrations"):
            continue
        if path not in declared_paths:
            notes.append("%s %s is served but not declared" % ("/".join(served[path]), path))
    return drift, deferred, notes


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--contract", required=True)
    parser.add_argument(
        "--spec",
        default="https://dreameros-scs-gateway-production.up.railway.app/openapi.json",
    )
    parser.add_argument(
        "--expect-drift",
        type=int,
        default=None,
        help="Self test: require exactly this many drift findings.",
    )
    parser.add_argument(
        "--allow-unreachable",
        action="store_true",
        help="Exit 0 with a notice when the live spec cannot be fetched.",
    )
    args = parser.parse_args(argv)

    try:
        with open(args.contract, "r", encoding="utf-8") as handle:
            contract_text = handle.read()
    except OSError as error:
        print("ERROR: cannot read the contract: %s" % error)
        return 2

    declarations = parse_contract(contract_text)
    if not declarations:
        print("ERROR: the contract declares no endpoints. The parser or the file changed.")
        return 2

    try:
        spec = load_spec(args.spec)
    except (urllib.error.URLError, OSError, ValueError) as error:
        message = "NOTICE: the gateway spec at %s is unreachable: %s" % (args.spec, error)
        if args.allow_unreachable:
            print(message)
            print("NOTICE: the drift gate did not run. A gateway outage does not block a PR.")
            return 0
        print(message.replace("NOTICE", "ERROR"))
        return 2

    served = spec_methods(spec)
    drift, deferred, notes = check(declarations, served)

    print("Checked %d declared endpoints against %d served paths." % (len(declarations), len(served)))
    for entry in deferred:
        print("  deferred (not checked): %s %s at line %d" % entry)
    for entry in notes:
        print("  coverage note: %s" % entry)

    if args.expect_drift is not None:
        print("Self test expects %d drift finding(s), found %d." % (args.expect_drift, len(drift)))
        for entry in drift:
            print("  drift: %s" % entry)
        if len(drift) != args.expect_drift:
            print("SELF TEST FAILED: the checker did not find the seeded drift.")
            return 1
        print("SELF TEST PASSED.")
        return 0

    if drift:
        print("")
        print("CONTRACT DRIFT: the SDK contract does not match the live gateway.")
        for entry in drift:
            print("  %s" % entry)
        print("")
        print("Fix the declaration in the contract, or fix the gateway route.")
        return 1

    print("No drift. Every declared endpoint matches a live gateway route.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
