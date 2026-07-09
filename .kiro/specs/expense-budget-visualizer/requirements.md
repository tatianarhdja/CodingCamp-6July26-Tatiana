# Requirements Document

## Introduction

Ledger is a client-side expense and budget visualizer built with vanilla HTML, CSS, and JavaScript. It allows users to record spending transactions, visualize category breakdowns, manage custom categories, flag over-limit spending, sort their history, see a monthly spending summary, and switch between dark and light display modes. All data is stored in the browser's LocalStorage — no backend or build step is required.

This document covers the full feature set: core functionality already implemented plus the two remaining optional challenges to build — monthly summary view and dark/light mode toggle.

---

## Glossary

- **App**: The Ledger single-page web application.
- **Transaction**: A single expense entry comprising a name, a positive dollar amount, a category, and a timestamp.
- **Category**: A label attached to a Transaction. Default categories are Food, Transport, and Fun. Users may add custom categories.
- **Balance**: The running total of all Transaction amounts currently stored.
- **Limit**: An optional, user-defined dollar threshold above which a Transaction is considered over-limit.
- **LocalStorage**: The browser's Web Storage API used to persist all app data on the client device.
- **MonthlySummary**: An aggregated view of Transactions grouped by calendar month, showing total spend and a per-category breakdown.
- **Theme**: The active color scheme of the App — either dark (default) or light.
- **ThemeToggle**: The UI control that switches between dark and light Theme.
- **Chart**: The pie chart rendered by Chart.js that shows spending proportions by Category.
- **Legend**: The labelled color key displayed below the Chart.
- **SortMode**: The active ordering rule applied to the Transaction list (newest, amount descending, amount ascending, or category).
- **Validator**: The client-side form validation logic that checks Transaction input before submission.
- **Renderer**: The module responsible for updating all DOM output in response to state changes.
- **Storage**: The module responsible for reading and writing all App state to LocalStorage.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to add an expense transaction with a name, amount, and category, so that I can track where my money is going.

#### Acceptance Criteria

1. THE App SHALL present an input form containing a text field for item name (maximum 100 characters), a numeric field for amount, and a category selector.
2. WHEN the form is submitted with a non-empty item name, a positive numeric amount no greater than 999,999,999.99, and a selected category, THE Storage SHALL create and persist a new Transaction.
3. IF the item name field is empty on form submission, THEN THE Validator SHALL display an inline error message and apply a red border to the item name field.
4. IF the item name exceeds 100 characters on form submission, THEN THE Validator SHALL display an inline error message indicating the character limit and apply a red border to the item name field.
5. IF the amount field is empty, non-numeric, or not greater than zero on form submission, THEN THE Validator SHALL display an inline error message and apply a red border to the amount field.
6. IF the amount field value exceeds 999,999,999.99 on form submission, THEN THE Validator SHALL display an inline error message and apply a red border to the amount field.
7. IF no category is selected on form submission, THEN THE Validator SHALL display an inline error message.
8. WHEN a Transaction is successfully added, THE App SHALL reset the form fields: item name and amount to empty, and category selector to the first available option.
9. WHEN a Transaction is successfully added, THE Renderer SHALL update the Balance display, the Transaction list, and the Chart without requiring a page reload. Each UI element MAY update independently; it is acceptable for some elements to update while others do not if an error occurs during a partial update.
10. THE Storage SHALL assign each Transaction a unique identifier at the time of creation.
11. THE Storage SHALL record the creation timestamp of each Transaction in milliseconds since epoch.

---

### Requirement 2: Display the Running Balance

**User Story:** As a user, I want to see a continuously updated total of all my expenses, so that I always know my current spend at a glance.

#### Acceptance Criteria

1. THE Renderer SHALL display the sum of all Transaction amounts as the Balance in a receipt-style visual element. WHEN no Transactions exist, THE Renderer SHALL display "$0.00" as the Balance.
2. WHEN a Transaction is added or deleted, THE Renderer SHALL recalculate and update the Balance display within the same user interaction event.
3. WHEN the App is loaded, THE App SHALL display today's date alongside the Balance in a short human-readable format (e.g., Jul 6, 2026) using the user's local date.
4. THE Balance display SHALL format amounts using a dollar sign prefix and exactly two decimal places. IF the Balance is negative, THE Renderer SHALL display it with a leading minus sign (e.g., -$15.50).

---

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to remove a transaction I added by mistake, so that my records stay accurate.

#### Acceptance Criteria

