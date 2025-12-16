# Shipment Tracking Application - Complete Features Summary

## 📋 Table of Contents
1. [Sales Role Features](#sales-role-features)
2. [Accountant Role Features](#accountant-role-features)
3. [Admin Role Features](#admin-role-features)
4. [Common Features (All Roles)](#common-features-all-roles)
5. [Technical Features](#technical-features)

---

## 🛒 SALES ROLE FEATURES

### A. Shipment Creation
1. **New Shipment Form**
   - Enter order date (date picker with current date default)
   - Auto-generated sales order number (format: SO-YEAR + random 6 digits)
   - Select region from searchable dropdown
   - Select driver from searchable dropdown (active drivers only)
   - Auto-display driver's plate number once selected

### B. Product Management in Shipments
2. **Product Selection**
   - Add multiple products to a single shipment
   - Searchable product dropdown (active products only)
   - Enter carton count for each product (numeric input, min: 0)
   - View real-time price per carton (from database)
   - View real-time total calculation per product (price × carton count)

3. **Flexible Product Entry**
   - Add unlimited number of products (Add Product button)
   - Remove products (X button on each row, minimum 1 product required)
   - Handle missing prices gracefully with warning icon
   - **Can submit shipments even with undefined prices** (alerts admin automatically)

### C. Submission & Validation
4. **Form Submission**
   - Send shipment to Accounting department
   - Automatic validation (all fields required, carton count > 0)
   - Success/error message display
   - Automatic form reset after successful submission
   - Automatic price recalculation at submission

5. **Price Alert System**
   - Visual warning (yellow triangle icon) for missing prices
   - Automatic notification to Admin when submitting with missing prices
   - Tooltip showing "No price defined for this product in selected region"

### D. User Experience
6. **Real-time Calculations**
   - Instant price display when product/region selected
   - Real-time total calculation for each product line
   - YRI (Yemeni Rial) currency formatting

7. **Responsive Design**
   - Mobile-friendly form layout
   - Grid layout (1 column on mobile, 2 columns on desktop)
   - Touch-friendly buttons and inputs

---

## 💼 ACCOUNTANT ROLE FEATURES

### A. Dashboard Navigation
1. **Multi-Tab Interface**
   - **Received Tab**: View shipments from Sales (NEW + DRAFT status)
   - **Sent Tab**: View shipments forwarded to Admin (SENT_TO_ADMIN + FINAL statuses)
   - **Edit Request Tab**: View shipments returned by Admin (RETURNED_FOR_EDIT status)
   - **Reports Tab**: View all shipments (comprehensive report view)

### B. Advanced Filtering & Search
2. **Search Functionality**
   - Search by sales order number
   - Search by driver name
   - Real-time search results

3. **Region Filter**
   - Filter by specific region
   - "All regions" option
   - Searchable region dropdown

4. **Date Range Filter**
   - Toggle-able date filter panel
   - "From date" and "To date" inputs
   - Clear date filters button
   - Filter by order date

5. **Sorting Options**
   - Newest first (default)
   - Oldest first
   - Highest due amount
   - Lowest due amount

6. **View Options**
   - Grid view (card-based layout)
   - List view (compact layout)
   - Desktop-only feature (mobile uses cards)

### C. Shipment Review & Processing
7. **Shipment Details Modal**
   - View complete shipment information
   - Visual stepper showing current workflow status
   - Initial summary section (wage, diesel, fees, admin expenses)
   - Expandable product details list
   - View/edit deductions section

8. **Deduction Management**
   - Add "Damaged value" (التالف)
   - Add "Shortage value" (النقص)
   - Add "Road expenses" (خرج الطريق)
   - Real-time calculation of "Due amount after discount"
   - Numeric validation (min: 0)

9. **Draft System**
   - Save shipment as draft (intermediate save)
   - Resume editing drafts later
   - Draft status preserved in database

10. **Price Recalculation**
    - Warning banner for shipments with missing prices
    - "Recalculate Prices" button
    - Automatic recalculation from latest database prices
    - Success/failure feedback messages
    - Visual indicator (yellow warning banner)

11. **Submission Controls**
    - **Save as Draft** button (preserves current state)
    - **Send to Admin** button (forwards for approval)
    - Zero deduction confirmation dialog
    - Missing price validation (blocks submission if prices = 0)
    - Automatic notification to Admin on price issues

### D. Print Functionality
12. **Conditional Print Access**
    - Print final shipment reports as PDF
    - **Only if Admin grants permission** (controlled in Admin Settings)
    - Print button visible only for FINAL/FINAL_MODIFIED shipments
    - Uses jsPDF + html2canvas for PDF generation

### E. Notification System
13. **Real-time Notifications**
    - Receive notifications when new shipments arrive from Sales
    - Receive notifications when Admin returns shipments for edit
    - Receive confirmation when shipment is finalized
    - Category-based filtering

---

## 👨‍💼 ADMIN ROLE FEATURES

### A. Dashboard Navigation
1. **Seven Main Tabs**
   - **Received**: Shipments awaiting admin review (SENT_TO_ADMIN status)
   - **All Shipments**: Complete shipment list (all statuses)
   - **Summaries**: Financial overview and statistics
   - **Reports**: Driver and region performance reports
   - **Data Management**: Master data configuration
   - **User Management**: User accounts and permissions
   - **Settings**: Application configuration

---

### B. SHIPMENT MANAGEMENT

#### 2. Shipment Review Modal
   - View all shipment details
   - Visual workflow stepper
   - Expandable product details
   - Accountant's deduction summary

#### 3. Accountant Deduction Editing
   - **Edit Deductions button** (allows admin override)
   - Confirmation dialog before editing
   - Edit damaged value, shortage value, road expenses
   - Automatic tracking: editor username + timestamp
   - Yellow banner showing "Edited by [username] at [timestamp]"
   - Real-time recalculation

#### 4. Admin-Specific Adjustments

   **Additions:**
   - Improvement bonds (سندات تحسين)
   - Evening allowance (ممسى)

   **Additional Deductions:**
   - Other amounts (مبالغ أخرى)

#### 5. Tax Management
   - Toggle tax on/off (checkbox)
   - Enter tax rate (percentage)
   - Auto-calculate tax amount
   - Display total before tax
   - Display final total after tax

#### 6. Transfer Information
   - Enter transfer number (min 8 digits)
   - Enter transfer date
   - Required for final approval

#### 7. Workflow Actions
   - **Return to Accountant** button (sends back for corrections)
   - **Final Approval** button (completes the shipment)
   - **Print** button (always available for FINAL shipments)
   - Modification tracking (username + timestamp for FINAL_MODIFIED)

#### 8. Advanced Calculations
   - Real-time total calculation including:
     - Base due amount after discount
     - Plus: improvement bonds + evening allowance
     - Minus: other amounts
     - Plus: tax (if enabled)
   - Large green display showing final total
   - YRI currency formatting throughout

---

### C. SUMMARIES & ANALYTICS

#### 9. Financial Transfer Summary
   - Date range filter (from/to)
   - Toggle-able date filter panel
   - Display total transferred amount for period
   - Export to Excel/CSV functionality
   - Includes: sales order, transfer date, transfer number, driver, region, final amount

#### 10. Monthly Revenue Chart
   - Visual bar chart (last 12 months)
   - Hover tooltips showing exact revenue
   - Color-coded bars (primary theme colors)
   - Auto-scaling based on max revenue
   - Empty state handling
   - Horizontal scrollable on mobile

#### 11. Statistics Cards (8 Cards)
   - Pending accountant actions count
   - Awaiting admin review count
   - Pending edit requests count
   - Total final shipments count
   - Total users count
   - Total regions count
   - Total drivers count
   - Total products count

#### 12. Shipment Status Tracker
   - Three tabs: New / Pending / Transferred
   - Real-time count badges
   - List view with:
     - Sales order number + driver name
     - Status badge (color-coded)
     - Due amount at current stage
   - Scrollable list (max height: 96px)

---

### D. REPORTS & ANALYTICS

#### 13. Driver Performance Report
   - View all active drivers
   - For each driver:
     - Total shipment count (finalized only)
     - Total revenue generated
     - Average revenue per shipment
   - **Drill-down feature**: Click driver → see breakdown by region
   - Sortable columns (name, count, revenue)
   - Sort indicators (up/down arrows)

#### 14. Region Performance Report
   - View all regions
   - For each region:
     - Total shipment count (finalized only)
     - Total revenue generated
     - Average revenue per shipment
   - **Drill-down feature**: Click region → see breakdown by driver
   - Sortable columns
   - Sort indicators

#### 15. Report Filtering
   - Date range filter (from/to)
   - Toggle-able date filter panel
   - Clear date filters button
   - Only counts FINAL/FINAL_MODIFIED shipments

#### 16. Export Capabilities
   - Export main report to CSV
   - Export drill-down details to CSV
   - UTF-8 BOM encoding for Excel compatibility
   - Arabic-friendly filenames
   - Includes: entity name, shipment count, total revenue, average

#### 17. Responsive Report Views
   - **Desktop**: Sortable table view
   - **Mobile**: Card-based layout with key metrics
   - Grand totals displayed in footer/summary card
   - Hover effects and visual feedback

---

### E. DATA MANAGEMENT

#### 18. Master Data Interface
   - **Desktop**: Tab-based navigation (Products, Drivers, Regions, Prices)
   - **Mobile**: Searchable dropdown selector
   - Bulk operations (placeholder):
     - Download sample CSV/Excel template
     - Import from CSV/Excel
     - Export current data to CSV/Excel

#### 19. Product Management
   - View all products in grid/list format
   - Add new product (name + active status)
   - Edit existing product (inline edit modal)
   - Delete product (with confirmation)
   - Toggle active/inactive status
   - Search/filter products
   - Sort products

#### 20. Driver Management
   - View all drivers in grid/list format
   - Add new driver (name + plate number + active status)
   - Edit existing driver
   - Delete driver (with confirmation)
   - Toggle active/inactive status
   - Search/filter drivers
   - Sort drivers

#### 21. Region Management
   - View all regions in grid/list format
   - Add new region with:
     - Region name
     - Diesel liter price
     - Diesel liters quantity
     - Zaitri fee
   - Edit existing region
   - Delete region (with confirmation)
   - Search/filter regions
   - Sort regions

#### 22. Product Price Management
   - View all product-region price combinations
   - Matrix view showing which products have prices in which regions
   - Add new price (select region + product + enter price)
   - Edit existing price
   - Delete price (with confirmation)
   - Visual indicators for missing prices
   - Filter by region or product
   - Bulk price updates

---

### F. USER MANAGEMENT

#### 23. User List & Controls
   - View all users (except current admin)
   - Display username, role, and active status
   - Color-coded status badges (green=active, red=inactive)
   - Sort users by:
     - Username (A-Z or Z-A)
     - Role
     - Status (active/inactive)
   - Sort order toggle (ascending/descending)

#### 24. User Account Management
   - **Add New User**:
     - Enter username
     - Enter email (for login)
     - Enter password
     - Select role (Sales / Accountant / Admin)
     - Creates Supabase Auth account + user profile
   
   - **Activate/Deactivate User**:
     - Toggle user active status
     - Confirmation dialog
     - Inactive users cannot log in
     - Visual indicator in list

   - **Change Password**:
     - Select user
     - Enter new password
     - Modal interface
     - Note: Requires server-side implementation for security

---

### G. SETTINGS & CONFIGURATION

#### 25. User Permissions
   - **Accountant Print Access**:
     - Toggle to grant/revoke print permission
     - Controls whether Accountant can print final shipment PDFs
     - Checkbox control

#### 26. Interface Settings
   - **Time Widget Visibility**:
     - Toggle to show/hide time/date widget
     - Affects navbar/header display

#### 27. Application Branding
   - **Edit Mode** for company details:
     - Application name (shown in navbar)
     - Company name
     - Company address
     - Company phone
     - Company logo URL
   
   - **Logo Management**:
     - Preview logo image
     - Remove logo option
     - Fallback icon display
   
   - **View Mode**: Read-only display of current settings

#### 28. Report Header Configuration
   - **Toggle Print Header**:
     - Enable/disable custom header in PDF reports
     - When enabled, includes company name and logo in reports

#### 29. Settings Persistence
   - All settings saved to local storage
   - Persists across sessions
   - Applied application-wide

---

## 🌐 COMMON FEATURES (ALL ROLES)

### A. Authentication & Security
1. **Login System**
   - Email/password authentication (Supabase Auth)
   - Professional login page
   - Role-based access control
   - Session management
   - Automatic logout button
   - Copyright footer

2. **User Profile Display**
   - Username shown in navbar
   - Role badge display
   - User-specific notifications

### B. Notification System
3. **Notification Panel**
   - Bell icon in navbar with unread count badge
   - Click-to-open slide-down panel
   - Three notification categories:
     - User Actions (إجراءات المستخدم)
     - Price Alerts (تنبيهات الأسعار)
     - System (النظام)

4. **Notification Features**
   - Filter by category (All / Actions / Prices / System)
   - Mark individual notification as read
   - Mark all as read button
   - Timestamp display (Arabic locale)
   - Visual distinction for unread (blue background)
   - Click-outside-to-close

5. **Notification Settings**
   - Access from notification panel
   - Toggle each category on/off
   - Checkbox controls
   - Filters what notifications you receive

### C. Theme & UI
6. **Dark Mode**
   - Toggle button in navbar (Moon/Sun icon)
   - Smooth transition animations
   - Persists across sessions
   - Affects entire application
   - Optimized color schemes for readability

7. **Responsive Design**
   - Mobile-first approach
   - Adaptive layouts:
     - Mobile: Stacked, single-column
     - Tablet: Hybrid layouts
     - Desktop: Multi-column grids
   - Touch-friendly buttons (minimum 44px)
   - Hamburger menu support (where applicable)

8. **Right-to-Left (RTL) Support**
   - Full Arabic language interface
   - RTL layout direction
   - Mirrored icons where appropriate
   - Arabic number formatting
   - Arabic date formatting

9. **Loading States**
   - Application-level loading spinner
   - Truck icon animation during data fetch
   - Button loading states ("جاري..." text)
   - Disabled buttons during submission
   - Skeleton screens (where applicable)

### D. Navigation & Layout
10. **Navbar**
    - Company logo (truck icon)
    - Application name (customizable)
    - Theme toggle
    - Notification bell with badge
    - User profile section
    - Logout button
    - Sticky top position

11. **Main Layout**
    - Consistent header/nav
    - Main content area with max-width container
    - Responsive padding
    - Footer (in login page)

12. **Breadcrumbs & Context**
    - Clear page titles
    - Tab-based navigation within sections
    - Visual indicators for active tab

### E. Common UI Components
13. **Reusable Components**
    - **Card**: Content containers with optional titles
    - **Button**: Multiple variants (primary, secondary, ghost, destructive)
    - **Input**: Text, number, date, email inputs with labels
    - **Select**: Standard dropdown
    - **SearchableSelect**: Dropdown with search/filter capability
    - **Modal**: Overlay dialogs with sizes (sm, md, lg, xl)
    - **Badge**: Status indicators with color coding
    - **FieldValue**: Label-value display component
    - **ProductDetails**: Expandable product list
    - **ShipmentStepper**: Visual workflow progress indicator

14. **Status Badges**
    - Color-coded by status:
      - من مسؤول الحركة (FROM_SALES): Blue
      - مسودة (DRAFT): Gray
      - مرسلة للادمن (SENT_TO_ADMIN): Yellow
      - طلب تعديل (RETURNED_FOR_EDIT): Orange
      - نهائي (FINAL): Green
      - نهائي معدل (FINAL_MODIFIED): Teal

15. **Form Validation**
    - Required field indicators
    - Error message display (red background)
    - Success message display (green background)
    - Inline validation
    - Min/max constraints

### F. Data Display
16. **Table Features**
    - Sortable columns
    - Hover effects
    - Row highlighting
    - Responsive tables (horizontal scroll on mobile)
    - Empty state messages
    - Footer totals

17. **List Features**
    - Card-based mobile layouts
    - Compact list views
    - Item actions (edit, delete)
    - Search/filter capabilities
    - Pagination (where needed)

18. **Number Formatting**
    - Thousands separators (en-US locale)
    - Currency display with YRI symbol
    - Maximum fraction digits control
    - Consistent formatting application-wide

19. **Date Formatting**
    - Arabic date display
    - Date pickers with locale support
    - ISO format storage
    - Display format: DD/MM/YYYY

---

## 🔧 TECHNICAL FEATURES

### A. Architecture & State Management
1. **React Context API**
   - `AppContext`: Global state for shipments, users, products, drivers, regions, prices, notifications
   - `ThemeContext`: Dark/light mode state
   - Single source of truth
   - Centralized data fetching

2. **Custom Hooks**
   - `useShipmentFilter`: Reusable filtering/sorting logic
   - `useAppContext`: Access global app state
   - `useTheme`: Access theme context

3. **Component Structure**
   - Role-based component organization
   - Shared common components
   - Atomic design principles (atoms → molecules → organisms)

### B. Database & Backend (Supabase)
4. **Database Tables**
   - `users`: User profiles linked to auth.users
   - `products`: Product master data
   - `drivers`: Driver master data
   - `regions`: Region master data with pricing factors
   - `product_prices`: Product-region price matrix
   - `shipments`: Main shipment data
   - `shipment_products`: Shipment line items
   - `notifications`: User notifications

5. **Database Features**
   - PostgreSQL backend
   - Row Level Security (RLS)
   - Real-time subscriptions (optional)
   - UUID primary keys (except drivers: serial)
   - Cascade deletes on foreign keys
   - Unique constraints

6. **Authentication**
   - Supabase Auth integration
   - Email/password authentication
   - Session management
   - Role-based access control (custom profiles table)

### C. Calculations & Business Logic
7. **Automatic Calculations**
   - `calculateInitialShipmentValues()`:
     - Total wage (sum of product prices × carton counts)
     - Total diesel cost (region diesel price × liters)
     - Zaitri fee (from region)
     - Admin expenses (5% of total wage)
     - Initial due amount (wage + diesel + zaitri + admin expenses)
     - Missing price detection

   - `calculateAccountantValues()`:
     - Total deductions (damaged + shortage + road expenses)
     - Due amount after discount (initial due - deductions)

   - `calculateAdminValues()`:
     - Additions (improvement bonds + evening allowance)
     - Additional deductions (other amounts)
     - Total before tax
     - Tax amount (if enabled, based on rate)
     - Total due amount (final)

8. **Validation Rules**
   - Required fields checking
   - Numeric min/max constraints
   - Price existence validation
   - Transfer number length (min 8 digits)
   - Carton count > 0

### D. Print & Export
9. **PDF Generation**
   - jsPDF library
   - html2canvas for rendering
   - `printShipmentDetails()` function
   - Custom print layout component
   - Company header (optional)
   - Comprehensive shipment details
   - Product breakdown table
   - Financial summary
   - User signature (printed by)

10. **CSV Export**
    - Financial summary export
    - Driver/region report export
    - UTF-8 BOM for Excel compatibility
    - Arabic-friendly encoding
    - Custom filenames with timestamps

### E. Performance & UX
11. **Optimizations**
    - useMemo for expensive calculations
    - Filtered/sorted data caching
    - Debounced search (where applicable)
    - Lazy loading (where applicable)
    - Minimal re-renders

12. **Error Handling**
    - Try-catch blocks for async operations
    - User-friendly error messages
    - Console error logging
    - Graceful fallbacks
    - Connection error detection

13. **Progressive Web App (PWA)**
    - Service worker (`sw.js`)
    - Manifest file for installability
    - Install prompt component
    - Offline capability (partial)
    - App-like experience

### F. Styling & Theming
14. **Tailwind CSS**
    - Utility-first styling
    - Custom color palette (primary, secondary)
    - Dark mode variants (dark:)
    - Responsive breakpoints (sm, md, lg, xl)
    - Custom configurations

15. **CSS Variables**
    - Theme color tokens
    - Consistent spacing
    - Typography scales

16. **Icons**
    - Lucide React icon library
    - Consistent icon sizing
    - Semantic icon usage
    - Custom icon components

### G. Routing & Navigation
17. **React Router**
    - HashRouter for GitHub Pages compatibility
    - Protected routes (role-based)
    - Automatic redirects based on role
    - 404 handling

18. **Route Structure**
    - `/login`: Authentication page
    - `/sales/*`: Sales dashboard
    - `/accountant/*`: Accountant dashboard
    - `/admin/*`: Admin dashboard (with sub-routes)

### H. TypeScript
19. **Type Safety**
    - Full TypeScript implementation
    - Interface definitions (User, Shipment, Product, etc.)
    - Enum types (Role, ShipmentStatus, NotificationCategory)
    - Type-safe props
    - Compile-time error detection

### I. Build & Development
20. **Vite**
    - Fast HMR (Hot Module Replacement)
    - Optimized production builds
    - Code splitting
    - Tree shaking

21. **Development Tools**
    - ESLint configuration
    - TypeScript compiler
    - npm scripts:
      - `dev`: Development server
      - `build`: Production build
      - `preview`: Preview production build
      - `lint`: Code linting

---

## 📊 FEATURE COUNT SUMMARY

**Total Major Feature Categories: 95+**

### By Role:
- **Sales**: 7 major feature categories
- **Accountant**: 13 major feature categories
- **Admin**: 29 major feature categories
- **Common (All Roles)**: 19 major feature categories
- **Technical Features**: 21 major feature categories

### Feature Highlights:
- ✅ **3 User Roles** with distinct permissions
- ✅ **6 Workflow Statuses** for shipment tracking
- ✅ **8 Database Tables** with full CRUD operations
- ✅ **4 Master Data Types** (Products, Drivers, Regions, Prices)
- ✅ **Advanced Filtering**: Search, region filter, date range, sorting
- ✅ **Flexible Pricing**: Handle missing prices, price recalculation
- ✅ **Comprehensive Reporting**: Driver reports, region reports, financial summaries
- ✅ **Real-time Notifications**: 3 categories, customizable settings
- ✅ **PDF Export**: Shipment reports with company branding
- ✅ **CSV Export**: Financial data and performance reports
- ✅ **Dark Mode**: Full theme support with persistence
- ✅ **RTL Support**: Complete Arabic interface
- ✅ **Responsive Design**: Mobile, tablet, desktop optimized
- ✅ **Progressive Web App**: Installable, offline-capable
- ✅ **TypeScript**: Full type safety
- ✅ **Modern Stack**: React 18, Vite, Tailwind CSS, Supabase

---

## 🎯 KEY DIFFERENTIATORS

1. **Flexible Workflow**: Sales can submit with missing prices, system handles gracefully
2. **Multi-level Calculations**: Three calculation stages (Sales → Accountant → Admin)
3. **Price Recalculation**: Accountant can update prices from latest database values
4. **Audit Trail**: Tracks who edited what and when (deductions, modifications)
5. **Drill-down Reports**: Click to see detailed breakdowns (driver → regions, region → drivers)
6. **Conditional Permissions**: Admin controls accountant's print access
7. **Comprehensive Settings**: Customize app name, company details, logo, print header
8. **Status Tracking**: Visual stepper shows shipment progress through workflow
9. **Notification Filtering**: Users choose which notification types to receive
10. **Monthly Revenue Chart**: Visual 12-month trend analysis

---

**Generated:** 2025-11-19  
**Version:** 0.0.1  
**Tech Stack:** React 18.2 + TypeScript + Vite + Supabase + Tailwind CSS
