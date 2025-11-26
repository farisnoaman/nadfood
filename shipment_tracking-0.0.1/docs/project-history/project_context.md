# Shipment Tracking Project Context

## Project Info
- Name: Shipment Tracking Application
- Version: 0.0.1
- Location: /workspace/shipment_tracking-0.0.1
- GitHub: https://github.com/farisnoaman/shipment_tracking/tree/V0.0.1
- Deployed: Vercel

## Tech Stack
- Frontend: React 18.2 + TypeScript + Vite
- UI: Tailwind CSS + Lucide Icons
- Backend: Supabase (PostgreSQL, Auth, Real-time)
- PDF: jsPDF + html2canvas
- Routing: React Router v6

## Key Features
- Role-based access control (Sales, Accountant, Admin)
- Shipment workflow management
- Financial calculations and reporting
- PDF report generation
- Dark mode support
- Notification system
- Data management (products, drivers, regions, prices)

## Database Schema
Tables: users, products, drivers, regions, product_prices, shipments, shipment_products, notifications

## Supabase Credentials
- Project Ref: kjvzhzbxspgvvmktjwdi
- Supabase URL: https://kjvzhzbxspgvvmktjwdi.supabase.co
- Access Token: sbp_6cf3691fc717168e1aba2f11916c7923301d5ae5
- Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjYyNjIxNCwiZXhwIjoyMDc4MjAyMjE0fQ.7f3k6YK-RnhL15_jhc-SODN_UFsPLnG3JQdjpgAOKGk

## Status
- Code extracted and analyzed ✅
- Complete feature summary generated: /workspace/docs/complete_features_summary.md ✅
- Total: 95+ major feature categories documented
- Organized by role: Sales (7) | Accountant (13) | Admin (29) | Common (19) | Technical (21)
- Comprehensive bug report generated: /workspace/docs/comprehensive_bug_report.md ✅
- Total bugs found: 26 (Critical: 2, High: 8, Medium: 10, Low: 6)
- All Critical and High priority fixes completed ✅

## Current Task: Admin Dashboard Enhancements (2025-11-22)
- Part 1: Regions Enhancement ✅ (already complete - road_expenses exists)
- Part 2: Shipment Details View Reorganization (in progress)
  - All database fields already exist ✅
  - Updating AdminShipmentModal UI layout...

## Latest Feature: Full Offline Mode ✅ (Requires Local Build)
- **Offline Authentication**: Login/logout works completely offline after first online login
- **Offline Data Operations**: All CRUD operations work offline with IndexedDB
- **Background Sync**: Auto-sync queued changes when back online
- **Sync Status Indicator**: Real-time online/offline status with pending count
- **Session Management**: 30-day offline session validity

- **New Files Created**:
  - utils/offlineAuth.ts (307 lines): Credential storage, offline login validation
  - utils/syncQueue.ts (442 lines): Sync queue management, background sync
  - components/common/SyncStatusIndicator.tsx (170 lines): UI sync status widget
  
- **Files Modified**:
  - Login.tsx: Offline login support, status indicators
  - AppContext.tsx: Offline session restoration, updated logout
  - App.tsx: Added SyncStatusIndicator component
  - Icons.tsx: Added WifiOff, RefreshCw, Wifi icons
  - sw.js: Updated to v11 with Background Sync API
  
- **Documentation**: /workspace/OFFLINE_MODE_IMPLEMENTATION.md (256 lines)
- **Status**: ⚠️ CODE COMPLETE - NEEDS LOCAL BUILD
  - Service worker updated to v11 ✅
  - Source code updated ✅
  - Needs: npm run build on local machine with Node.js 20+
  - Then redeploy dist/ folder

## Previous Fixes (Already Deployed)
- **Issue 1**: App stuck loading - FIXED ✅
- **Issue 2**: Offline login error - FIXED ✅
- **Deployed**: https://nooqapobx25w.space.minimax.io

## IndexedDB Implementation ✅ (Pending Build)
- **Status**: Code complete, requires local build (Node.js 20+ needed)
- **New File**: utils/indexedDB.ts (489 lines) - Complete IndexedDB service
- **Modified**: context/AppContext.tsx - Full migration from localStorage to IndexedDB
- **Modified**: dist/sw.js - Updated to v9
- **Features**:
  - 50MB+ storage capacity (vs 5-10MB localStorage)
  - Automatic migration from localStorage
  - Full offline support for all data
  - Better performance and no quota errors
- **Documentation**: 
  - /workspace/INDEXEDDB_IMPLEMENTATION.md (complete technical docs)
  - /workspace/QUICK_START_GUIDE.md (user guide)
  - /workspace/build.sh (build script)
