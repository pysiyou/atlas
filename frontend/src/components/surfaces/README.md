# Surfaces — Panel

`Panel` is a closed section shell. Layout chrome (variant, scroll, spacing, shell roles) lives in [`panelPresets/layoutPresets.ts`](./panelPresets/layoutPresets.ts). Call sites pass a **layout-intent** `preset` plus `title` / `meta` / slots.

## Call-site API

```tsx
<Panel
  preset="panel.page.visible"
  title="General Info"
  meta={count}
  headerEnd={actions}
  footer={notes}
>
  {children}
</Panel>
```

Do not pass `variant`, `scroll`, `spacing`, `hideHeader`, `className`, or `bodyClassName`.

## When to add a preset

Add an entry in `layoutPresets.ts` when a **new layout role** is needed (e.g. another `panel.pageEmbed.*` combination). Section copy always comes from `title` / `meta` at the call site, not from the preset id.

Use a **feature wrapper** (`EventLogPanel`, `LabAttentionPanel`, `ResultValidationPanel`) when the panel needs data fetching or computed `meta`. Wrappers still render `<Panel preset="panel.*" title="…" />`.

## Layout roles

Breakpoint-specific geometry is a **different preset** (`*.shrink`, `*.fill`, `*.span2`), not extra classes at the call site.
