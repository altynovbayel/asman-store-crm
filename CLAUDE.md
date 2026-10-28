# Asman Store CRM — Claude Code Project Guide

## 1. Project purpose

Asman Store CRM is a production CRM used in a real laptop/accessories store. Treat the project as a live business system with real operational data.

Primary goals:
- preserve data integrity;
- preserve historical sales accuracy;
- avoid regressions in sales, inventory, warranty, reports, and roles;
- prefer small, reviewable changes over broad rewrites;
- keep the existing architecture and UI conventions unless a task explicitly requires otherwise.

Do not treat this as a demo project. Changes can affect real sales and inventory.

---

## 2. Current stack

- React 19
- Vite
- JavaScript (ES modules)
- React Router
- SCSS Modules
- Firebase Authentication
- Cloud Firestore
- react-to-print
- lucide-react
- Vercel hosting

Commands:

```bash
npm install
npm run dev
npm run lint
npm run build
```

Every code task should finish with:

```bash
npm run lint
npm run build
```

Do not claim a task is complete if either command fails.

---

## 3. High-level architecture

Main structure:

```text
src/
  components/        reusable UI components
  constants/         business/UI constants
  hooks/             reusable React hooks
  layouts/           application layout/navigation
  pages/             route-level modules
  routes/            React Router configuration
  services/firebase/ Firestore access layer
  store/              React contexts
  utils/              pure helpers/business utilities
```

Important rule:

```text
Page / Component
      ↓
Hook / utility / business calculation
      ↓
Service
      ↓
Firestore
```

Do not put raw Firestore logic directly inside page components when an existing service can own it.

Avoid creating duplicate services or duplicate business calculations.

---

## 4. Authentication and roles

Roles are defined in:

```text
src/constants/roles.js
```

Current roles:

```js
admin
manager
```

User profiles are stored in:

```text
users/{uid}
```

Typical profile fields include:
- email
- role
- status
- display/name fields when present

Authentication is handled in:

```text
src/store/AuthContext.jsx
```

Route protection is handled by:

```text
src/components/ProtectedRoute/ProtectedRoute.jsx
```

Admin-only modules currently include:
- Reports
- Settings
- Audit Log
- Users

Do not implement security only by hiding UI. Firestore Rules must remain the real database-level protection.

Do not weaken Firestore rules for convenience.

---

## 5. Firestore collections

Important collections currently used by the CRM:

```text
products
sales
inventory_movements
counters
users
settings
auditLogs
```

Known settings document:

```text
settings/store
```

Never rename collections or document structures casually. Existing production data depends on them.

Before changing schema:
1. inspect every read/write location;
2. check backward compatibility;
3. prefer additive fields;
4. avoid migrations unless explicitly requested.

---

## 6. Product model

There are two main product types:
- laptop
- accessory

Product type constants live in:

```text
src/constants/productTypes.js
```

Laptop rules:
- each laptop is a unique physical unit;
- it has a unique barcode;
- it can be sold once;
- it is not physically deleted after a sale;
- status changes between AVAILABLE and SOLD where appropriate.

Accessory rules:
- accessories use quantity-based inventory;
- sales decrement quantity;
- sale deletion/return restores quantity.

Do not apply laptop-specific status logic to accessories.

Do not allow negative inventory.

---

## 7. Product display names

The canonical Firestore `name` field must NOT be rewritten to include hardware specs.

For display only, use:

```text
src/utils/getProductDisplayName.js
```

Laptop display format:

```text
Name | CPU / RAM / SSD
```

Example:

```text
MS 4 40/45 чер | Ryzen 5 / 16 / 256
```

The helper must gracefully omit missing specs.

Current intended usage includes:
- Sales product search
- Sales cart
- Warranty output

Do not mutate `product.name` just to improve display text.

---

## 8. Sales are the most sensitive module

Relevant files include:

```text
src/pages/Sales/
src/components/Cart/
src/components/ProductSearch/
src/components/SaleSummary/
src/services/firebase/sales.service.js
src/utils/saleCalculator.js
src/hooks/useCart.js
```

Any task touching Sales must be handled conservatively.

Before changing sale calculations, inspect:
- saleCalculator.js
- useCart.js
- Sales page/form state
- sales.service.js
- SaleDetailsModal
- SalesHistory
- Reports calculations
- Warranty data consumption

Do not rewrite sales logic from scratch unless explicitly requested.

---

## 9. Historical snapshots — critical rule

Sales must remain historically stable.

A sale should store the values required to reproduce what happened at the time of sale, including price/discount snapshots and relevant product data.

Historical data must NOT depend on the current product document after the sale.

This is critical for:
- profit calculations;
- reports;
- warranty output;
- sale history;
- auditing;
- later product price edits.

