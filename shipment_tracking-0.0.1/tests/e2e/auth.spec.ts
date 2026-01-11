import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should allow user to login successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    // Check if we're on the login page
    await expect(page).toHaveURL(/.*login/)

    // Fill in login credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Click login button
    await page.click('button[type="submit"]')

    // Should redirect to dashboard (assuming login succeeds)
    await expect(page).toHaveURL(/.*\/$/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Click login button
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=خطأ في تسجيل الدخول')).toBeVisible()
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access a protected route directly
    await page.goto('/fleet')

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
  })
})

test.describe('Company Signup Flow', () => {
  test('should complete company signup process', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')

    // Step 1: Company Information
    await page.fill('input[placeholder*="اسم الشركة"]', 'شركة النقل الجديدة')
    await page.fill('input[placeholder*="example-company"]', 'new-transport-company')

    // Select admin name
    await page.fill('input[placeholder*="أحمد محمد"]', 'محمد أحمد')

    // Next step
    await page.click('text=التالي')

    // Step 2: Admin Account
    await page.fill('input[type="email"]', 'admin@newcompany.test')
    await page.fill('input[placeholder*="اختر كلمة مرور قوية"]', 'SecurePass123!')
    await page.fill('input[placeholder*="أعد إدخال كلمة المرور"]', 'SecurePass123!')

    // Next step
    await page.click('text=التالي')

    // Step 3: Plan Selection
    await page.click('text=احترافي') // Select professional plan

    // Complete signup
    await page.click('text=إنشاء الشركة')

    // Should show success message and redirect
    await expect(page.locator('text=تم إنشاء الشركة بنجاح')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/signup')

    // Try to proceed without filling required fields
    await page.click('text=التالي')

    // Should show validation error
    await expect(page.locator('text=يرجى إكمال جميع الحقول المطلوبة')).toBeVisible()
  })
})

test.describe('Password Reset Flow', () => {
  test('should send password reset email', async ({ page }) => {
    await page.goto('/reset-password')

    // Fill email
    await page.fill('input[type="email"]', 'user@example.com')

    // Submit
    await page.click('text=إرسال رابط إعادة التعيين')

    // Should show success message
    await expect(page.locator('text=تم إرسال رابط إعادة التعيين')).toBeVisible()
  })

  test('should allow password reset with valid token', async ({ page }) => {
    // Simulate accessing reset link with token
    await page.goto('/reset-password/confirm?token=valid-reset-token')

    // Fill new password
    await page.fill('input[placeholder*="اختر كلمة مرور قوية"]', 'NewSecurePass123!')
    await page.fill('input[placeholder*="أعد إدخال كلمة المرور"]', 'NewSecurePass123!')

    // Submit
    await page.click('text=تعيين كلمة المرور الجديدة')

    // Should show success and redirect to login
    await expect(page.locator('text=تم إعادة تعيين كلمة المرور بنجاح')).toBeVisible()
  })
})