1. THE App SHALL render a delete control for each Transaction in the Transaction list.
2. WHEN the delete control for a Transaction is activated, THE App SHALL remove that Transaction from storage and from the displayed list.
3. WHEN a Transaction is deleted, THE Renderer SHALL update the Balance to the sum of remaining Transaction amounts, and update the Chart to reflect only the remaining Transactions' categories. IF the deleted Transaction was the last one in its Category, THEN THE Renderer SHALL remove that Category's segment from the Chart and its entry from the Legend. The Chart and Legend MAY be updated independently based on their own conditions.
4. WHEN all Transactions are deleted, THE Renderer SHALL display the empty-state message "No transactions yet — add your first one above." in the Transaction list area, and display the empty-state placeholder in the chart area. WHERE Transactions still exist, THE Renderer SHALL NOT display any empty-state message.

---

### Requirement 4: Visualize Spending by Category

**User Story:** As a user, I want to see a chart of my spending broken down by category, so that I can understand my spending patterns at a glance.

#### Acceptance Criteria

1. THE Renderer SHALL render a pie Chart using Chart.js that represents the proportion of total spend per Category.
2. WHEN Transactions exist, THE Renderer SHALL assign each Category a color from PALETTE (for default categories) or EXTRA_PALETTE (for custom categories, cycling through the palette by index) and use that same color consistently in both the Chart segment and the Legend entry for that Category.
3. WHEN no Transactions exist, THE Renderer SHALL hide the Chart canvas and display an empty-state message in the chart area.
4. WHEN a Transaction is added or deleted and at least one Transaction remains, THE Renderer SHALL update the Chart data and Legend in place without destroying and recreating the Chart instance. The Chart SHALL be updated whenever Transactions exist in the system, not only in response to the most recent modification event.
5. IF all Transactions are deleted, THEN THE Renderer SHALL destroy the Chart instance and display the empty-state message.
6. THE Legend SHALL display each Category name alongside its color swatch and its total spend formatted as a dollar sign prefix with two decimal places.

---

### Requirement 5: Manage Custom Categories

**User Story:** As a user, I want to create my own spending categories beyond the defaults, so that I can label transactions in a way that fits my life.

#### Acceptance Criteria

1. THE App SHALL provide default categories of Food, Transport, and Fun in the category selector.
2. WHEN the user selects the "+ New category…" option or activates the "Add custom category" control, THE App SHALL reveal an input field for entering a new category name.
3. WHEN a non-empty custom category name (up to 50 characters) is submitted, THE App SHALL add that category to the category selector if no existing category matches it case-insensitively, and hide the custom category input field after the successful add.
4. IF the custom category name field is empty when the form is submitted with "add new" selected, THEN THE Validator SHALL display an error prompting the user to name the new category.
5. IF the custom category name exceeds 50 characters, THEN THE Validator SHALL display an error indicating the maximum length.
6. THE Storage SHALL persist custom categories across browser sessions using LocalStorage.
7. WHEN the App is loaded, THE App SHALL restore all previously saved custom categories into the category selector.
8. WHEN a custom category is added, THE Renderer SHALL assign it a color from the EXTRA_PALETTE by its zero-based index among all custom categories, cycling from the beginning of the palette if the index exceeds the palette length.

---

### Requirement 6: Sort Transactions

**User Story:** As a user, I want to sort my transaction list in different orders, so that I can quickly find transactions relevant to my current task.

#### Acceptance Criteria

1. THE App SHALL provide a sort selector with the following modes: newest first (default on initial load), amount high to low, amount low to high, and category alphabetical.
2. WHEN the user changes the SortMode, THE Renderer SHALL re-render the Transaction list in the selected order within 200ms and without requiring additional user input.
3. WHILE the "newest first" SortMode is active, THE Renderer SHALL order Transactions by their creation timestamp in descending order.
4. WHILE the "amount high to low" SortMode is active, THE Renderer SHALL order Transactions by amount in descending order; WHEN two Transactions have equal amounts, THE Renderer SHALL order them by creation timestamp in descending order as a tiebreaker.
5. WHILE the "amount low to high" SortMode is active, THE Renderer SHALL order Transactions by amount in ascending order; WHEN two Transactions have equal amounts, THE Renderer SHALL order them by creation timestamp in descending order as a tiebreaker.
6. WHILE the "category" SortMode is active, THE Renderer SHALL order Transactions alphabetically by category name using locale-aware string comparison; WHEN two Transactions share the same category, THE Renderer SHALL order them by creation timestamp in descending order as a tiebreaker.

---

### Requirement 7: Flag Over-Limit Transactions

**User Story:** As a user, I want to flag transactions that exceed a spending threshold I set, so that I can quickly spot where I've overspent.

#### Acceptance Criteria

