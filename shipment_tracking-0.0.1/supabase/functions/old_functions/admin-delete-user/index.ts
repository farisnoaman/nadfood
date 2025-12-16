// Admin Delete User Edge Function
// Allows admin users to delete users completely

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
  logExecution
} from '../_shared.ts';

Deno.serve(async (req) => {
  const functionName = 'admin-delete-user';
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

    // Verify admin role
    const roleResult = await verifyAdminRole(user.id, supabaseClient);
    if (roleResult.error) {
      logExecution(functionName, `Role verification failed: ${roleResult.error}`);
      return createErrorResponse(roleResult.error, roleResult.status);
    }

    logExecution(functionName, `Admin access granted for user: ${user.id}`);

    // Parse request body
    const { userId } = await req.json();

    if (!userId) {
      logExecution(functionName, 'Missing userId parameter');
      return createErrorResponse('معرف المستخدم مطلوب', 400);
    }

    // Prevent self-deletion
    if (userId === user.id) {
      logExecution(functionName, 'Attempted self-deletion blocked');
      return createErrorResponse('لا يمكنك حذف حسابك الخاص', 400);
    }

    // Create admin client for deletion
    const supabaseAdmin = createAdminClient();

    logExecution(functionName, `Attempting to delete user: ${userId}`);

    // Delete from users table first
    const { error: deleteProfileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      logExecution(functionName, `Profile deletion failed: ${deleteProfileError.message}`);
      return createErrorResponse(`فشل في حذف الملف الشخصي: ${deleteProfileError.message}`);
    }

    // Delete from auth.users
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      logExecution(functionName, `Auth deletion failed: ${deleteAuthError.message}`);
      return createErrorResponse(`فشل في حذف المستخدم من النظام: ${deleteAuthError.message}`);
    }

    logExecution(functionName, `User deleted successfully: ${userId}`);

    return createSuccessResponse({
      success: true,
      message: 'تم حذف المستخدم بنجاح',
      deletedUserId: userId
    });

  } catch (error) {
    logExecution(functionName, `Unexpected error: ${error.message}`);
    return createErrorResponse('حدث خطأ غير متوقع في حذف المستخدم');
  }
});