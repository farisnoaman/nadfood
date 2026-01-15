# Shipment Tracking System v1.0.0

A comprehensive shipment tracking and management system built with React, TypeScript, and Supabase for managing fleet operations, accounting, and administrative tasks.

## 🚀 Features

### 👥 User Roles
- **مسؤول الحركة (Sales/Fleet)**: Create and manage shipments, handle returned shipments
- **محاسب (Accountant)**: Review and process shipments, manage financial calculations
- **ادمن (Admin)**: Full system administration, user management, data management

### 📦 Core Functionality
- **Shipment Creation**: Multi-product shipments with automatic pricing calculations
- **Real-time Updates**: Live synchronization across all user roles
- **Offline Support**: Full PWA functionality with background sync
- **PDF Generation**: Professional shipment receipts and reports
- **Notification System**: Real-time alerts for all users
- **Data Export**: CSV export for reports and analytics

### 🛠️ Technical Features
- **Progressive Web App (PWA)**: Installable on mobile devices
- **Offline-First Architecture**: Works without internet connection
- **Real-time Synchronization**: Instant updates across all clients
- **Responsive Design**: Optimized for desktop and mobile
- **Type-Safe**: Full TypeScript implementation
- **Modern UI**: Clean, intuitive interface with Arabic RTL support

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project
- Android Studio (for APK builds)

## 🏗️ Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd shipment-tracking
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Database Setup
```bash
# Apply database migrations
supabase db push

# Or manually execute SQL files in supabase/migrations/
```

### 4. Development
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## 📱 Building APK

### Automated APK Build
```bash
# Install Capacitor (if not already installed)
npm install @capacitor/core @capacitor/cli @capacitor/android

# Setup Android project
npm run android:setup

# Build APK
npm run android:build
```

### Manual APK Build
See `docs/guides/ANDROID_APK_GUIDE.md` for detailed instructions.

## 🚀 Deployment

### Web Deployment
```bash
# Build for production
npm run build

# Deploy dist/ folder to your web server
```

### Supabase Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy admin-change-user-password
```

See `docs/guides/DEPLOYMENT_GUIDE.md` for complete deployment guide.

## 📖 Documentation

### 📚 User Guides
- `docs/guides/QUICK_BUILD_GUIDE.md` - Quick setup and build guide
- `docs/guides/OFFLINE_MODE_IMPLEMENTATION.md` - Offline functionality details
- `docs/guides/APK_BUILD_README.md` - APK building instructions

### 🏗️ Development
- `docs/guides/APK_BUILD_SUMMARY.md` - Build process summary
- `docs/guides/DEPLOYMENT_GUIDE.md` - Deployment procedures

### 📋 Archived Reports
- `docs/archive/` - Completed feature reports and fix summaries

## 🏛️ Project Structure

```
shipment-tracking/
├── components/                 # React components
│   ├── common/                # Shared components
│   │   ├── ui/               # Basic UI components
│   │   ├── forms/            # Form components
│   │   ├── display/          # Display components
│   │   └── components/       # Specialized components
│   ├── features/             # Feature-specific components
│   │   ├── auth/            # Authentication
│   │   ├── sales/           # Sales/Fleet features
│   │   ├── accountant/      # Accounting features
│   │   └── admin/           # Admin features
│   ├── layout/              # Layout components
│   └── providers/           # Context providers
├── providers/               # React contexts
├── utils/                   # Utility functions
├── hooks/                   # Custom React hooks
├── supabase/               # Database schema & migrations
├── docs/                   # Documentation
├── public/                 # Static assets
└── types.ts               # TypeScript definitions
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Android APK
npm run android:setup   # Setup Android project
npm run android:sync    # Sync with Android project
npm run android:open    # Open Android Studio
npm run android:build   # Build APK

