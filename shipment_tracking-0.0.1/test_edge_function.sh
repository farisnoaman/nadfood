#!/bin/bash

# Test the admin-change-user-password Edge Function

# This is a basic connectivity test - the actual test needs a valid user ID
curl -X POST \
  "https://kjvzhzbxspgvvmktjwdi.supabase.co/functions/v1/admin-change-user-password" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjYyMTQsImV4cCI6MjA3ODIwMjIxNH0.xc1wMNg_q23ZbNhUm6oyKbUw_298y0xG9B8YBU6j2VI" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id", "newPassword": "newpassword123"}' \
  2>&1
