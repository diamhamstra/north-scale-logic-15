#!/usr/bin/env bash
# MetaCopier API smoke test — verifies endpoints used by metacopierService / performanceSync.
# Usage: METACOPIER_API_KEY=your_key ./scripts/test-metacopier-api.sh
# Never commit or echo the API key.

set -euo pipefail

BASE_URL="https://api.metacopier.io/rest/api/v1"

if [[ -z "${METACOPIER_API_KEY:-}" ]]; then
  echo "ERROR: Set METACOPIER_API_KEY in your environment first."
  echo "  export METACOPIER_API_KEY='your-key-here'"
  echo "  ./scripts/test-metacopier-api.sh"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer ${METACOPIER_API_KEY}"

echo "=== MetaCopier API smoke test ==="
echo "Base URL: ${BASE_URL}"
echo ""

# --- GET /accounts ---
echo "--- GET /accounts ---"
ACCOUNTS_HTTP=$(curl -sS -o /tmp/mc-accounts.json -w "%{http_code}" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/accounts")
echo "HTTP status: ${ACCOUNTS_HTTP}"

if [[ "${ACCOUNTS_HTTP}" != "200" ]]; then
  echo "Response body:"
  cat /tmp/mc-accounts.json
  echo ""
  exit 1
fi

# Detect response shape without assuming array vs object wrapper
ACCOUNT_COUNT=$(python3 - <<'PY'
import json
with open("/tmp/mc-accounts.json") as f:
    data = json.load(f)
if isinstance(data, list):
    print(len(data))
elif isinstance(data, dict):
    items = data.get("items") or data.get("accounts") or data.get("data") or []
    print(len(items) if isinstance(items, list) else 1)
else:
    print(0)
PY
)
echo "Account count: ${ACCOUNT_COUNT}"

echo "Top-level keys (accounts response):"
python3 - <<'PY'
import json
with open("/tmp/mc-accounts.json") as f:
    data = json.load(f)
if isinstance(data, list) and data:
    print("  (array) first item keys:", sorted(data[0].keys()))
elif isinstance(data, dict):
    print("  ", sorted(data.keys()))
    for k in ("items", "accounts", "data"):
        if k in data and isinstance(data[k], list) and data[k]:
            print(f"  {k}[0] keys:", sorted(data[k][0].keys()))
            break
PY

# Pick first account id
ACCOUNT_ID=$(python3 - <<'PY'
import json
with open("/tmp/mc-accounts.json") as f:
    data = json.load(f)
items = data if isinstance(data, list) else (
    data.get("items") or data.get("accounts") or data.get("data") or [data]
)
if not items:
    raise SystemExit(1)
first = items[0] if isinstance(items, list) else items
for key in ("id", "accountId", "account_id", "uuid"):
    if key in first and first[key]:
        print(first[key])
        break
else:
    raise SystemExit(1)
PY
) || { echo "No accounts found — cannot test performanceMetrics."; exit 0; }

echo ""
echo "Using account id: ${ACCOUNT_ID}"

# --- GET /accounts/{id} (used by getAccountOverview) ---
echo ""
echo "--- GET /accounts/${ACCOUNT_ID} ---"
ACCOUNT_HTTP=$(curl -sS -o /tmp/mc-account.json -w "%{http_code}" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/accounts/${ACCOUNT_ID}")
echo "HTTP status: ${ACCOUNT_HTTP}"

echo "Account detail keys vs code expectations (balance, equity, currency, brokerName|broker, platform, environment):"
python3 - <<'PY'
import json
EXPECTED = ["balance", "equity", "currency", "platform", "environment"]
BROKER_KEYS = ["brokerName", "broker"]
with open("/tmp/mc-account.json") as f:
    data = json.load(f)
keys = set(data.keys()) if isinstance(data, dict) else set()
for field in EXPECTED:
    present = field in keys
    val = data.get(field) if present else None
    print(f"  {field}: {'OK' if present else 'MISSING'}  value={val!r}")
broker = next((data.get(k) for k in BROKER_KEYS if k in keys), None)
print(f"  broker (brokerName|broker): {'OK' if broker is not None else 'MISSING'}  value={broker!r}")
extra = sorted(k for k in keys if k not in EXPECTED + BROKER_KEYS)
if extra:
    print("  other fields:", ", ".join(extra[:20]), ("..." if len(extra) > 20 else ""))
PY

# --- GET /accounts/{id}/performanceMetrics ---
echo ""
echo "--- GET /accounts/${ACCOUNT_ID}/performanceMetrics ---"
METRICS_HTTP=$(curl -sS -o /tmp/mc-metrics.json -w "%{http_code}" \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/accounts/${ACCOUNT_ID}/performanceMetrics")
echo "HTTP status: ${METRICS_HTTP}"

if [[ "${METRICS_HTTP}" != "200" ]]; then
  echo "Response body:"
  cat /tmp/mc-metrics.json
  exit 1
fi

echo "Performance metrics field mapping:"
python3 - <<'PY'
import json

# Code expects these API fields (see metacopierService + performanceSync)
MAPPING = [
    ("balance", "overview/metrics balance"),
    ("equity", "overview/metrics equity"),
    ("openFloatingPnL | floatingPnL | openProfit", ["openFloatingPnL", "floatingPnL", "openProfit"], "openPL / open_pl"),
    ("closedProfit", "closed_pl"),
    ("gain", "totalReturnPct / total_return"),
    ("monthly", "monthlyReturnPct / monthly_return"),
    ("ytdGain", "ytdReturnPct"),
    ("maxDrawdown", "maxDrawdownPct / max_drawdown"),
    ("winRate", "win_rate"),
    ("profitFactor", "profit_factor"),
    ("trades", "totalTrades"),
    ("avgWin", "avgWin"),
    ("avgLoss", "avgLoss"),
    ("sharpeRatio", "sharpeRatio"),
    ("balanceEquityDivergencePerDay | floatingPnlPerDay", ["balanceEquityDivergencePerDay", "floatingPnlPerDay"], "equity curve"),
    ("byMonth", "monthly returns"),
    ("equityDrawdownPerDay", "drawdown history"),
]

with open("/tmp/mc-metrics.json") as f:
    data = json.load(f)
keys = set(data.keys()) if isinstance(data, dict) else set()

print(f"  Top-level keys ({len(keys)}): {', '.join(sorted(keys)[:30])}{'...' if len(keys) > 30 else ''}")
print("")
issues = []
for entry in MAPPING:
    if len(entry) == 2:
        api_field, maps_to = entry
        alts = [api_field]
    else:
        api_field, alts, maps_to = entry
    found = [a for a in alts if a in keys]
    if found:
        sample = data.get(found[0])
        if isinstance(sample, list):
            detail = f"list[{len(sample)}]"
            if sample and isinstance(sample[0], dict):
                detail += f" item keys: {sorted(sample[0].keys())}"
        else:
            detail = repr(sample)
        print(f"  OK  {api_field} -> {maps_to}  ({detail})")
    else:
        print(f"  MISSING  {api_field} -> {maps_to}")
        issues.append(api_field)

print("")
if issues:
    print(f"WARNING: {len(issues)} expected field(s) not present — code may use fallbacks or zeros.")
else:
    print("All mapped fields present.")
PY

echo ""
echo "Done. Temp files: /tmp/mc-accounts.json /tmp/mc-account.json /tmp/mc-metrics.json"
