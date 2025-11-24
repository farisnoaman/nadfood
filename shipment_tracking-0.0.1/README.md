# تطبيق تتبع الشحنات

تطبيق ويب شامل ومتقدم مصمم لإدارة وتتبع عمليات الشحنات بكفاءة عالية. يوفر التطبيق واجهات مخصصة لأدوار مختلفة داخل المؤسسة، مما يضمن سير عمل سلساً ومنظماً بدءاً من إنشاء الشحنة وحتى تسويتها النهائية.

---
## البنية البرمجية والهيكلة (Architecture)

تم تصميم التطبيق ببنية حديثة وقابلة للتطوير باستخدام **React** و **Supabase** كواجهة خلفية (Backend-as-a-Service).

- **الواجهة الخلفية (Backend):** يعتمد التطبيق على **Supabase** لتوفير قاعدة بيانات PostgreSQL قوية، ونظام مصادقة آمن، وإمكانيات الوقت الفعلي. جميع البيانات مستمرة وتتم إدارتها من خلال مشروع Supabase.
- **إدارة الحالة المركزية (Centralized State Management):** يتم استخدام `React Context API` لتوفير حالة التطبيق العامة (مثل بيانات الشحنات، المستخدمين، المنتجات) بعد جلبها من Supabase. هذا يضمن وجود مصدر واحد للحقيقة (Single Source of Truth) في الواجهة الأمامية.
- **الخطافات المخصصة (Custom Hooks):** تم استخلاص المنطق المتكرر والمعقد، مثل تصفية وفرز الشحنات، في خطافات مخصصة (`useShipmentFilter`) قابلة لإعادة الاستخدام. هذا يقلل من تكرار الكود ويجعل المكونات أكثر نظافة وتركيزاً على العرض.
- **هيكلة المكونات (Component Structure):** تم تقسيم المكونات الكبيرة والمعقدة إلى مكونات فرعية أصغر وأكثر تخصصاً. على سبيل المثال، تم تفكيك لوحة "إدارة البيانات" إلى مكونات منفصلة لكل نوع من البيانات (المنتجات، السائقين، إلخ)، مما يسهل فهمها وتعديلها بشكل مستقل.
- **معرفات فريدة (UUIDs):** تم استخدام المعرفات الفريدة عالمياً (UUIDs) التي يوفرها Supabase ك مفاتيح أساسية لمعظم الجداول، مما يضمن عدم تضارب البيانات وقابليتها للتوسع.

---

## الميزات الأساسية

- **نظام أدوار وصلاحيات:** أدوار مخصصة (مبيعات، محاسب، مدير) مع صلاحيات محددة لكل دور، تدار عبر Supabase Auth وملفات المستخدمين (profiles).
- **إدارة شاملة للبيانات:** لوحة تحكم مركزية للمدير لإدارة بيانات المنتجات، السائقين، المناطق، والأسعار بشكل فوري في قاعدة البيانات.
- **سير عمل متكامل ومرن:**
  - عملية واضحة لنقل الشحنة بين الأقسام (المبيعات، المحاسبة، الإدارة).
  - يمكن للمبيعات إرسال الشحنات بأسعار غير محددة، مع تنبيه المدير. يقوم النظام بإعادة الحسابات تلقائياً لضمان استخدام أحدث الأسعار من قاعدة البيانات.
- **حسابات تلقائية:** يقوم النظام بحساب التكاليف والمستحقات تلقائياً في كل مرحلة لتقليل الأخطاء البشرية.
- **لوحات تحكم قوية:**
  - خلاصات مالية للمدير مع تصور بياني للإيرادات الشهرية.
  - تتبع حي لحالة الشحنات (جديدة، معلقة، محولة).
- **إعدادات تخصيص متقدمة:**
  - التحكم في صلاحيات الطباعة للمحاسب.
  - تخصيص رأس التقرير (اسم الشركة، الشعار).
  - تخصيص اسم التطبيق ليعكس العلامة التجارية.
  - التحكم في ظهور أو إخفاء أداة عرض الوقت والتاريخ.
- **تقارير احترافية:**
  - إنشاء تقارير PDF بتصميم حديث ومحسن للطباعة (باستخدام `jsPDF` و `html2canvas`).
  - تصدير بيانات الشحنات والملخصات المالية إلى ملفات CSV.
- **واجهة عصرية ومحسنة:**
  - تصميم حديث ومتجاوب يعمل على جميع الأجهزة.
  - قوائم منسدلة قابلة للبحث في جميع أنحاء التطبيق لتسهيل اختيار البيانات.
  - عرض متكيف لإدارة البيانات على الأجهزة المحمولة (يتحول من تبويبات إلى قائمة منسدلة).
  - إمكانية التبديل بين عرض القائمة والعرض الشبكي للبيانات.
- **نظام إشعارات قابل للتخصيص:** تنبيهات فورية للمستخدمين مع إمكانية تحديد فئات الإشعارات التي يرغبون في استقبالها.
- **دعم الوضع الليلي:** إمكانية التبديل بين الوضع الفاتح والداكن لراحة العين.
- **صفحة تسجيل دخول احترافية:** تتضمن تذييلاً يعرض حقوق النشر.

