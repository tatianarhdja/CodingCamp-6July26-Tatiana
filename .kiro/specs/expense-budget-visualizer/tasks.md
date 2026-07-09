# Implementation Plan: Ledger — Monthly Summary View & Dark/Light Mode Toggle

## Overview

Implement the two remaining features of the Ledger app inside the existing vanilla-JS IIFE architecture. No new files, dependencies, or build steps are required. All changes touch three files: `index.html`, `css/style.css`, and `js/script.js`.

Tasks are ordered so that each step builds on the previous one and the app remains functional throughout. Requirements 9 (Monthly Summary View) and 10 (Dark/Light Mode Toggle) are treated as parallel tracks that converge in the final wiring step.

## Tasks

- [ ] 1. Add flash-prevention inline script and monthly summary HTML to `index.html`
  - Insert the inline `<script>` block as the **first child of `<head>`** (before any `<link>` tags) that reads `ledger.theme` from `localStorage` and sets `data-theme="light"` on `<html>` when appropriate
  - Wrap the existing `.app-header` content in a `.header-row` div and add the `<button class="theme-toggle" id="themeToggle">` element with correct `aria-label`, icon span, and label span
  - Add the `<section class="summary-section">` block with `id="summaryList"` and `id="summaryEmpty"` after `<main class="grid">` and before `<footer>`
  - _Requirements: 9.1, 10.1, 10.7_

