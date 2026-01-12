# Real-time Features Security

## API Key Exposure Prevention

The application implements real-time features using Supabase's realtime service. To prevent unnecessary exposure of the API key in browser console logs, the following security measures are in place:

### Conditional Realtime Connections

Realtime WebSocket connections are only established when:
- User is fully authenticated
- User is online
- Realtime features are enabled via environment variable
- User has appropriate permissions (admin-only for settings changes)

### Environment Control

Set `VITE_ENABLE_REALTIME=false` in your environment variables to completely disable realtime features and prevent any API key exposure.

### Security Benefits

- **No API key exposure during login attempts**
- **Reduced unnecessary network connections**
- **Permission-based access to realtime features**
- **Environment-based control for different deployments**

### Technical Implementation

```typescript
// Only establish realtime when conditions are met
if (!enableRealtime || !currentUser || !isOnline) {
    return; // No WebSocket connection
}
```

This ensures that the Supabase API key is never exposed in WebSocket URLs during unauthorized or unnecessary connection attempts.