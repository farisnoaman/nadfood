# Unit Test Suite Plan

## Current Test Coverage

### Existing Tests
- `src/utils/calculations.test.ts` - 7 tests passing
  - `calculateInitialShipmentValues`: 3 tests
  - `calculateAccountantValues`: 2 tests
  - `calculateAdminValues`: 2 tests

- `src/components/common/ui/Button.test.tsx` - 7 tests passing
  - Component rendering with variants
  - Component rendering with sizes
  - Click event handling
  - Disabled state
  - Custom className forwarding
  - Type attribute forwarding

**Total**: 14 tests passing

---

## Recommended Test Suite Structure

### 1. Utility Functions (`src/utils/`)

#### 1.1 Calculations (`calculations.test.ts` ✅ COMPLETE)
- [x] calculateInitialShipmentValues
  - [x] Correct calculation with valid inputs
  - [x] Return empty object when region not found
  - [x] Set hasMissingPrices flag when product price missing
- [x] calculateAccountantValues
  - [x] Correct calculation with valid inputs
  - [x] Handle null/undefined road expenses
- [x] calculateAdminValues
  - [x] Correct calculation with valid inputs
  - [x] Handle products without deduction values

#### 1.2 Data Mappers (`dataMappers.test.ts` ⚠️ MISSING)
**Priority: HIGH** - Core data transformation logic
- mapSupabaseUserToUser()
- mapSupabaseProductToProduct()
- mapSupabaseDriverToDriver()
- mapSupabaseRegionToRegion()
- mapSupabaseNotificationToNotification()
- mapSupabaseShipmentToShipment()
- mapProductPriceToProductPrice()
- mapShipmentProductToShipmentProduct()
- Test all mappers handle null/undefined values

#### 1.3 Date Formatting (`dateFormatter.test.ts` ⚠️ MISSING)
**Priority: MEDIUM**
- formatDateToArabic()
- formatRelativeTime()
- formatTimestamp()
- Test Arabic locale handling
- Test timezone handling

#### 1.4 Validation (`validation.test.ts` ⚠️ MISSING)
**Priority: HIGH** - Input validation critical for data integrity
- validateShipment()
- validateUser()
- validateProduct()
- validateDriver()
- validateRegion()
- Test all validation rules
- Test error messages

#### 1.5 IndexedDB (`indexedDB.test.ts` ⚠️ MISSING)
**Priority: HIGH** - Core offline functionality
- getAllFromStore()
- addToStore()
- updateInStore()
- deleteFromStore()
- clearStore()
- Test with large datasets
- Test error handling
- Test IDB quota limits

#### 1.6 Sync Queue (`syncQueue.test.ts` ⚠️ MISSING)
**Priority: HIGH** - Critical for offline sync
- enqueueOperation()
- processQueue()
- markOperationSynced()
- handle conflicts
- Test offline/online transitions

#### 1.7 Authentication (`offlineAuth.test.ts` ⚠️ MISSING)
**Priority: HIGH** - Security critical
- saveOfflineSession()
- getOfflineSession()
- clearOfflineSession()
- Test session expiry

#### 1.8 Encryption (`encryption.test.ts` ⚠️ MISSING)
**Priority: MEDIUM** - Security
- encrypt()
- decrypt()
- Test with various data types
- Test key handling

#### 1.9 Export Data (`exportData.test.ts` ⚠️ MISSING)
**Priority: MEDIUM**
- exportToCSV()
- exportToExcel()
- Test data formatting
- Test large dataset handling

#### 1.10 Print (`print.test.ts` ⚠️ MISSING)
**Priority: LOW**
- printShipment()
- Test print formatting

#### 1.11 Utilities
- authProtection.test.ts ⚠️ MISSING
- constants.test.ts (constants file - may not need tests)
- csrf.test.ts ⚠️ MISSING
- sanitization.test.ts ⚠️ MEDIUM
- settingsMigration.test.ts ⚠️ MEDIUM
- logger.test.ts (logging - may not need tests)
- supabaseClient.test.ts ⚠️ MEDIUM
- supabaseService.test.ts ⚠️ MEDIUM

---

### 2. Service Layer (`src/providers/app/services/`)

