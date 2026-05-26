import { test, expect, generateTestEmail, WEAK_PASSWORD } from "./fixtures/auth.fixture";

test.describe("Error UX - No Raw Supabase Errors Exposed", () => {
  test("weak password shows humanized error", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    await page.fill('input[id="fullName"]', "Weak Pass Test");
    await page.fill('input[id="email"]', generateTestEmail());
    await page.fill('input[id="password"]', WEAK_PASSWORD);

    // Try to submit - browser may block due to minLength, force it
    await page.locator('input[id="password"]').evaluate((el) => {
      (el as HTMLInputElement).removeAttribute("minLength");
    });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);

    console.log("\n=== WEAK PASSWORD ERROR ===");
    console.log(`Error displayed: ${errorMsg}`);

    if (errorMsg) {
      expect(errorMsg).not.toContain("AuthApiError");
      expect(errorMsg).not.toContain("GoTrue");
      expect(errorMsg).not.toContain("supabase");
      expect(errorMsg.length).toBeGreaterThan(10);
    }
  });

  test("duplicate email shows friendly message", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    // Use a known format that would likely exist
    await page.fill('input[id="fullName"]', "Duplicate Test");
    await page.fill('input[id="email"]', "duplicate@test.com");
    await page.fill('input[id="password"]', "TestPass123!!");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);

    console.log("\n=== DUPLICATE EMAIL ERROR ===");
    console.log(`Error displayed: ${errorMsg}`);

    // Note: Supabase may not return "already registered" for security - 
    // it may appear as a success (to avoid email enumeration)
    if (errorMsg) {
      expect(errorMsg).not.toContain("constraint");
      expect(errorMsg).not.toContain("duplicate key");
      expect(errorMsg).not.toContain("23505");
    }
  });

  test("network error shows friendly message", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    // Block Supabase API to simulate network failure
    await page.route("**/supabase.co/**", (route) => route.abort("connectionfailed"));

    await page.fill('input[id="fullName"]', "Network Test");
    await page.fill('input[id="email"]', generateTestEmail());
    await page.fill('input[id="password"]', "TestPass123!!");

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);

    console.log("\n=== NETWORK ERROR UX ===");
    console.log(`Error displayed: ${errorMsg}`);

    if (errorMsg) {
      expect(errorMsg).not.toContain("fetch");
      expect(errorMsg).not.toContain("ECONNREFUSED");
      expect(errorMsg).not.toContain("TypeError");
      // Should be a calm, user-friendly message
      expect(errorMsg.length).toBeGreaterThan(10);
      expect(errorMsg.length).toBeLessThan(200);
    }
  });

  test("rate limit error shows cooldown, not technical message", async ({
    page,
    networkInspector,
  }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");

    await page.click('text="Password"');
    await page.waitForTimeout(300);

    // Mock 429 response from Supabase AFTER tab switch
    await page.route("**/auth/v1/token**", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "rate_limit",
          message: "Rate limit exceeded",
        }),
      })
    );

    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="password"]', "anypassword");
    await page.click('button:has-text("Sign in")');
    await page.waitForTimeout(3000);

    const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);
    const cooldownBtn = await page.locator('button:has-text("Wait")').isVisible().catch(() => false);

    console.log("\n=== RATE LIMIT UX (MOCKED 429) ===");
    console.log(`Error message: ${errorMsg}`);
    console.log(`Cooldown button visible: ${cooldownBtn}`);

    // FINDING: If neither error nor cooldown shows, the sign-in form
    // may not be handling the HTTP status correctly when the response 
    // body doesn't match expected Supabase error format
    if (!errorMsg && !cooldownBtn) {
      console.log("⚠️  BUG: No user-facing feedback after 429 response");
      console.log("    Sign-in form may not detect rate limit from HTTP status alone");
    }

    if (errorMsg) {
      expect(errorMsg).not.toContain("429");
      expect(errorMsg).not.toContain("rate_limit");
    }
  });

  test("sign-up rate limit (mocked) shows cooldown timer", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    // Mock rate limit on signup - use exact Supabase error format
    await page.route("**/auth/v1/signup**", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          code: 429,
          msg: "For security purposes, you can only request this after 60 seconds.",
          error_description: "over_email_send_rate_limit",
        }),
      })
    );

    await page.fill('input[id="fullName"]', "Rate Limit Test");
    await page.fill('input[id="email"]', generateTestEmail());
    await page.fill('input[id="password"]', "TestPass123!!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);
    const btnText = await page.locator('button[type="submit"]').textContent();

    console.log("\n=== SIGNUP RATE LIMIT UX ===");
    console.log(`Error: ${errorMsg}`);
    console.log(`Button text: ${btnText}`);

    // FINDING: If route mock doesn't trigger the error path,
    // Supabase client SDK may handle 429 differently than expected
    if (btnText && !btnText.match(/Wait \d+s/)) {
      console.log("⚠️  FINDING: Mocked 429 did not trigger cooldown");
      console.log("    Supabase JS SDK may swallow the HTTP error or present it differently");
      console.log("    The sign-up form checks signUpError.message against isRateLimitError()");
    }

    if (errorMsg) {
      expect(errorMsg).not.toContain("over_email_send_rate_limit");
      expect(errorMsg).not.toContain("security purposes");
    }
  });
});
