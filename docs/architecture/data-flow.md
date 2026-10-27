# Frontend–backend data flow

How Atlas moves data from API to list pages, detail modals, and lab queues. Complements [list-page platform](../../frontend/src/hooks/listPage/README.md).

## Layers

1. **UI** — `*Page.tsx` → `usePageFilters` + `useServerListChrome` / `useClientListChrome` → `ListView` → `*Table.config.tsx` → `entityPresentation.tsx`
2. **Data** — feature `*/api/*.ts` (HTTP + React Query) → `apiClient` (`/api/v1`, JWT refresh)
3. **Backend** — FastAPI domain routers → services → Pydantic DTOs (often denormalized list rows)

## List pages (server-paginated)

| Feature | Hook | Endpoint | Row shape |
|---------|------|----------|-----------|
| Orders | `usePaginatedOrders` | `GET /orders?paginated=true&summary=true` | `OrderSummaryResponse` (+ optional embeds) |
| Patients | `usePaginatedPatientContextList` | `GET /patients?paginated=true&include=orderSummary` | `PatientResponse` + `orderSummary` |
| Payments | `usePaginatedPaymentOrders` | `GET /orders?...&include=latestPayment` | Order summary + `latestPayment` |
| Reports | `usePaginatedReportableOrders` | `GET /reports/orders` | `ReportableOrderItem` (includes `testNames`) |
| Lab queues | `use*Worklist` | `GET /lab/worklists/{stage}` | Worklist items + `allowedActions` |

Shared wiring: filters → `serverFilters` `useMemo` → paginated query → `useServerListChrome` → `ListView`.

Pagination query params are built with `buildPaginatedQueryParams` in `frontend/src/lib/api/pagination.ts` (`page` / `pageSize` → `skip` / `limit` where the API expects skip/limit).

## Embed pattern (preferred)

Avoid client-side joins when the screen needs related data for **the same rows**:

- **Patients + order stats:** `include=orderSummary` on `GET /patients`
- **Payments + payment row:** `include=latestPayment` on `GET /orders` (payment list page)
- **Reports:** dedicated read model with `testNames` on the list DTO

Detail views use `include` on a single resource (e.g. `GET /orders/{id}?include=patient,invoices`).

## Reference data

| Data | Endpoint | React Query tier |
|------|----------|------------------|
| Test catalog | `GET /tests` | `static`, persisted |
| User labels | `GET /users/lookup` | `static`, persisted |

List tables may use `testNames` from order summary when present; the catalog is still required for order editing and code-only fallbacks.

## Cache invalidation

See `frontend/src/lib/query/invalidate.ts`. Mutations invalidate the smallest practical key prefixes (`orders.lists`, `orders.paginated`, `byId`, worklists, etc.) rather than always wiping entire domains.

## Types

OpenAPI-generated types live in `frontend/src/lib/api/types/generated/`. Feature APIs should alias response DTOs from `components['schemas'][...]` where possible; Zod remains for mutation payloads.

## Codegen

- Shared contracts: `contracts/` → `npm run codegen` (root scripts)
- OpenAPI TS types: `npm run codegen:api` in `frontend/` (validated in CI)
