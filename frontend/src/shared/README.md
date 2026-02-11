# shared/

App-wide shared code. No barrel; import from `@/shared/<subpath>` (e.g. `@/shared/constants`, `@/shared/ui`).

- **constants** – App-wide constants (empty state copy, typography, UI limits, validation rules).
- **types** – Enums only (single source in `types/enums.ts`). Domain types live in `src/types`.
- **ui** – Design system (Badge, Button, Table, modals, etc.).
- **utils** – Canonical date/currency/array formatters and form initializer; app-level facade is `src/utils`.
