# Data lineage, implementation and pilot integration

## Three data layers

1. **Synthetic demonstration records** — `src/model.js` generates 90 deterministic transactions across three delivery modes. These have no physical-source or commercial provenance and cannot be treated as actual sales or telemetry.
2. **Editable business assumptions** — acquisition and delivery prices, battery wear, dispatch logistics, operating allocations and site allocations. All are inputs to a model, not actual commercial agreements.
3. **Emissions scenarios** — separately adjustable grid intensity and solar share, genuine petrol displacement, km/travel efficiency and storage delivery efficiency. These do not run from the synthetic network dataset by default, because a guessed solar fraction must not be mistaken for verified source-attributable energy.

## Conversion to a measured pilot

Replace `makeDemoTransactions()` with a validated API adapter or signed metered CSV ingestion. The adapter should produce a typed record with at least:

```json
{
  "record_id": "pilot-energy-event-id",
  "recorded_at": "ISO-8601 timestamp with timezone",
  "site_id": "metered-hub-or-charger-id",
  "battery_module_id": "physical-BMS-serial-or-hashed-asset-id",
  "mode": "mobile|station|swaps",
  "solar_kwh": 0,
  "grid_kwh": 0,
  "input_kwh": 0,
  "delivered_kwh": 0,
  "loss_kwh": 0,
  "energy_source_evidence": "meter-id/invoice/contract reference",
  "battery_soc_start_pct": 0,
  "battery_soc_end_pct": 0,
  "battery_soh_pct": 0,
  "distance_km": 0,
  "driver_energy_l": 0,
  "peak_power_reduced_kw": 0,
  "reference_baseline_evidence": "site interval meter ref",
  "status": "measured",
  "signature_or_audit_event_id": "immutable record ref"
}
```

### Guardrails

- `solar_kwh + grid_kwh = input_kwh` and `delivered_kwh + losses = input_kwh` after accounting for stock carried forward, auxiliary use and measurement tolerances. Do not treat in-truck inventory transfers as fresh generation.
- Each physically traceable battery's source and state of charge must be auditable. Source claims should be proportional to measured energy and transfer losses; never double-count one kWh across modes.
- Existing prosumer net-metering bill credits are not a tradable energy asset in this system. Physical charging at a prosumer site requires a lawful agreement, approved electrical interface, meter evidence, custody and appropriate permissions.
- Every sale needs customer tariff, billed kWh, payment status, GST/taxes as applicable, route length and charger utilisation to calculate actual contribution.
- To estimate avoided emissions, maintain an auditable **counterfactual** showing how many petrol kilometres were genuinely displaced. Customers already using EVs should not automatically be credited.
- Peak site kW reduced requires a real counterfactual load profile, not merely maximum BESS output.
- For hospital, transformer and distribution-support cases, do not connect to live network assets without required safety designs and operator approval.
- A full lifecycle assessment also considers battery manufacture, energy-source opportunity costs, transportation, disposal and replacements.

## Deployment strategy

This is intentionally a no-build, static site. GitHub Pages can publish it from the default branch. For a future production deployment, add authentication and a separate metering API; do not put API tokens or customer PII into a public static repository.
