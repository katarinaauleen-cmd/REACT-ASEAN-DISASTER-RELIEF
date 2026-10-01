# REACT — Relief & Emergency Allocation Coordination Technology

AI-assisted ASEAN disaster-relief decision-support prototype for the BINUS CONNECT Challenge 2026.

## What this prototype demonstrates

- ASEAN country carousel with a PowerPoint-Morph-inspired transition.
- Reliable country highlighting using ISO/M49 numeric map IDs, including Singapore.
- REACT command center.
- Dynamic priority queue that recalculates when aid is allocated or a new field report is simulated.
- Explainable prototype scoring factors: human impact, unmet needs, urgency, vulnerability and accessibility.
- Situational map with representative incident markers.
- Illustrative relief inventory and workforce capacity.
- AI recommendation panel and confidence indicator.
- Human-in-the-loop governance: AI recommends; authorized responders decide.
- Data-fabric panel showing intended integration with AHA Centre/ADINet, national agencies, GIS/population data and verified field reports.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL, normally `http://localhost:5173/`.

## Production direction

The current numbers and incident locations are demonstration data. They should not be presented as live government data. A production version would connect verified APIs/data feeds, a persistent database, model validation, resource-inventory inputs and a constrained optimization engine.

## Suggested deployment

This Vite project can be uploaded to GitHub and imported into Vercel. Do not upload `node_modules/`; Vercel installs dependencies from `package.json`.