#### 2.1 Service Pattern Test (`serviceBase.test.ts`) ⚠️ MISSING
**Priority: HIGH** - Template for all service tests
- Test fetch methods (IndexedDB fallback)
- Test insert methods (offline queueing)
- Test update methods (offline queueing)
- Test delete methods (offline queueing)
- Test conflict resolution

#### 2.2 User Service (`userService.test.ts`) ⚠️ MISSING
**Priority: HIGH**
- fetchAll()
- fetchById()
- insert()
- update()
- delete()
- Test role-based filtering
- Test offline behavior

#### 2.3 Product Service (`productService.test.ts`) ⚠️ MISSING
**Priority: HIGH**
- fetchAll()
- fetchById()
- insert()
- update()
- delete()
- Test active/inactive filtering
- Test offline behavior

#### 2.4 Driver Service (`driverService.test.ts`) ⚠️ MISSING
**Priority: HIGH**
- fetchAll()
- fetchById()
- insert()
- update()
- delete()
- Test active driver filtering
- Test offline behavior

#### 2.5 Region Service (`regionService.test.ts`) ⚠️ MISSING
**Priority: HIGH**
- fetchAll()
- fetchById()
- insert()
- update()
- delete()
- Test offline behavior

#### 2.6 Notification Service (`notificationService.test.ts`) ⚠️ MISSING
**Priority: MEDIUM**
- fetchAll()
- insert()
- markAsRead()
- delete()
- Test role-based filtering
- Test offline behavior

---

### 3. Context/Provider Tests

#### 3.1 App Context (`AppContext.test.tsx`) ⚠️ MISSING
**Priority: HIGH** - Core application state
- Test initial state
- Test data loading
- Test offline mode
- Test sync triggers
- Test role-based access control

#### 3.2 Tenant Context (`TenantContext.test.tsx`) ⚠️ MISSING
**Priority: HIGH** - Multi-tenancy
- Test subdomain extraction
- Test company fetching
- Test fallback behavior
- Test brand color application
- Test root domain handling

#### 3.3 Auth Hook (`useAuth.test.ts`) ⚠️ MISSING
**Priority: HIGH** - Authentication flow
- Test login flow
- Test logout flow
- Test session restoration
- Test offline authentication
- Test role handling

---

### 4. Feature Components (`src/components/features/`)

#### 4.1 Authentication Features ⚠️ MISSING
**Priority: HIGH**
- CompanySignup.test.tsx
- Login.test.tsx
- PasswordResetRequest.test.tsx
- PasswordResetConfirm.test.tsx
- UserInvite.test.tsx

#### 4.2 Admin Features ⚠️ MISSING
**Priority: HIGH** - Admin panel functionality
- AdminDashboard.test.tsx
- AdminInstallments.test.tsx
- AdminReports.test.tsx
- AdminSettings.test.tsx
- AdminShipmentList.test.tsx
- AdminShipmentModal.test.tsx
- ManageData.test.tsx
- ManageUsers.test.tsx
- DriverManager.test.tsx
- PriceManager.test.tsx
- ProductManager.test.tsx
- RegionManager.test.tsx

#### 4.3 Accountant Features ⚠️ MISSING
**Priority: HIGH** - Core business logic
- AccountantDashboard.test.tsx
- AccountantShipmentModal.test.tsx
- ShipmentList.test.tsx

#### 4.4 Fleet Features ⚠️ MISSING
**Priority: HIGH** - Driver functionality
- FleetDashboard.test.tsx
- FleetShipmentModal.test.tsx
- NewFleetShipmentForm.test.tsx
- ReturnedShipmentsTab.test.tsx

#### 4.5 Platform Features ⚠️ MISSING
**Priority: MEDIUM** - Multi-tenant admin
- Backups.test.tsx
- Companies.test.tsx
- CreateTenant.test.tsx
- Dashboard.test.tsx
- MasterCatalog.test.tsx

---

### 5. Common Components (`src/components/common/`)