- **Next Step**: User needs to build locally or via CI/CD with Node.js 20+
## All Fixes Complete ✅✅✅
- Edge Function deployment: COMPLETE ✅
- Function URL: https://kjvzhzbxspgvvmktjwdi.supabase.co/functions/v1/admin-change-user-password
- Function ID: b8f31d14-5b56-440b-8932-a7c38e693c3f
- Status: ACTIVE, Version: 1

## Bugs Fixed: 26/26 (100%)
- Critical: 2/2 ✅
- High: 8/8 ✅
- Medium: 10/10 ✅
- Low: 6/6 ✅

## New Files Created: 12
- Environment: .env, .env.example
- Utilities: constants.ts, validation.ts, dateFormatter.ts, exportData.ts, logger.ts
- Hooks: useFilteredNotifications.ts
- Edge Function: admin-change-user-password/index.ts
- Documentation: database_security.md, DEPLOYMENT_GUIDE.md, COMPLETE_FIXES_REPORT.md, EDGE_FUNCTIONS_DEPLOYMENT.md

## Files Modified: 11
- AppContext, supabaseClient, print.ts, AdminShipmentModal, ManageUsers, NewShipmentForm, useShipmentFilter, vite.config, .gitignore, index.tsx, tsconfig.json

## Android APK Build Setup ✅
- Capacitor configuration complete
- Build scripts created (Linux/Mac/Windows)
- GitHub Actions workflow configured
- Complete documentation: 1,145+ lines
- Files created: capacitor.config.ts, build-apk.sh, build-apk.bat, workflows/build-android.yml
- Guides: ANDROID_APK_GUIDE.md, APK_BUILD_README.md, APK_BUILD_SUMMARY.md
- NPM scripts added: android:setup, android:sync, android:open, android:build
- Status: Ready for local/cloud build (requires Android SDK or GitHub Actions)

## MiniMax Deployment ✅
- Deployed to MiniMax web server
- **Latest URL:** https://1js1wzraqz8x.space.minimax.io ✅ (NEW FEATURE: Fleet Returned Shipments Tab - 2025-11-22)
- **Previous URLs:** 
  - https://4oxf8gimevpt.space.minimax.io (FIXED: Missing ArrowLeft Icon - 2025-11-22) 
  - https://k66bqx9a6xfb.space.minimax.io (Attempted fix for blank page - 2025-11-22)
  - https://f1mgedxssebm.space.minimax.io (Accountant Review-Only Mode - 2025-11-22)
- **Previous URL:** https://57s4ae5vt5dd.space.minimax.io (Added Road Expenses to Regions - 2025-11-22)
- **Previous URL:** https://8a1k0fmpjb00.space.minimax.io (Sales Dashboard Working - Role Fully Synced)
- **Previous URLs:** 
  - https://0be64z5g2ex1.space.minimax.io (Carton Count Fix - 2025-11-22)
  - https://pre1qwiviiud.space.minimax.io (Sales Role Enhancements - 2025-11-22)
  - https://rnpxf19wqa2s.space.minimax.io (Database Updated - Role Migration - 2025-11-22)
  - https://ac0mk83e6j32.space.minimax.io (CRITICAL: Sales Login Fixed - 2025-11-22)
  - https://0be64z5g2ex1.space.minimax.io (Carton Count Fix - 2025-11-22)
  - https://pre1qwiviiud.space.minimax.io (Sales Role Enhancements - 2025-11-22)
  - https://zp9aax46dvf6.space.minimax.io (Offline Mode - Service Worker v11)
  - https://nooqapobx25w.space.minimax.io (Previous fixes working)
  - https://pkmyjl5mfowg.space.minimax.io, https://p6ax3nn36zak.space.minimax.io, https://uwlmpyj2u1kp.space.minimax.io, https://9q7ocm04w0ga.space.minimax.io