Do not make old sales recalculate from today's product price or today's product specs.

If new fields are added to sales, old sales without those fields must continue to render safely.

Use null-safe/backward-compatible fallbacks.

---

## 10. Sale price and profit principles

The system distinguishes current catalog/product prices from historical sale snapshots.

Reports must use historical sale data.

Profit logic conceptually follows:

```text
(actual sale amount after discounts - historical purchase cost)
```

For quantity-based items, multiply correctly by quantity.

Do not use the current product purchasePrice/sellingPrice to recalculate old sale profit.

Business calculations belong in utility/business calculation files, not duplicated inside render functions.

Reports utilities currently live under:

```text
src/pages/Reports/utils/reportCalculations.js
```

---

## 11. Payment methods and installment logic

Payment methods are defined in:

```text
src/constants/paymentMethods.js
```

Current methods include:
- cash
- bank_transfer
- pos_terminal
- m_plus
- zero

Current installment business rule for new sales:

- M+ → 3 months → 5% discount
- Zero → 3 months → 5% discount

The old 6/12-month options were removed from creation of new sales.

Important:
- installment discount applies only to laptops;
- it is calculated per laptop item;
- accessories do not receive installment discount;
- individual/manual discount remains supported;
- kit discount logic remains supported;
- old historical sales that contain 6 or 12 month terms must remain readable and correct.

Do NOT migrate or rewrite historical installment sales simply because new sales now allow only 3 months.

Relevant stored fields may include:

```text
paymentMethod
installmentTerm
installmentDiscount
installmentDiscountTotal
```

---

## 12. Kit / bundle logic

Sales support a `kitIncluded` concept.

Current business intent:
- when the kit checkbox is selected, the kit's amount is fully deducted;
- installment discount can still apply simultaneously;
- individual discount can still apply simultaneously.

Relevant fields may include:

```text
kitIncluded
kitDiscount
```

Preserve existing calculation order and tested behavior unless the task explicitly changes it.

Never silently change how multiple discounts combine.

---

## 13. Sale deletion / return behavior

Deleting/canceling a sale is not a simple document delete.

Existing behavior includes:
- restore laptop status to AVAILABLE;
- restore accessory quantities;
- delete the sale atomically where possible;
- create RETURN inventory movement records;
- preserve counter integrity.

Relevant implementation:

```text
src/services/firebase/sales.service.js
```

Do not replace sale deletion with a plain Firestore `deleteDoc()`.

Regression-test inventory restoration whenever sale deletion logic is touched.

---

## 14. Inventory movements

Inventory movements are a separate audit trail for stock changes.

Relevant files:

```text
src/services/firebase/inventory.service.js
src/pages/InventoryMovements/
src/constants/movementTypes.js
```

Sales create OUT movements.
Sale cancellation creates RETURN movements.

Keep inventory movement numbering/order behavior intact.

Do not silently skip movement creation after stock changes.

---

## 15. Warranty

Warranty is generated from sale data. There is no separate warranties collection.

Warranty number follows the sale number.

Relevant files:

```text
src/pages/Warranty/
src/pages/Warranty/utils/warrantyGenerator.js
```

Store identity/warranty settings should come from:

```text
settings/store
```

Avoid hardcoding store name, phone, address, warranty months, or warranty terms if the setting exists.

Warranty should use historical sale item data when available, including CPU/RAM/SSD for the display name.

Do not fetch current product specs for an old sale if that could alter historical output.

Printing uses react-to-print. Preserve print layout when modifying warranty UI.

---

## 16. Reports

Reports are admin-only.

Relevant files:

```text
src/pages/Reports/Reports.jsx
src/pages/Reports/services/reports.service.js
src/pages/Reports/utils/reportCalculations.js
```

Architecture rule:
- report service fetches data;
- report calculations stay in calculation utilities;
- components should not duplicate financial logic.

Core KPIs:
- Revenue
- Profit
- Sales Count
- Average Check

Reports must use historical sale snapshots.

### Planned work

Add downloadable reports.

Preferred first formats:
- XLSX
- PDF

Export must respect currently selected report filters/date range.

Do not add export logic until existing report calculations and filters are understood and reused.

---

## 17. Dashboard

Dashboard exists but still needs product work.

Planned goal:
Make it a useful operational overview, not a decorative page.

Likely useful metrics:
- today's revenue;
- today's profit;
- today's sales count;
- average check;
- available laptop/product count;
- inventory valuation if supported by reliable data;
- recent sales if appropriate.

Critical requirement:
Dashboard metrics must reuse the same business definitions as Reports so the two pages never show contradictory numbers.

Do not create a second independent profit formula in Dashboard.

---

## 18. Users page

Users route already exists and is admin-only, but this area still needs completion.

