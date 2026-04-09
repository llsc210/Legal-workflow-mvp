# Legal Workflow Automation MVP

Phase 1 implementation using plain HTML/CSS/JavaScript + LocalStorage.

## GitHub Pages compatibility

This app is intentionally build-free. GitHub Pages should serve it directly from the repository branch because:

- `index.html` references `src/styles.css` and `src/app.js` using relative static paths
- app code runs as a plain deferred script (no bundler, no transpile step)
- routing is hash-based (`#/...`), so deep links do not require server-side rewrite rules

## Implemented in Phase 1

- Matter list page (`#/matters`)
- Matter detail page (`#/matters/:id`)
- Create matter form (`#/matters/new`)
- Edit matter form (`#/matters/:id/edit`)
- Matter fields:
  - court
  - county
  - judge
  - status
  - important dates (important date, follow-up due date, order expected date, order signed date)
- Overdue follow-up logic:
  - flagged when `followUpDueDate` is before today and status is not `closed`
- Delayed order logic:
  - flagged when `orderExpectedDate` is before today, no `orderSignedDate`, and status is `open` or `order pending`

## Run locally

```bash
python3 -m http.server 4173
```

Then open: `http://localhost:4173`.