# Code Quality
npm run lint           # Run ESLint
```

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Supabase Auth integration
- **Role-based Access**: Granular permissions per user role
- **Data Sanitization**: Input validation and sanitization
- **Secure API**: All API calls authenticated and authorized

## 📊 Database Schema

### Core Tables
- `users` - User accounts and roles
- `shipments` - Shipment records
- `shipment_products` - Products within shipments
- `drivers` - Driver information
- `regions` - Geographic regions
- `product_prices` - Pricing by region and product
- `notifications` - System notifications

### Key Relationships
- Shipments → Drivers (many-to-one)
- Shipments → Regions (many-to-one)
- Shipments → Products (many-to-many via shipment_products)
- Product Prices → Regions + Products (composite key)

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**APK Build Issues**
- Ensure Android Studio is installed
- Check Java JDK version (11+ required)
- Verify Capacitor configuration

**Database Connection**
- Verify Supabase credentials in `.env`
- Check RLS policies are applied
- Ensure user has correct role permissions

**Offline Sync Issues**
- Check service worker registration
- Verify IndexedDB is not corrupted
- Clear browser data and retry

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Check the documentation in `docs/`
- Review archived reports in `docs/archive/`
- Contact the development team

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Node Version**: 18+
**React Version**: 18.2.0
**Supabase Version**: Latest
---

---

# Shipment Tracking Application (English)

A comprehensive and advanced web application designed for efficiently managing and tracking shipment operations. The application provides customized interfaces for different roles within an organization, ensuring a smooth and organized workflow from shipment creation to final settlement.

---

## Architecture

The application is built with a modern, scalable architecture using **React** for the frontend and **Supabase** as the Backend-as-a-Service.

- **Backend:** The application is powered by **Supabase**, which provides a robust PostgreSQL database, secure authentication, and real-time capabilities. All data is persistent and managed through a Supabase project.
- **Centralized State Management:** Utilizes the `React Context API` to provide global application state (e.g., shipments, users, products) after fetching it from Supabase. This provides a single source of truth for the frontend.
- **Custom Hooks:** Complex and reusable logic, such as shipment filtering and sorting, is abstracted into custom hooks (`useShipmentFilter`). This reduces code duplication and makes components cleaner and more focused on presentation.
- **Component Structure:** Large, complex components are broken down into smaller, more specialized sub-components. For example, the "Manage Data" panel is decomposed into separate components for each data type (Products, Drivers, etc.), making them easier to understand and modify independently.
- **UUIDs:** Supabase-provided Universally Unique Identifiers (UUIDs) are used as primary keys for most tables, ensuring data integrity and scalability.

---
## Core Features

- **Role-Based Access Control:** Custom roles (Sales, Accountant, Admin) with specific permissions, managed via Supabase Auth and user profiles.
- **Comprehensive Data Management:** A central dashboard for the Admin to manage product, driver, region, and pricing data directly in the database.
- **Integrated & Flexible Workflow:**
  - A clear process for moving shipments between departments (Sales, Accounting, Admin).
  - **Flexible Pricing:** Sales can submit shipments with undefined prices, alerting the Admin. The system automatically recalculates financials to ensure the latest prices from the database are always used.
- **Automatic Calculations:** The system automatically calculates costs and dues at each stage to minimize human error.
- **Powerful Dashboards:**
  - Financial summaries for the Admin with a visual chart for monthly revenue.
  - Live tracking of shipment statuses (New, Pending, Transferred).
- **Advanced Customization Settings:**
  - Control print permissions for the accountant.
  - **Accountant Workflow Control:** Toggle permission for Deductions, Additions, and Transfer sections.
  - Customize the report header (company name, logo).
  - Customize the application's name for branding.
  - Control the visibility of the time and date widget.
- **Professional Reporting:**
  - Generate modern, print-optimized PDF reports (using `jsPDF` and `html2canvas`).
  - Export shipment and financial summary data to CSV files.
- **Modern & Enhanced UI:**
  - Responsive design that works on all devices.
  - Searchable dropdowns throughout the app for easier data selection.
  - Adaptive view for data management on mobile (switches from tabs to a dropdown).
  - Toggle between list and grid views for data display.
- **Customizable Notification System:** Instant alerts for users, with the ability to choose which categories of notifications they receive.
- **Dark Mode Support:** Toggle between light and dark themes for eye comfort.
- **Professional Login Page:** Includes a footer with copyright information.

---

## User Roles and Permissions

The application features three main roles:

### 1. Sales

Responsible for creating initial shipments.
- **Responsibilities:**
  - Enter new shipment data.
  - Add products and carton counts.
  - Send the shipment to the accounting department, even if product prices are missing.

### 2. Accountant

Reviews shipments received from Sales and adds initial deductions.
- **Responsibilities:**
  - Review shipments with advanced filtering and sorting options.
  - **Draft Workflow:** Save work-in-progress shipments as "Draft" without submitting to Admin.
  - **Flexible Editing:** Edit Deductions, Additions, and Transfer sections based on permissions granted by Admin.
  - **Expenses Management:** Modify "Admin Expenses" and "Road Expenses" as needed.
  - **Review & Submit:** Forward the shipment to the Admin for final approval (with auto-recalculation).
  - **Print Reports:** Can print final shipment reports as a PDF **if granted permission by the Admin**.

### 3. Admin

Has full permissions over the system, responsible for final review and master data management.
- **Responsibilities:**
  - **Shipment Review:**
    - Finalize shipments or return them to the accountant.
    - **Print Reports:** Print any final shipment report as a PDF.
  - **Master Data Management:**
    - Add, edit, and delete data for Products, Drivers, Regions, and Prices.
  - **User Management:**
    - Add new users, change passwords, and activate/deactivate accounts.
  - **View Summaries:**
    - A dashboard with financial summaries, a monthly revenue chart, and Excel export.
    - Live tracking of shipment statuses (New, Pending, Transferred).
  - **Settings:**
    - **Print Permissions:** Grant or revoke the accountant's ability to print reports.
    - **Workflow Control:** Configure which sections (Deductions, Additions, Transfer) the accountant is allowed to edit.
    - **Customize UI & App:** Modify the app name, company details, and control UI elements.

---

## Database Setup and Installation

This application is powered by Supabase. To run it, you'll need to set up a Supabase project and create the necessary tables.

### 1. Set Up a Supabase Project

1.  Go to [supabase.com](https://supabase.com/) and create a new project.
2.  Once the project is created, navigate to `Project Settings` > `API`.
3.  Copy the **Project URL** and the **anon public key**.
4.  Paste these values into the `src/utils/supabaseClient.ts` file.

### 2. Database Schema (SQL)

Navigate to the `SQL Editor` in your Supabase dashboard and run the following commands to create the required tables.

```sql
-- Users table (automatically linked to auth.users)
CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true
);

