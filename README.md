# Bijli Haazir · Energy Contribution Dashboard

An interactive, **public GitHub Pages–ready** dashboard developed for Bijli Haazir's 2026 LUMS CleanTech Hackathon demonstration. It displays synthetic energy flows, source contributions, delivery modes, variable operational economics and *illustrative* avoided-CO₂ scenarios.

> **NON-NEGOTIABLE DATA NOTICE:** All transactions, site uptime, energy shares, peak kW and financial results are fabricated for demonstration. The project is **pre-pilot**. Climate estimates are assumptions-based operational illustrations, **not** observed avoided emissions, certified carbon credits, an approved utility tariff, or an LCA. No real consumer, supplier, charging-station or investor records are included.

## Features

- **Energy overview:** source-tagged solar/grid purchases, stored-input losses, delivered kWh, energy-weighted uptime, hypothetical BESS peak buffer, rider swaps, 30-day history and ledger.
- **Commercial contribution:** change acquired-energy costs, delivery tariffs, battery wear, logistics and site cost assumptions. Contribution is **not** after-capex or post-tax profit.
- **Climate scenarios:** choose verified solar fraction, genuine petrol-displacement fraction and car km; inspect baseline, grid charging emissions and net operational effect. Includes separately labelled illustrative two-wheeler cohort.
- **Pilot readiness:** six KPIs and a 90-day staged engineering plan.
- **Exports:** CSV synthetic ledger and JSON scenario report; deterministic code for reproducible demonstration.
- Fully static site, responsive design, no tracking scripts, no account required, no backend and **no third-party JavaScript/CDN**.

## Run locally

Open `index.html` from a local HTTP server (ES modules do not reliably work from `file://`):

```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

Or `npm run serve`. To run data-integrity checks: `npm test`.

## Publish publicly to GitHub Pages

The archive includes a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) which runs all seven tests before deploying the site. The new repository should be public, separate from Solar Trade Hub projects.

**Fastest option on Windows (PowerShell):**

1. Install [Git](https://git-scm.com/) and the [GitHub CLI](https://cli.github.com/); run `gh auth login` with an account that can create repositories.
2. Extract the ZIP and open PowerShell in the `bijli-haazir-impact-dashboard` directory.
3. Run `./publish-to-github.ps1`. The script creates a **new public** `zorays/bijli-haazir-energy-dashboard` repository, commits the source and pushes `main`. It refuses to overwrite an existing repository.
4. In GitHub, open **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Wait for **Actions → Validate and deploy Bijli Haazir dashboard** to succeed. Live URL: `https://zorays.github.io/bijli-haazir-energy-dashboard/`.

**macOS/Linux:** use `./publish-to-github.sh` after `gh auth login`.

**Manual option:** create a new public repository at https://github.com/new, upload the contents of this project to its root, then select **GitHub Actions** as the Pages source. The workflow will test and deploy on pushes to `main`.

Until the repository and GitHub Pages are enabled, the URL above is **proposed**, not a confirmed live website.

## What is synthetic / modelled?

| Input or result | Status |
|---|---|
| 90 transactions across 30 days (three modes × one record per day) | Fully synthetic, deterministic |
| Solar/grid kWh and losses; uptime; peak buffer kW and swaps | Fully synthetic |
| PKR per kWh prices and costs | Editable example assumptions |
| Net contribution / delivered kWh | Modelled variable contribution; not audited net profit |
| EV avoided operational CO₂ | Scenario dependent, not measured, not full life-cycle |
| Environmental emission factor | Illustrative 0.365 kg CO₂/kWh grid (brief says exact source needs verification) |
| Gasoline emissions factor | Illustrative 2.31 kg CO₂/L tailpipe |
| EV efficiency / storage | Cars 0.15 kWh/km, motorcycles 0.045 kWh/km, 85% delivery efficiency |
| Petrol displacement | Explicit user-adjustable fraction; zero for existing EV use |

The historical Bijli Haazir mobile concept and Pakistan patent *application* 481/2020 are **not** evidence that the integrated 2026 network is already deployed. Site safety, charger protocols, pack compatibility, NEECA requirements, energy sales permissions and logistics economics must be validated.

## Data model

The demonstration is generated in [`src/model.js`](src/model.js), tested by [`tests/model.test.js`](tests/model.test.js) and rendered in [`src/app.js`](src/app.js). A convenience [`data/demo-transactions.csv`](data/demo-transactions.csv) is provided. User-input cost and carbon assumptions stay in the browser and are not uploaded anywhere.

**Accounting checks**:
- Solar purchased + grid purchased ≈ total energy in.
- Delivered energy + modelled losses ≈ energy in.
- Contribution = sales − energy costs − wear − logistics − variable operations − site allocation.
- Baseline petrol emissions − modelled grid charging emissions = scenario avoided operational emissions.
- Financial contribution does not imply full profitability; avoided emissions do not imply guaranteed environmental benefit.

## Relevant publicly available context

- [Bijli Haazir project history](https://zorays.com/bijli-haazir/)
- [LUMS Centre for Entrepreneurship CleanTech Hackathon](https://lce.lums.edu.pk/cleantech-hackathon-2026/)
- [Pakistan IPO Patent Journal](https://ipo.gov.pk/system/files?file=200917.pdf): application 481/2020, not necessarily granted
- [NEECA charging and battery-swapping regulation](https://neeca.pk/neecagov/regulations/EVCI_n_BSS_Regulations.pdf)

## Credits

Concept: Bijli Haazir / Zorays Solar Pakistan. Presentation branding reused from the user-supplied Bijli Haazir pitch illustration. Demo application code and synthetic dataset prepared for presenting a hypothetical one-node pilot. MIT licensed.