- Deployment method: Vite production build + PWA files
- PWA Status: ✅ Complete (Service Worker v11 + IndexedDB + Enhanced Manifest)
- **Latest Fixes (2025-11-22):**
  - ✅ NEW FEATURE: Fleet Returned Shipments Tab & Edit Capability
    - **Feature**: Added "المرتجعة" (Returned) tab in Fleet Dashboard
    - **New Status**: Added `ShipmentStatus.RETURNED_TO_FLEET = 'مرتجعة لمسؤول الحركة'`
    - **Functionality**:
      - Accountants can return shipments to fleet for corrections using "إرجاع الى مسؤول الحركة" button
      - Fleet users see returned shipments in new "المرتجعة" tab with badge count
      - Fleet can fully edit returned shipments (driver, region, products, quantities, cartons)
      - After editing, shipment returns to accountant with status "من مسؤول الحركة"
      - Automatic recalculation of all values on submission
    - **Files Created**:
      - components/sales/FleetShipmentModal.tsx (364 lines) - Edit modal for returned shipments
    - **Files Modified**:
      - types.ts: Added RETURNED_TO_FLEET status
      - components/sales/SalesDashboard.tsx: Complete rewrite with tabs (144 lines)
      - components/accountant/AccountantShipmentModal.tsx: Updated handleReturnToFleet to use new status
    - **Database Updates**:
      - Migration: update_fleet_rls_for_returned_shipments
      - Updated fleet_update_own_shipments RLS policy to allow editing returned shipments
      - Updated accountant_read_shipments RLS policy to include returned status
    - **UI Features**:
      - Badge counter on "المرتجعة" tab showing pending shipments
      - Warning banner in edit modal
      - Dual-search driver fields (name or plate number)
      - Dynamic product addition/removal
      - Validation before submission
    - **Deployed**: https://1js1wzraqz8x.space.minimax.io
  - ✅ FIXED: React Error #130 - Missing ArrowLeft Icon
    - **Issue**: Clicking "مراجعة" button caused React error #130 (component is undefined)
    - **Root Cause**: `ArrowLeft` icon was used in AccountantShipmentModal but not exported in Icons.tsx
    - **Solution**: 
      - Added `ArrowLeft` to import statement from lucide-react
      - Added `ArrowLeft` to Icons export object
    - **File Modified**: Icons.tsx (lines 6 and 42)
    - **Deployed**: https://4oxf8gimevpt.space.minimax.io
  - ✅ FIXED: Blank Page When Clicking Review Button
    - **Issue**: Clicking "مراجعة" button caused blank page
    - **Root Cause**: Component didn't handle case where `shipment.products` could be undefined/empty
    - **Solution**: Added safety check before iterating: `if (shipment.products && shipment.products.length > 0)`
    - **File Modified**: AccountantShipmentModal.tsx (lines 73-88)
    - **Deployed**: https://k66bqx9a6xfb.space.minimax.io
  - ✅ MAJOR CHANGE: Accountant Role please Changed to Review-Only Mode
    - **Removed**: "طلب تعديل" tab completely from accountant dashboard
    - **Removed**: All edit capabilities - accountant can no longer edit deductions (التالف, النقص)
    - **Removed**: "حفظ كمسودة" button
    - **Changed**: Action button label from "مراجعة وتعديل" to "مراجعة"
    - **Updated Display**: Now shows all fields including roadExpenses in read-only view
    - **New Buttons**:
      - "إرجاع الى مسؤول الحركة" - Returns shipment to fleet for modifications
      - "تأكيد و إرسال للمدير" - Confirms and sends to manager with validation
      - "طباعة" - Print for final shipments (unchanged)
    - **Enhanced Validation**:
      - Checks zero values: diesel, zaitri, adminExpenses, roadExpenses
      - Shows confirmation dialog listing all zero fields
      - Disables send button if product prices are missing
      - Shows warning: "سعر المنتج مفقود الرجاء ابلاغ المدير بادخال سعر المنتج"
    - **UI Improvements**:
      - Wrapped search filters (Search, Region, Sort) in collapsible "بحث" button
      - Date filters remain collapsible under "تصفية بالتاريخ"
    - **Files Modified**:
      - AccountantDashboard.tsx: Removed edit_request tab, wrapped filters
      - AccountantShipmentModal.tsx: Complete rewrite to read-only mode
      - ShipmentList.tsx: Updated button labels and viewType
    - **Result**: Accountant role is now purely review and routing - all editing moved to admin
  - ✅ CRITICAL FIX: Complete RLS Policies Update for Fleet Role
    - **Issue 1**: Fleet users couldn't submit shipments (shipments table) - FIXED ✅
    - **Issue 2**: Fleet users couldn't insert shipment products (shipment_products table) - FIXED ✅
    - **Root Cause**: RLS policies still referenced old role 'مبيعات' instead of 'مسؤول الحركة'
    - **Solutions**:
      - **Shipments Table** (Migration: update_shipments_policies_for_fleet_role):
        - fleet_insert_shipments: Allows fleet to insert their own shipments
        - fleet_read_own_shipments: Allows fleet to read their own shipments
        - fleet_update_own_shipments: Allows fleet to update own shipments in specific statuses
      - **Shipment Products Table** (Migration: update_fleet_role_policies):
        - fleet_all_shipment_products: Grants ALL permissions (INSERT, UPDATE, DELETE, SELECT) to fleet users
    - **Other Tables Verified**:
      - Notifications: Fleet can insert (all_insert_notifications) and read/update if targeted ✅
      - Drivers: Fleet can read (all_read_drivers for authenticated users) ✅
      - sync_logs: Table does not exist in database ✅
  - ✅ NEW: Added Road Expenses to Regions (خرج الطريق)
    - **Added Field**: `road_expenses` to regions table (NUMERIC, default 0)
    - **Updated Calculation**: Initial shipment calculation now includes road expenses deduction
    - **Formula**: المبلغ المستحق = إجمالي الأجر - إجمالي الديزل - رسوم زعيتري - المصروفات الإدارية - خرج الطريق
    - **UI Updates**: RegionManager now allows managing road expenses field
    - **Migration**: Created and applied migration `add_road_expenses_to_regions`
    - **Files Modified**: 
      - types.ts: Added roadExpenses field to Region interface
      - utils/calculations.ts: Updated calculateInitialShipmentValues to include roadExpenses
      - components/admin/manage-data/RegionManager.tsx: Added input field and display for roadExpenses
    - **Notifications**: Admin already receives notifications when product prices are missing (includes product name and region name)
  - ✅ FIXED: Sales Dashboard Not Displaying After Login
    - **Root Cause**: Two role definitions existed - types.ts had old 'مبيعات' while database was updated to 'مسؤول الحركة'
    - **Solution**: Updated types.ts line 7: Role.SALES from 'مبيعات' to 'مسؤول الحركة'
    - **Removed**: Unnecessary getRoleDisplayName() helper function (lines 12-26)
    - **Result**: Database, types.ts, and utils/constants.ts all synchronized with 'مسؤول الحركة'
  - ✅ CRITICAL: Database & Code Role Synchronization Complete
    - Updated database constraint: Changed check constraint to accept 'مسؤول الحركة'
    - Updated all user records: Changed role from 'مبيعات' to 'مسؤول الحركة'
    - Updated code constant: utils/constants.ts line 123 (ROLES.SALES = 'مسؤول الحركة')
    - Removed helper function approach - now using direct role value throughout
    - Migration files created: update_sales_role_to_movement_manager.sql, update_sales_role_step_by_step.sql
  - ✅ CRITICAL: Fixed sales login not showing dashboard
    - Root cause: Changed enum value broke database compatibility
    - Solution: Reverted Role.SALES to 'مبيعات' (database value)
    - Added getRoleDisplayName() helper for UI display as 'مسؤول الحركة'
  - ✅ CRITICAL: Fixed blank page on refresh after login
    - Fixed AppContext.tsx line 697: setUser() → setCurrentUser()
    - Fixed Login.tsx line 26/84: Removed invalid setUser reference
  - ✅ Sales Role Enhancements:
    - Changed role display name: "مبيعات" → "مسؤول الحركة" (UI only)
    - Removed sales order auto-generation (empty field by default)
    - **Fixed carton count to be truly empty (not 0) by default**
    - Improved X icon styling for better UX
    - Added dual-search driver field (search by name OR plate number, auto-fills other field)
    - Added price validation: Prevents submission if price missing/zero
    - Added confirmation modal for missing prices with "فهمت" (OK) button
    - NewShipmentForm.tsx completely rewritten (454 lines) with enhanced validation
  - ✅ Enhanced manifest.json with scope, orientation, categories for better PWABuilder compatibility
  - ✅ IndexedDB offline storage (50MB+)
  - ✅ Service worker v11 with pre-caching + offline support
  - ✅ All PWA requirements met
