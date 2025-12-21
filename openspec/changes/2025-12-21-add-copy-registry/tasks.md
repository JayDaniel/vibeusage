## 1. Discovery & scope
- [ ] 1.1 Inventory all web UI copy strings (pages/components) and map modules.
- [ ] 1.2 Confirm registry file location and format (CSV vs JSON).

## 2. Registry definition
- [ ] 2.1 Create `dashboard/src/content/copy.csv` with required columns.
- [ ] 2.2 Populate registry with current copy (module/page/component/slot).

## 3. Wiring
- [ ] 3.1 Add a copy loader (e.g., `dashboard/src/lib/copy.js`) and lookup helper.
- [ ] 3.2 Replace hardcoded UI text with `copy(key)` references across pages/components.

## 4. Validation & safety
- [ ] 4.1 Add a validation script/test to ensure:
  - all referenced keys exist in registry
  - all registry rows include module/page/component/slot
- [ ] 4.2 Add a small dev-time warning for missing keys (non-production).

## 5. Docs
- [ ] 5.1 Document how to edit the registry table in `docs/` or `README`.

## 6. Verification
- [ ] 6.1 `npm --prefix dashboard run build`
- [ ] 6.2 Manual: edit a registry row and confirm UI reflects change.
