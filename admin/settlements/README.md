# Admin Settlements

On or after you receive the AdSense payout for the previous month, create a file here named `YYYY-MM.json` with:

```
{
  "received_revenue_usd": 0
}
```

Example (for December 2025):
```
admin/settlements/2025-12.json
```

Then the GitHub Action on the 1st will compute ledger for that tag and write to `payouts/YYYY-MM/`.