Desired behavior:
- list users;
- display name/email/role/status;
- create/manage manager accounts if the architecture supports this safely;
- change role where appropriate;
- active/blocked state;
- prefer deactivation/blocking over destructive deletion.

Reason:
historical sales and audit records may reference old employees.

Do not physically delete users by default.

User administration actions should be auditable, for example:

```text
USER_CREATED
USER_UPDATED
USER_BLOCKED
USER_ACTIVATED
```

Important Firebase Auth constraint:
Client-side code cannot safely perform every privileged Auth-admin operation. Before implementing user creation/deletion/password reset flows, verify whether the task requires Firebase Admin SDK / Cloud Functions / another trusted backend. Do not fake privileged Auth administration in the browser.

---

## 19. Audit Log

Audit collection:

```text
auditLogs
```

Service:

```text
src/services/firebase/audit.service.js
```

Audit log is admin-only.

Existing/expected event naming uses past-tense event codes, e.g.:

```text
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_DELETED
SALE_CREATED
SALE_DELETED
SETTINGS_UPDATED
LOGIN_SUCCESS
```

The live CRM also includes an admin-only audit-log clearing feature.

Expected clearing behavior:
- explicit destructive confirmation;
- delete only `auditLogs`;
- safe chunk/batch deletion for large log volumes;
- no effect on products, sales, users, settings, counters, or inventory movements;
- after successful clearing, create a new audit entry such as:

```text
AUDIT_LOG_CLEARED
```

so the clearing action itself remains visible.

If the local branch lacks this behavior, do not assume it was intentionally removed; inspect git history/current deployed branch before reimplementing.

---

## 20. Settings

Settings are admin-only.

Store settings use:

```text
settings/store
```

Relevant files:

```text
src/pages/Settings/
src/hooks/useStoreSettings.js
src/services/firebase/settings.service.js
src/constants/storeSettingsDefaults.js
```

Defaults belong in constants, not embedded inside Firestore services.

Do not overwrite settings with partial/undefined data accidentally.

---

## 21. Warehouse

Warehouse is inventory, not sales history.

A product/archive filter may expose SOLD products, but do not turn Warehouse into a sales-history page.

Do not add customer/payment/sale-history columns to Warehouse unless explicitly requested.

Sales details belong in Sales History.

Keep search/filter logic centralized and avoid duplicated filter branches.

---

## 22. Sales History

Sales History is the proper place for historical transaction details.

It must remain backward compatible with older sales documents.

When adding new sale fields:
- old documents may not contain them;
- UI must not crash;
- show sensible fallback values.

Do not mutate historical sale records just to make the current UI easier.

---

## 23. Auditability and logging

Important business actions should be auditable.

When adding a new admin/business action, consider whether it needs an audit event.

However:
- audit failures should not always destroy the primary business operation unless that is explicitly required;
- avoid duplicate event logging;
- preserve current service conventions.

---

## 24. Error handling

The project uses:

```text
src/utils/AppError.js
```

Prefer existing error handling patterns.

User-facing errors should be understandable Russian messages.

Do not expose raw Firebase internals to end users when an application-friendly message is available.

Avoid swallowing critical business errors.

---

## 25. UI conventions

Use existing reusable components before creating new ones:

```text
Button
Card
Input
Modal
Table
Toast
Loader
Empty
Search
```

Use SCSS Modules and existing design variables/mixins.

Do not introduce a new component library without explicit approval.

Preserve existing layout and visual language.

Admin-only actions should not be shown to managers.

Destructive actions require confirmation.

---

## 26. Code-change rules for Claude

For every task:

1. Read the relevant files first.
2. Trace the data flow before editing.
3. Identify historical/backward-compatibility risk.
4. Make the smallest coherent change.
5. Reuse existing services/utilities/components.
6. Do not refactor unrelated code.
7. Do not rename public fields/collections without explicit instruction.
8. Do not modify `.env` values.
9. Do not print secrets or Firebase config values in reports/output.
10. Run lint and build.
11. Summarize modified files and behavior.

If a task touches financial calculations, sales creation/deletion, stock restoration, permissions, or Firestore schema, perform extra regression checks.

---

## 27. Regression checklist

For significant changes, consider these flows:

### Authentication
- admin login
- manager login
- blocked user cannot work
- protected routes enforce roles

### Products / Warehouse
- create product
- edit product
- laptop status behavior
- accessory quantity behavior
- search/filter/archive behavior

### Sales
- cash sale
- bank transfer sale
- POS sale
- M+ 3 months / 5%
- Zero 3 months / 5%
- manual discount
- kit discount
- multiple laptops
- laptop + accessories
- insufficient accessory stock rejection
- sold laptop rejection

### Sale cancellation
- laptop returns to AVAILABLE
- accessory stock restores
- RETURN movements created
- sale removed correctly