---

## أدوار المستخدمين والصلاحيات

يحتوي التطبيق على ثلاثة أدوار رئيسية:

### 1. المبيعات (Sales)

مسؤول عن إنشاء الشحنات الأولية.
- **الوظائف:**
  - إدخال بيانات الشحنة الجديدة (تاريخ الأمر، رقم أمر المبيعات، المنطقة، السائق).
  - إضافة المنتجات وعدد الكراتين لكل شحنة.
  - إرسال الشحنة إلى قسم المحاسبة للمراجعة، حتى لو كان سعر المنتج غير محدد.

### 2. المحاسب (Accountant)

يقوم بمراجعة الشحنات المستلمة من مسؤول الحركة وإضافة الخصميات الأولية.
- **الوظائف:**
  - استعراض الشحنات مع خيارات تصفية وفرز متقدمة.
  - إضافة قيم الخصميات مثل (التالف، النقص، خرج الطريق).
  - ترحيل الشحنة إلى المدير للاعتماد النهائي (مع إعادة حساب تلقائية لضمان دقة الأسعار).
  - **طباعة التقارير:** يمكنه طباعة تقارير الشحنات النهائية كملف PDF **إذا منحه المدير الصلاحية**.

### 3. المدير (Admin)

يمتلك صلاحيات كاملة على النظام، وهو المسؤول عن المراجعة النهائية وإدارة البيانات الأساسية.
- **الوظائف:**
  - **مراجعة الشحنات:**
    - اعتماد الشحنة بشكل نهائي أو إرجاعها للمحاسب.
    - **طباعة التقارير:** طباعة أي تقرير شحنة نهائي كملف PDF.
  - **إدارة البيانات الرئيسية:**
    - إضافة، تعديل، وحذف بيانات (المنتجات، السائقين، المناطق، أسعار المنتجات لكل منطقة).
  - **إدارة المستخدمين:**
    - إضافة مستخدمين جدد، تغيير كلمات المرور، وتفعيل/تعطيل الحسابات.
  - **عرض الخلاصات:**
    - لوحة تحكم تعرض ملخصات مالية ورسم بياني للإيرادات الشهرية مع إمكانية التصدير إلى Excel.
    - تتبع حي لحالة الشحنات (جديدة، معلقة، محولة).
  - **الإعدادات:**
    - **صلاحيات الطباعة:** منح أو منع المحاسب من صلاحية طباعة التقارير.
    - **تخصيص الواجهة والتطبيق:** تعديل اسم التطبيق، بيانات الشركة، والتحكم في عناصر الواجهة.

---

## إعداد قاعدة البيانات والتثبيت

يعتمد هذا التطبيق على Supabase. لتشغيله، ستحتاج إلى إعداد مشروع Supabase وإنشاء الجداول التالية.

### 1. إعداد مشروع Supabase

1.  اذهب إلى [supabase.com](https://supabase.com/) وأنشئ مشروعاً جديداً.
2.  بمجرد إنشاء المشروع، اذهب إلى `Project Settings` > `API`.
3.  انسخ **Project URL** و **anon public key**.
4.  الصق هذه القيم في ملف `src/utils/supabaseClient.ts`.

### 2. مخطط قاعدة البيانات (SQL Schema)

اذهب إلى `SQL Editor` في لوحة تحكم Supabase وقم بتنفيذ الأوامر التالية لإنشاء الجداول اللازمة.

```sql
-- جدول المستخدمين (يتم ربطه تلقائيًا بـ auth.users)
CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول المنتجات
CREATE TABLE public.products (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true
);

-- جدول السائقين
CREATE TABLE public.drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- جدول المناطق
CREATE TABLE public.regions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  diesel_liter_price NUMERIC NOT NULL,
  diesel_liters NUMERIC NOT NULL,
  zaitri_fee NUMERIC NOT NULL
);

-- جدول أسعار المنتجات (يربط المنتجات بالمناطق)
CREATE TABLE public.product_prices (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  UNIQUE(region_id, product_id)
);

-- جدول الشحنات الرئيسي
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

-- جدول المنتجات داخل الشحنة
CREATE TABLE public.shipment_products (
  id SERIAL PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL, -- To preserve name at time of creation
  carton_count INTEGER NOT NULL,
  product_wage_price NUMERIC
);

-- جدول الإشعارات
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

### 3. أمان على مستوى الصف (Row Level Security)

لضمان أمان البيانات، يجب تفعيل RLS على جميع الجداول. إليك بعض الأمثلة الأساسية:

-   **لجدول `users`:** اسمح للمستخدمين بقراءة بياناتهم فقط.
-   **لبقية الجداول:** اسمح لجميع المستخدمين المسجلين (authenticated) بقراءة جميع البيانات، وتقييد عمليات الكتابة (insert, update, delete) بناءً على دور المستخدم إذا لزم الأمر.

---
created with ❤️ by Faris and AI
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
  - Add deduction values (damaged goods, shortages, road expenses).
  - Forward the shipment to the Admin for final approval (with auto-recalculation to ensure price accuracy).
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