-- Drivers table
CREATE TABLE public.drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Regions table
CREATE TABLE public.regions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  diesel_liter_price NUMERIC NOT NULL,
  diesel_liters NUMERIC NOT NULL,
  zaitri_fee NUMERIC NOT NULL
);

-- Product Prices table (links products and regions)
CREATE TABLE public.product_prices (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  UNIQUE(region_id, product_id)
);

-- Main Shipments table
CREATE TABLE public.shipments (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order TEXT NOT NULL UNIQUE,
  order_date DATE NOT NULL,
  entry_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  region_id uuid NOT NULL REFERENCES public.regions(id),
  driver_id INTEGER NOT NULL REFERENCES public.drivers(id),
  status TEXT NOT NULL,
  total_diesel NUMERIC,
  total_wage NUMERIC,
  zaitri_fee NUMERIC,
  admin_expenses NUMERIC,
  due_amount NUMERIC,
  damaged_value NUMERIC,
  shortage_value NUMERIC,
  road_expenses NUMERIC,
  due_amount_after_discount NUMERIC,
  other_amounts NUMERIC,
  improvement_bonds NUMERIC,
  evening_allowance NUMERIC,
  total_due_amount NUMERIC,
  tax_rate NUMERIC,
  total_tax NUMERIC,
  transfer_number TEXT,
  transfer_date DATE,
  modified_by TEXT,
  modified_at TIMESTAMPTZ,
  deductions_edited_by TEXT,
  deductions_edited_at TIMESTAMPTZ,
  created_by uuid REFERENCES auth.users(id),
  has_missing_prices BOOLEAN DEFAULT false
);

-- Shipment Products table (line items for a shipment)
CREATE TABLE public.shipment_products (
  id SERIAL PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL, -- To preserve name at time of creation
  carton_count INTEGER NOT NULL,
  product_wage_price NUMERIC
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  target_roles TEXT[],
  target_user_ids uuid[]
);
```

### 3. Row Level Security (RLS)

To ensure data security, you must enable RLS on all tables. Here are some basic policy examples:

-   **For the `users` table:** Allow users to read their own profile data only.
-   **For other tables:** Allow all authenticated users to read all data, and restrict write operations (insert, update, delete) based on user roles as needed for your security requirements.

---
created with ❤️ by Faris and AI
