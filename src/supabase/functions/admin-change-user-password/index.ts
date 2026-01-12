// Admin Change User Password Edge Function
// Allows admin users to change any user's password

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
  validatePassword,
  validateUUID,
  validateCSRF,
  checkRateLimit,
  logExecution
} from '../_shared.ts';

Deno.serve(async (req) => {
  const functionName = 'admin-change-user-password';
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

    // Validate CSRF token
    if (!validateCSRF(req)) {
      logExecution(functionName, 'CSRF validation failed');
      return createErrorResponse('Invalid CSRF token', 403);
    }

    // Verify admin role
    const roleResult = await verifyAdminRole(user.id, supabaseClient);
    if (roleResult.error) {
      logExecution(functionName, `Role verification failed: ${roleResult.error}`);
      return createErrorResponse(roleResult.error, roleResult.status);
    }

    logExecution(functionName, `Admin access granted for user: ${user.id}`);

    // Parse request body
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      logExecution(functionName, 'Missing required parameters');
      return createErrorResponse('Missing userId or newPassword', 400);
    }

    // Validate userId format
    const uuidValidation = validateUUID(userId);
    if (uuidValidation.error) {
      logExecution(functionName, `UUID validation failed: ${uuidValidation.error}`);
      return createErrorResponse(uuidValidation.error, 400);
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation.error) {
      logExecution(functionName, `Password validation failed: ${passwordValidation.error}`);
      return createErrorResponse(passwordValidation.error, 400);
    }

    // Create admin client for password update
    const supabaseAdmin = createAdminClient();

    logExecution(functionName, `Attempting to update password for user: ${userId}`);

    // Update the user's password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      logExecution(functionName, `Password update failed: ${error.message}`);
      return createErrorResponse(`Failed to update password: ${error.message}`);
    }

    logExecution(functionName, `Password updated successfully for user: ${userId}`);

    return createSuccessResponse({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح',
      userId: userId
    });

  } catch (error) {
    logExecution(functionName, `Unexpected error: ${error.message}`);
    return createErrorResponse('حدث خطأ غير متوقع في تحديث كلمة المرور');
  }
});