### History / Warranty
- new sale opens
- old sale without newer fields opens
- warranty prints correctly
- historical CPU/RAM/SSD display does not depend on current product data

### Reports
- Revenue
- Profit
- Sales Count
- Average Check
- date filters
- old sales remain correct

### Admin
- Settings admin-only
- Reports admin-only
- Audit admin-only
- Users admin-only
- manager cannot bypass routes

---

## 28. Current product roadmap

The CRM is already in real use. The next priority work is not broad feature expansion.

Current planned stages:

1. Finish Dashboard
2. Finish Users page
3. Add report downloads (XLSX/PDF)
4. Regression test production workflows
5. Only then consider smaller UX improvements based on real usage

Avoid adding speculative modules unless requested.

---

## 29. Git / migration workflow

Before starting work in Claude Code:

```bash
git status
```

If the working tree is clean, create/confirm a baseline commit for the current production version.

Recommended approach for non-trivial work:

```bash
git checkout -b feature/<short-task-name>
```

Make focused commits.

Do not mix unrelated features into one commit.

Never commit:
- `.env`
- Firebase credentials/secrets
- `node_modules`
- `dist`
- local backups

Verify `.gitignore` before first push from a new machine/environment.

---

## 30. First action when Claude Code opens this project

Before making any change, Claude should:

1. run `git status`;
2. inspect `package.json`;
3. inspect `src/routes/index.jsx`;
4. inspect `src/store/AuthContext.jsx`;
5. inspect `src/services/firebase/*.service.js` relevant to the task;
6. inspect the specific page/components/utilities for the requested task;
7. report any mismatch between this guide and the actual code;
8. treat actual code + explicit latest user instruction as authoritative.

Do NOT begin by restructuring the repository.

---

## 31. Definition of done

A task is done only when:
- requested behavior is implemented;
- existing behavior is preserved unless explicitly changed;
- backward compatibility is considered;
- role/security implications are checked;
- `npm run lint` succeeds;
- `npm run build` succeeds;
- changed files are listed;
- important regression scenarios are reported.

For production-sensitive tasks, explicitly state what was tested and what was not tested.

## Mandatory Codex review workflow

For every meaningful code change, Claude Code is the primary implementer and Codex is the independent reviewer.

After completing an implementation:

1. Run:
   - npm run lint
   - npm run build

2. If both pass, run Codex CLI from the project root and ask it to review the current uncommitted diff.

3. Codex must act only as a reviewer.
   It must NOT modify files unless explicitly requested.

4. Ask Codex to inspect:
   - git diff
   - changed files
   - related business logic
   - possible regressions
   - Firestore consistency
   - backward compatibility
   - security implications
   - P0 / P1 / P2 issues

5. The Codex review prompt should include:

   "Ты работаешь как независимый code reviewer проекта Asman Store CRM.
   Основной исполнитель изменений — Claude Code.

   Проверь текущий незакоммиченный diff и связанные с ним части проекта.

   Ищи:
   - P0/P1/P2 bugs;
   - regressions;
   - нарушения бизнес-логики;
   - проблемы Firestore transactions;
   - проблемы historical snapshots;
   - ошибки расчета Revenue / Profit;
   - проблемы ролей и доступа;
   - несовместимость со старыми документами Firestore;
   - возможные race conditions;
   - ошибки восстановления склада;
   - проблемы Audit Log.

   Не изменяй файлы.

   В конце дай:
   1. P0
   2. P1
   3. P2
   4. рекомендации
   5. можно ли принимать этап."

6. Claude Code must read the Codex response and evaluate every finding.

7. Do NOT blindly implement every Codex suggestion.
   Verify each finding against the actual code and business requirements.

8. If Codex finds a confirmed P0 or P1:
   - fix it;
   - rerun npm run lint;
   - rerun npm run build;
   - rerun Codex review.

9. P2 issues may be fixed when they are clearly relevant and low-risk.
   Do not perform unrelated refactoring just because Codex suggested it.

10. The stage is considered complete only when:
    - lint passes;
    - build passes;
    - no confirmed P0/P1 issues remain;
    - backward compatibility is preserved.

11. Do not commit automatically.
    Wait for user approval before committing.

## Codex invocation requirements

When Claude Code runs Codex review:

- Always run Codex in non-interactive mode.
- stdin must be closed with `</dev/null`.
- Use a read-only sandbox.
- Apply a hard timeout of 600 seconds.
- Do not allow Codex to wait for interactive input.
- If Codex exceeds the timeout:
  - terminate only the Codex process;
  - preserve the current working tree;
  - report a tooling failure;
  - do not retry more than once automatically.
- Codex must not modify project files during review.
- After Codex finishes, verify `git diff` to confirm the reviewer did not alter the working tree.