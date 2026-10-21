# Surfaces — Panel

`Panel` is a closed section shell. Layout chrome lives in [`src/config/panelLayouts.ts`](../../config/panelLayouts.ts). Call sites pass a **layout-intent** `preset` plus `title` / `meta` / slots.

```tsx
<Panel preset="panel.page.visible" title="General Info" meta={count} headerEnd={actions} footer={notes}>
  {children}
</Panel>
```

Do not pass `variant`, `scroll`, `spacing`, `hideHeader`, `className`, or `bodyClassName` at the call site.