- [ ] 2. Add CSS for light-theme token overrides, ThemeToggle button, and Monthly Summary section
  - [ ] 2.1 Add light theme token overrides to `css/style.css`
    - Add `html[data-theme="light"]` rule that overrides `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, and `--text-muted` with the WCAG AA-compliant light palette values from the design
    - Add `html[data-theme="light"] body` rule with the light variant of the radial-gradient background image
    - Add `html { color-scheme: dark; }` and `html[data-theme="light"] { color-scheme: light; }` rules
    - Add `body { transition: background-color 0.2s ease, color 0.2s ease; }` for smooth theme switch (existing `prefers-reduced-motion` block already suppresses this)
    - _Requirements: 10.3, 10.4_

  - [ ] 2.2 Add `.header-row` and `.theme-toggle` styles to `css/style.css`
    - Add `.header-row` flexbox rule (`justify-content: space-between`, `align-items: flex-start`, `gap: 12px`)
    - Add `.theme-toggle` pill-button styles (background, border, border-radius, padding, color, font, cursor, transition) using existing CSS tokens so the button adapts automatically to both themes
    - Add `.theme-toggle:hover` and `.theme-toggle:focus-visible` rules
    - Add `.theme-toggle-icon` font-size rule
    - _Requirements: 10.1, 10.3_

  - [ ] 2.3 Add Monthly Summary section styles to `css/style.css`
    - Add `.summary-section`, `.summary-list`, `.summary-month-card`, `.summary-month-header`, `.summary-month-label`, `.summary-month-total`, `.summary-cat-list`, `.summary-cat-row`, `.summary-cat-name`, and `.summary-cat-amount` rules exactly as specified in the design
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 3. Implement Monthly Summary logic in `js/script.js`
  - [ ] 3.1 Add `buildMonthlyGroups(txList)` helper function
    - Implement the grouping logic: iterate `txList`, derive a `YYYY-MM` key from `new Date(t.createdAt)`, accumulate `total` and per-category subtotals in a map, then return `Object.values(map)` sorted descending by key using `localeCompare`
    - Place the function in the helper/utility section of the IIFE (after `escapeHtml` / `formatMoney`)
    - _Requirements: 9.2, 9.3, 9.4, 9.7_

  - [ ]* 3.2 Write property test for `buildMonthlyGroups` — group totals are exact sums (Property 1)
    - **Property 1: Monthly Group Totals Are Exact Sums**
    - **Validates: Requirements 9.2, 9.3**
    - Use fast-check; generate random arrays of transaction-shaped objects; assert that each group's `total` equals the filtered sum of transaction amounts for that `YYYY-MM` key

  - [ ]* 3.3 Write property test for `buildMonthlyGroups` — category subtotals sum to group total (Property 2)
    - **Property 2: Monthly Group Category Subtotals Sum to Group Total**
    - **Validates: Requirements 9.4**
    - For each group in the result, assert `group.total === Object.values(group.categories).reduce((s, v) => s + v, 0)`

  - [ ]* 3.4 Write property test for `buildMonthlyGroups` — no double-counting (Property 3)
    - **Property 3: Every Transaction Belongs to Exactly One Group**
    - **Validates: Requirements 9.2, 9.3**
    - Assert that `groups.reduce((s, g) => s + g.total, 0) === txList.reduce((s, t) => s + t.amount, 0)`

  - [ ]* 3.5 Write property test for `buildMonthlyGroups` — sort order is descending (Property 4)
    - **Property 4: Groups Are Sorted Descending by Month Key**
    - **Validates: Requirements 9.7**
    - Assert that for all consecutive group pairs, `groups[i].key >= groups[i+1].key`

  - [ ]* 3.6 Write property test for `buildMonthlyGroups` — no empty groups (Property 5)
    - **Property 5: No Empty Groups**
    - **Validates: Requirements 9.2, 9.5**
    - Assert that every group has `total > 0` and `Object.keys(group.categories).length > 0`

  - [ ]* 3.7 Write property test for `buildMonthlyGroups` — group count equals distinct month count (Property 6)
    - **Property 6: Group Count Equals Distinct Month Count**
    - **Validates: Requirements 9.2**
    - Assert `buildMonthlyGroups(txList).length === new Set(txList.map(t => monthKey(t.createdAt))).size`

  - [ ]* 3.8 Write property test for `buildMonthlyGroups` — no zero-amount category entries (Property 11)
    - **Property 11: No Category Entry Has Zero Amount**
    - **Validates: Requirements 9.4**
    - Assert that for every group, every `Object.values(group.categories)` entry is strictly greater than zero

  - [ ] 3.9 Add `summaryListEl` and `summaryEmptyEl` DOM refs and implement `renderMonthlySummary()`
    - Add `const summaryListEl = document.getElementById('summaryList')` and `const summaryEmptyEl = document.getElementById('summaryEmpty')` to the DOM refs block
    - Implement `renderMonthlySummary()`: clear `summaryListEl`, show empty state when `transactions.length === 0`, otherwise call `buildMonthlyGroups(transactions)` and render one `.summary-month-card` per group with header (label + total) and a `<ul class="summary-cat-list">` of category rows sorted by amount descending
    - Use `colorFor(cat)`, `escapeHtml()`, and `formatMoney()` — all already available in scope
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [ ] 3.10 Wire `renderMonthlySummary()` into the `render()` orchestrator
    - Add `renderMonthlySummary();` as the last call inside the existing `render()` function
    - _Requirements: 9.6_

- [ ] 4. Checkpoint — verify Monthly Summary
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify: add transactions, confirm summary card appears; delete the last transaction in a month, confirm that month's card disappears; add transactions in two different months, confirm most-recent month appears first.

- [ ] 5. Implement Dark/Light Mode Toggle in `js/script.js`
  - [ ] 5.1 Add `THEME_KEY`, `theme` state variable, and `loadTheme()` / `saveTheme()` storage functions
    - Add `const THEME_KEY = 'ledger.theme';` alongside the other storage key constants
    - Add `let theme = loadTheme();` in the state block
    - Implement `loadTheme()` with try/catch: returns `'light'` when stored value is `'light'`, `'dark'` otherwise
    - Implement `saveTheme(value)` with try/catch: writes value to `localStorage` under `THEME_KEY`
    - _Requirements: 10.5, 10.6, 10.8_

  - [ ] 5.2 Add `themeToggleBtn` DOM ref and implement `updateChartBorderColor()` and `applyTheme()`
    - Add `const themeToggleBtn = document.getElementById('themeToggle');` to the DOM refs block
    - Implement `updateChartBorderColor()`: guard `if (!chart) return;`, set `chart.data.datasets[0].borderColor` to `'#FFFFFF'` (light) or `'#172230'` (dark) based on current `theme`, then call `chart.update()`
    - Implement `applyTheme(value)`: update `theme`, toggle `data-theme` attribute on `document.documentElement`, update `themeToggleBtn` `aria-label`, label text, and icon text; call `updateChartBorderColor()`
    - _Requirements: 10.2, 10.3, 10.4, 10.9_

  - [ ]* 5.3 Write property test for theme toggle — toggle is a strict involution (Property 7)
    - **Property 7: Theme Toggle Is a Strict Involution**
    - **Validates: Requirements 10.2**
    - Stub `document.documentElement` and `themeToggleBtn`; assert that applying a theme, toggling, then toggling back restores the original `data-theme` state

  - [ ]* 5.4 Write property test for theme persistence — saved theme equals loaded theme (Property 8)
    - **Property 8: Theme Persisted Equals Theme Applied on Load**
    - **Validates: Requirements 10.5, 10.6, 10.7**
    - Stub `localStorage`; for each value in `{ 'dark', 'light' }`, assert `loadTheme()` returns the value written by `saveTheme(value)`

  - [ ]* 5.5 Write property test for chart border color — matches active surface token (Property 9)
    - **Property 9: Chart Border Color Matches Active Surface Token**
    - **Validates: Requirements 10.9**
    - Stub the chart object; for each theme, call `applyTheme(theme)` and assert `chart.data.datasets[0].borderColor` equals the expected surface hex

  - [ ]* 5.6 Write property test for add/delete cycle — summary consistency (Property 10)
    - **Property 10: Add/Delete Cycle Leaves Summary Consistent**
    - **Validates: Requirements 9.6**
    - For any transaction list and a randomly chosen id to delete, assert that `buildMonthlyGroups(list.filter(t => t.id !== id))` deep-equals the result of running `buildMonthlyGroups` on the list after the delete operation

  - [ ] 5.7 Wire `applyTheme()` and ThemeToggle event listener into `init()`
    - At the start of `init()`, call `applyTheme(theme)` to synchronise button UI state with the theme already applied by the inline `<head>` script
    - Add `themeToggleBtn.addEventListener('click', ...)` that computes `next = theme === 'dark' ? 'light' : 'dark'`, calls `saveTheme(next)`, then calls `applyTheme(next)`
    - _Requirements: 10.2, 10.5, 10.6_

- [ ] 6. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify: toggle theme and refresh the page — stored theme is restored with no flash; toggle theme while chart is visible — chart segment borders update to match the new surface color; all existing features (add/delete transaction, sort, limit, chart, custom categories) continue to work in both themes.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Requirements 1–8 are already implemented; only Requirements 9 and 10 are in scope for these tasks
- The inline `<script>` in `<head>` (Task 1) **must** be the very first child of `<head>` — placing it after any `<link>` will cause a flash of the incorrect theme on cold load
- `buildMonthlyGroups` is a pure function and can be extracted into a small test harness without touching the IIFE
- Property tests use fast-check; a simple `<script type="module">` test file that imports fast-check from a CDN is sufficient — no build step needed
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1", "5.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "5.2"] },
    { "id": 3, "tasks": ["3.10", "5.3", "5.4", "5.5", "5.6", "5.7"] }
  ]
}
```