- **PWA Features:**
  - Proper PNG app icons (192x192 and 512x512)
  - Enhanced manifest with all PWABuilder-expected fields
  - Service worker v11 with runtime caching
  - IndexedDB for offline data (50MB+ capacity)
  - Works offline after first visit
- **Install Methods:**
  - PWA Install: Browser menu → "Install App"
  - APK Generation: PWABuilder.com (use new URL)
  - Alternative: Bubblewrap CLI or AppsGeyser
- Status: ✅ Fully functional PWA, ready for APK conversion

## Arabic Documentation ✅ (2025-11-21)
- Created comprehensive Arabic documentation: APP_DESCRIPTION_AR.md (519 lines)
- Documents: All roles, views, tabs, forms, fields, buttons, calculations
- Admin panel: All tabs, subtabs, contents, action buttons
- Calculations: Sales, Accountant, Admin stages
- Data management: Regions, Products, Prices, Drivers, Users

## APK Build Status ✅
- Cannot build native APK in sandbox (requires Android SDK ~10+ GB)
- **SOLUTION: Use PWABuilder.com** - Convert PWA to APK online in 5 minutes
- PWA is deployed and ready: https://p6ax3nn36zak.space.minimax.io
- Manifest.json ready with icons (192x192, 512x512)
- Service worker v9 with offline support
- Complete guides created:
  - /workspace/GENERATE_APK_NOW.md (Quick 5-minute guide)
  - /workspace/PWA_TO_APK_GUIDE.md (Complete methods)
- **Recommended**: PWABuilder.com - paste URL → generate → download APK
- Alternative: PWA install directly from browser (works on Android/iOS)
