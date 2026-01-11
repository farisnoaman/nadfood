// Admin Update User Edge Function
// Allows admin users to update user details (username, role)

import {
  corsHeaders,
  ADMIN_ROLE,
  createUserClient,
  createAdminClient,
  verifyAuth,
  verifyAdminRole,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
  validateUUID,
  validateUsername,
  validateRole,
  checkRateLimit,
  logExecution
} from '../_shared.ts';

Deno.serve(async (req) => {
  const functionName = 'admin-update-user';
  logExecution(functionName, 'Function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifyAuth(authHeader);
    if (authResult.error) {
      logExecution(functionName, `Auth failed: ${authResult.error}`);
      return createErrorResponse(authResult.error, authResult.status);
    }

    const { user, supabaseClient } = authResult;

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      logExecution(functionName, `Rate limit exceeded for user: ${user.id}`);
      return createErrorResponse('تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.', 429);
    }

    // Verify admin role
    const roleResult = await verifyAdminRole(user.id, supabaseClient);
    if (roleResult.error) {
      logExecution(functionName, `Role verification failed: ${roleResult.error}`);
      return createErrorResponse(roleResult.error, roleResult.status);
    }

    logExecution(functionName, `Admin access granted for user: ${user.id}`);

    // Parse request body
    const { userId, username, role } = await req.json();

    if (!userId) {
      logExecution(functionName, 'Missing userId parameter');
      return createErrorResponse('معرف المستخدم مطلوب', 400);
    }

    // Validate userId format
    const uuidValidation = validateUUID(userId);
    if (uuidValidation.error) {
      logExecution(functionName, `UUID validation failed: ${uuidValidation.error}`);
      return createErrorResponse(uuidValidation.error, 400);
    }

    // Prepare updates object
    const updates: any = {};
    if (username !== undefined) {
      const usernameValidation = validateUsername(username);
      if (usernameValidation.error) {
        logExecution(functionName, `Username validation failed: ${usernameValidation.error}`);
        return createErrorResponse(usernameValidation.error, 400);
      }
      updates.username = username.trim();
    }
    if (role !== undefined) {
      const roleValidation = validateRole(role);
      if (roleValidation.error) {
        logExecution(functionName, `Role validation failed: ${roleValidation.error}`);
        return createErrorResponse('الدور المحدد غير صحيح', 400);
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      logExecution(functionName, 'No valid updates provided');
      return createErrorResponse('لا توجد تحديثات صحيحة', 400);
    }

    logExecution(functionName, `Attempting to update user: ${userId} with data: ${JSON.stringify(updates)}`);

    // Create admin client for database operations (bypasses RLS)
    const supabaseAdmin = createAdminClient();

    // Update user in users table
    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      logExecution(functionName, `User update failed: ${error.message}`);
      return createErrorResponse(`فشل في تحديث المستخدم: ${error.message}`);
    }

    logExecution(functionName, `User updated successfully: ${userId}`);

    return createSuccessResponse({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      updatedUserId: userId
    });

  } catch (error) {
    logExecution(functionName, `Unexpected error: ${error.message}`);
    return createErrorResponse('حدث خطأ غير متوقع في تحديث المستخدم');
  }
});