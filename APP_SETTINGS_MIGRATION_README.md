# App Settings Database Migration

This document explains how to deploy the new app settings database functionality.

## Overview

The application settings (company name, address, phone, logo, etc.) have been moved from local browser storage (IndexedDB) to the Supabase database for better synchronization across devices and centralized management.

## Deployment Steps

### 1. Run Database Migration

Execute the SQL migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of: supabase/migrations/1764025828_add_app_settings_table.sql
```

This will:
- Create the `app_settings` table
- Set up Row Level Security (RLS) policies for admin-only access
- Insert default settings
- Create triggers for automatic timestamp updates

### 2. Generate Database Types (Optional)

If you have Supabase CLI set up, regenerate the database types:

```bash
npx supabase gen types typescript --local > supabase/database.types.ts
```

### 3. Deploy Application

Deploy the updated application code. The migration script will automatically run when an admin first accesses the settings page, migrating any existing local settings to the database.

## Features

### ✅ Centralized Settings
- Settings are now stored in Supabase database
- Sync across all devices and browsers
- Admin-only access control via RLS policies

### ✅ Backward Compatibility
- Automatic migration of existing IndexedDB settings
- Fallback to IndexedDB for offline access
- No data loss during transition

### ✅ Enhanced Security
- Row Level Security ensures only admins can access settings
- Database-level access control

## Settings Included

- `appName`: Application name
- `companyName`: Company name
- `companyAddress`: Company address
- `companyPhone`: Company phone number
- `companyLogo`: Company logo URL
- `isPrintHeaderEnabled`: Enable/disable print headers
- `accountantPrintAccess`: Allow accountants to print reports
- `isTimeWidgetVisible`: Show/hide time widget

## Testing

1. Access admin settings page
2. Modify any setting
3. Refresh the page - settings should persist
4. Check printed reports - company header should appear correctly
5. Test on different devices/browsers - settings should sync

## Troubleshooting

### Settings not loading
- Check browser console for errors
- Verify user has admin role
- Ensure database migration was applied

### Migration not running
- Check browser console for migration errors
- Verify IndexedDB is accessible
- Try clearing browser data and re-login

### Print headers not appearing
- Verify `isPrintHeaderEnabled` is set to `true`
- Check that company details are properly set
- Ensure logo URL is accessible (if provided)