1. THE App SHALL provide a numeric input field where the user can enter a Limit value.
2. WHEN the Limit input value changes, THE Renderer SHALL re-render the Transaction list to apply or remove over-limit highlighting within the same user interaction event.
3. WHILE a Limit is set (including a Limit of zero), THE Renderer SHALL apply a red left border and an "OVER LIMIT" label to every Transaction whose amount is strictly greater than the Limit.
4. WHEN the Limit field is cleared, THE Renderer SHALL remove all over-limit visual indicators from the Transaction list.
5. WHEN the App is loaded and a Limit is stored in LocalStorage, THE App SHALL populate the Limit input field with the stored value and re-apply over-limit highlighting to all Transactions that exceed it.
6. IF the Limit input value is negative or non-numeric, THEN THE App SHALL treat the Limit as unset and remove all over-limit highlighting immediately, without waiting for valid input to be provided.

---

### Requirement 8: Persist Data Across Sessions

**User Story:** As a user, I want my transactions, categories, and settings to be saved automatically, so that my data is still there when I come back to the app.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE Storage SHALL write the updated Transaction array to LocalStorage under the key `ledger.transactions`.
2. WHEN a Transaction is deleted, THE Storage SHALL write the updated Transaction array to LocalStorage under the key `ledger.transactions`.
3. WHEN a custom category is added, THE Storage SHALL write the updated custom categories array to LocalStorage under the key `ledger.categories`.
4. WHEN the Limit is changed, THE Storage SHALL write the Limit value to LocalStorage under the key `ledger.limit`.
5. WHEN the App is loaded, THE Storage SHALL read Transactions, custom categories, and the Limit from LocalStorage and restore them so that all stored values are reflected on the first render.
6. IF a LocalStorage read fails due to a JSON parse error, THEN THE Storage SHALL fall back to an empty default state: an empty Transaction array, default categories only (Food, Transport, Fun), and no Limit set.
7. WHEN the App is loaded and a LocalStorage key is absent (first launch), THE Storage SHALL immediately use the empty default state as defined in criterion 6 without attempting restoration.

---

### Requirement 9: Monthly Summary View

**User Story:** As a user, I want to see my spending grouped and totalled by month, so that I can track how my habits change over time and identify high-spend months.

#### Acceptance Criteria

1. THE App SHALL provide a dedicated monthly summary section or panel that displays spending data grouped by calendar month.
2. WHEN the monthly summary is displayed, THE Renderer SHALL group Transactions by their calendar month and year and render one summary row per month, with month labels formatted as "MMM YYYY" (e.g., "Jul 2026").
3. WHEN the monthly summary is displayed, THE Renderer SHALL show the total spend for each month formatted with a dollar sign prefix and two decimal places.
4. WHEN the monthly summary is displayed, THE Renderer SHALL show a per-category breakdown for each month, displaying each Category name and its total spend formatted with a dollar sign prefix and two decimal places.
5. WHEN no Transactions exist, THE Renderer SHALL display an empty-state message in the monthly summary section.
6. WHEN a Transaction is added or deleted, THE Renderer SHALL update the monthly summary to reflect the change without a page reload. IF both an add and a delete operation occur together, page reloads are permitted as long as the summary is updated to reflect the final state.
7. THE Renderer SHALL sort monthly summary rows in reverse chronological order (most recent month first).

---

### Requirement 10: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light display modes, so that I can choose the appearance that is most comfortable for my environment.

#### Acceptance Criteria

1. THE App SHALL provide a ThemeToggle control that is persistently visible in the app interface.
2. WHEN the ThemeToggle is activated, THE App SHALL switch the Theme from dark to light or from light to dark.
3. WHILE the light Theme is active, THE App SHALL apply a light color palette (inverted from the dark CSS custom properties: light backgrounds, dark text) to all interface elements, maintaining a minimum contrast ratio of 4.5:1 (WCAG AA) for all text and data visualization labels.
4. WHILE the dark Theme is active, THE App SHALL apply the default dark color palette defined in the CSS custom properties.
5. THE Storage SHALL persist the user's Theme preference in LocalStorage under the key `ledger.theme`.
6. WHEN the App is loaded, THE Storage SHALL read the saved Theme preference and THE App SHALL apply the corresponding CSS class or attribute to the document root before first render.
7. WHEN the App is loaded and the Theme is applied before first render, THE App SHALL not display a flash of the incorrect theme.
8. IF no Theme preference is saved in LocalStorage, THEN THE App SHALL apply the dark Theme as the default.
9. WHEN the Theme changes, THE Renderer SHALL update the Chart's dataset border color to match the active surface background color so that chart segment separators remain visually correct in both themes.
