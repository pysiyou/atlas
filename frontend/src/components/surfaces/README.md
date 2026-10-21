# Surfaces — Panel

`Panel` is a closed section shell. Titles, variant, scroll, spacing, and layout roles live in [`panelPresets`](./panelPresets/index.ts). Call sites pass a `preset` plus optional slots.

## Call-site API

```tsx
<Panel
  preset="patient.detail.generalInfo"
  meta={count}           // dynamic only
  headerEnd={actions}    // buttons, segment tabs
  footer={notes}         // pinned chrome
>
  {children}
</Panel>
```

Do not pass `title`, `variant`, `scroll`, `spacing`, `hideHeader`, `className`, or `bodyClassName`.

## When to add a preset

Add a namespaced id in the matching domain file (`patient.ts`, `orders.ts`, `compactPanels.ts`, `shared.ts`) when a section has a stable title or chrome recipe.

Use a **feature wrapper** (`EventLogPanel`, `LabAttentionPanel`, `ResultValidationPanel`) when the panel needs data fetching or computed `meta`. Wrappers still render `<Panel preset="…" />`.

## Layout roles

Breakpoint-specific geometry is a **different preset** of the same title (`*.stack`, `*.fill`, `*.span2`), not extra classes at the call site.