#### 5.1 UI Components
- Alert.tsx ⚠️ MEDIUM
- Badge.tsx ⚠️ LOW
- Card.tsx ⚠️ MEDIUM
- Dialog.tsx ⚠️ HIGH
- FormField.tsx ⚠️ HIGH
- Modal.tsx ⚠️ HIGH
- Select.tsx ⚠️ HIGH
- StatusIndicator.tsx ⚠️ MEDIUM

#### 5.2 Display Components
- ShipmentListItem.tsx ⚠️ HIGH
- ShipmentSummary.tsx ⚠️ MEDIUM
- ProductCard.tsx ⚠️ LOW

#### 5.3 Form Components
- ArabicDatePicker.tsx ⚠️ HIGH
- InstallPrompt.tsx ⚠️ LOW

#### 5.4 Shared Components
- ErrorBoundary.tsx ⚠️ HIGH
- PrintPreview.tsx ⚠️ MEDIUM
- LoadingSpinner.tsx ⚠️ LOW
- OfflineIndicator.tsx ⚠️ MEDIUM
- SyncStatusIndicator.tsx ⚠️ MEDIUM

---

## Test Priority Matrix

| Component | Priority | Complexity | Risk |
|-----------|----------|-------------|-------|
| Validation utilities | HIGH | Low | High |
| Data Mappers | HIGH | Medium | High |
| IndexedDB operations | HIGH | High | High |
| Sync Queue | HIGH | High | High |
| Authentication flows | HIGH | High | High |
| Shipment calculations | HIGH ✅ | Medium | High |
| User Service | HIGH | Medium | Medium |
| Product Service | HIGH | Medium | Medium |
| Region Service | HIGH | Medium | Medium |
| Driver Service | HIGH | Medium | Medium |
| App Context | HIGH | High | High |
| Tenant Context | HIGH | Medium | Medium |
| Forms & Modals | HIGH | Medium | Medium |
| Dashboard components | MEDIUM | High | Low |
| Utility functions | MEDIUM | Low | Medium |
| Display components | LOW | Low | Low |

---

## Recommended Test Order

### Phase 1: Core Utilities (Week 1-2)
1. Validation utilities
2. Data mappers
3. IndexedDB operations
4. Sync queue

### Phase 2: Services & Context (Week 3-4)
5. All service modules
6. App Context
7. Tenant Context
8. Auth hooks

### Phase 3: Critical Features (Week 5-6)
9. Authentication components
10. Admin shipment management
11. Accountant dashboard
12. Fleet dashboard

### Phase 4: UI Components (Week 7-8)
13. Common UI components
14. Forms and modals
15. Display components

### Phase 5: Remaining Features (Week 9-10)
16. Platform features
17. Remaining utility tests
18. E2E tests setup

---

## Test Configuration Files

Already present:
- `vitest.config.ts` - Configuration for all tests
- `vitest.components.config.ts` - Component test configuration
- `vitest.integration.config.ts` - Integration test configuration
- `src/test/setup.ts` - Test setup file

---

## Test Coverage Goals

| Metric | Current | Target |
|--------|----------|--------|
| Utility Test Coverage | ~5% (1/20 files) | 90%+ |
| Service Test Coverage | 0% (0/5 files) | 90%+ |
| Component Test Coverage | ~1% (1/50+ files) | 70%+ |
| Integration Tests | 0 | 30+ scenarios |
| Total Test Count | 14 | 200+ |

---

## Notes

1. **Component Testing**: Use React Testing Library for all component tests
2. **Mocking**: Mock Supabase client in service tests
3. **IndexedDB**: Use `fake-indexeddb` or create mock implementation
4. **Offline Tests**: Test offline/online transitions thoroughly
5. **Arabic Support**: Test Arabic text rendering and RTL
6. **Type Safety**: All tests should be fully typed
7. **Isolation**: Tests should not depend on external state
8. **Performance**: Add performance tests for critical operations (IndexedDB, sync)

---

## Next Steps

1. **Immediate**: Add tests for validation and data mappers (Phase 1)
2. **Short-term**: Implement service layer tests (Phase 2)
3. **Medium-term**: Build feature component tests (Phase 3-4)
4. **Long-term**: Complete remaining coverage (Phase 5)
5. **CI/CD**: Integrate tests into CI/CD pipeline
