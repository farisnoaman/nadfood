# Supabase Edge Function Deployment Guide

## Edge Function: admin-change-user-password

This Edge Function allows administrators to change user passwords securely using Supabase Admin API.

### Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase Service Role Key**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the `service_role` key (keep it secret!)

### Deployment Steps

1. **Login to Supabase CLI**
   ```bash
   supabase login
   ```

2. **Link your project**
   ```bash
   supabase link --project-ref kjvzhzbxspgvvmktjwdi
   ```

3. **Set the Service Role Key as a secret**
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

4. **Deploy the Edge Function**
   ```bash
   supabase functions deploy admin-change-user-password
   ```

5. **Verify deployment**
   ```bash
   supabase functions list
   ```

### Environment Variables

The Edge Function requires these environment variables (automatically available):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (must be set as secret)

### Testing the Function

You can test the function using curl:

```bash
curl -i --location --request POST 'https://kjvzhzbxspgvvmktjwdi.supabase.co/functions/v1/admin-change-user-password' \
  --header 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"user-uuid-here","newPassword":"newpassword123"}'
```

### Security Notes

- Only users with Admin role can call this function
- The service role key must be kept secret and never exposed to client-side code
- Password must be at least 6 characters (Supabase default requirement)
- All requests are authenticated and authorized before execution

### Troubleshooting

**Function not found:**
- Ensure the function is deployed: `supabase functions list`
- Check your project reference is correct

**Permission denied:**
- Verify the service role key is set correctly
- Ensure the calling user has Admin role in the users table

**CORS errors:**
- The function includes CORS headers for all origins
- Update `_shared/cors.ts` if you need to restrict origins

### Local Development

To test the function locally:

```bash
# Start Supabase locally
supabase start

# Serve the function
supabase functions serve admin-change-user-password --env-file .env.local

# Test it
curl -i --location --request POST 'http://localhost:54321/functions/v1/admin-change-user-password' \
  --header 'Authorization: Bearer YOUR_LOCAL_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"user-uuid","newPassword":"test123"}'
```

### Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Admin API Docs](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid)
