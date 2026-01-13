# Super Admin Company Management UI Design

## Overview
This design outlines the user interface and logic for the Super Admin to manage tenant subscriptions, usage limits, and feature flags directly from the Platform Dashboard. This closes the loop on the Subscription System by providing a control plane.

## Architecture

### Components
1.  **`CompanyEditModal`**: A new isolated component located in `src/components/features/platform/CompanyEditModal.tsx`.
    *   **Props**: `isOpen`, `onClose`, `companyId`, `onSave`.
    *   **State**: Local state for `usage_limits` (JSON), `features` (JSON), `subscription_plan`, `subscription_status`.
    *   **UI**: multi-tab interface (Subscription, Limits, Features).

2.  **`PlatformCompanies`**: Existing component in `src/components/features/platform/Companies.tsx`.
    *   **Update**: Add "Edit" button to the actions column.
    *   **Update**: Integrate `CompanyEditModal` and handle refresh on save.

### Data Flow
1.  **Read**: `fetchCompanyDetails` (in Modal) calls Supabase `companies` table by ID.
2.  **Write**: `updateCompany` calls Supabase update.
    *   **Security**: existing RLS policies already allow `is_platform_admin` to UPDATE `companies`.

## UI/UX Design

### Tabs
1.  **Subscription**:
    *   **Plan**: Select (Free, Standard, Pro, Enterprise).
    *   **Status**: Select (Active, Suspended, Cancelled).
    *   **Dates**: Date pickers for Start/End dates.
    *   **Billing**: Select (Monthly, Annual).

2.  **Usage Limits**:
    *   **Max Users**: Number Input.
    *   **Max Drivers**: Number Input.
    *   **Max Regions**: Number Input.
    *   **Max Storage (MB)**: Number Input.
    *   *Helper text*: "Current usage: X"

3.  **Feature Flags**:
    *   **Import/Export**: Toggle Switch.
    *   **Manage Drivers**: Toggle Switch.
    *   **Manage Regions**: Toggle Switch.
    *   *Extensible*: Map over `CompanyFeatures` keys.

## Technical Implementation

### Types
Use existing `UsageLimits` and `CompanyFeatures` from `src/types/types.ts`.

### Persistence
The `companies` table uses JSONB for `usage_limits` and `features`.
The frontend must stringify/parse this correctly (Supabase JS client handles this automatically for JSON columns, but types need care).

## Testing Plan
1.  **Manual**:
    *   Open Modal for Company A.
    *   Change Max Drivers from 3 to 10.
    *   Enable "Import/Export".
    *   Save.
    *   Verify reflection in App (via "Verification" scripts or logging in as that tenant).
