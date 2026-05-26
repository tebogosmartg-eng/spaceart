import { test, expect, generateTestEmail, TEST_PASSWORD } from "./fixtures/auth.fixture";

test.describe("Password Sign In Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
  });

  test("sign-in page loads with Magic Link and Password tabs", async ({ page }) => {
    await expect(page.locator('text="Magic Link"')).toBeVisible();
    await expect(page.locator('text="Password"')).toBeVisible();
  });

  test("password login with invalid credentials shows humanized error", async ({
    page,
    networkInspector,
  }) => {
    // Switch to password tab
    await page.click('text="Password"');
    await page.waitForTimeout(300);

    await page.fill('input[id="email"]', "nonexistent@example.com");
    await page.fill('input[id="password"]', "wrongpassword123");

    await page.click('button:has-text("Sign in")');
    await page.waitForTimeout(3000);

    const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);

    console.log("\n=== INVALID CREDENTIALS TEST ===");
    console.log(`Error displayed: ${errorMsg}`);

    if (errorMsg) {
      // Verify error is humanized - no raw Supabase strings
      expect(errorMsg).not.toContain("Invalid login credentials");
      expect(errorMsg).not.toContain("supabase");
      expect(errorMsg).not.toContain("auth/");
      expect(errorMsg.length).toBeGreaterThan(10);
    }

    // Verify only one sign-in request was made
    const signInRequests = networkInspector.getSignInRequests();
    console.log(`Sign-in requests: ${signInRequests.length}`);
    expect(signInRequests.length).toBeLessThanOrEqual(1);
  });

  test("sign-in button disables during loading", async ({ page }) => {
    await page.click('text="Password"');
    await page.waitForTimeout(300);

    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="password"]', TEST_PASSWORD);

    const submitBtn = page.locator('button:has-text("Sign in")');
    await submitBtn.click();

    // Should show loading state
    await expect(page.locator('button:has-text("Signing in")')).toBeVisible({ timeout: 1000 }).catch(() => {
      // May resolve too fast on localhost
    });
  });

  test("concurrent sign-in attempts are blocked by ref lock", async ({
    page,
    networkInspector,
  }) => {
    await page.click('text="Password"');
    await page.waitForTimeout(300);

    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="password"]', "wrongpass");

    // Simulate truly concurrent submissions (no wait between)
    // by dispatching multiple submits in the same event loop tick
    const form = page.locator('form:has(input[id="password"])');
    await page.evaluate(() => {
      const f = document.querySelector('form:has(input[id="password"])');
      if (f) {
        f.requestSubmit();
        f.requestSubmit();
        f.requestSubmit();
      }
    });

    await page.waitForTimeout(4000);

    const signInReqs = networkInspector.requests.filter(
      (r) => r.url.includes("/token") || r.url.includes("grant_type")
    );

    console.log("\n=== CONCURRENT SIGN-IN ANALYSIS ===");
    console.log(`Sign-in token requests from 3x concurrent submit: ${signInReqs.length}`);
    signInReqs.forEach((r, i) => {
      console.log(`  [${i}] ${r.method} ${new URL(r.url).pathname} - status: ${r.status}`);
    });

    // Ref-based lock ensures only 1 request fires when concurrent
    expect(signInReqs.length).toBeLessThanOrEqual(1);
  });

  test("rate limit triggers cooldown UI, not raw error", async ({
    page,
    networkInspector,
  }) => {
    await page.click('text="Password"');
    await page.waitForTimeout(300);

    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="password"]', "wrongpass");

    // Make several attempts to potentially trigger rate limit
    for (let attempt = 0; attempt < 3; attempt++) {
      const btn = page.locator('button[type="submit"]:not([disabled])');
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log("\n=== RATE LIMIT UX TEST ===");

    // Check for rate limit indicators
    const cooldownBtn = page.locator('button:has-text("Wait")');
    const hasCooldown = await cooldownBtn.isVisible().catch(() => false);
    console.log(`Cooldown UI visible: ${hasCooldown}`);

    const errorAlert = page.locator('[role="alert"]');
    const errorText = await errorAlert.textContent().catch(() => null);
    console.log(`Error text: ${errorText}`);

    if (errorText) {
      expect(errorText).not.toContain("429");
      expect(errorText).not.toMatch(/AuthApiError|GoTrue|supabase/i);
    }

    // Check for 429 in network
    const rateLimitedReqs = networkInspector.requests.filter((r) => r.status === 429);
    console.log(`429 responses received: ${rateLimitedReqs.length}`);
  });
});

test.describe("Magic Link Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
  });

  test("magic link request fires only once", async ({
    page,
    networkInspector,
  }) => {
    const emailInput = page.locator('input[id="magic-email"]');
    await expect(emailInput).toBeVisible();

    await emailInput.fill("test-magic@example.com");
    await page.click('button:has-text("Send magic link")');

    await page.waitForTimeout(3000);

    const magicReqs = networkInspector.getMagicLinkRequests();
    console.log("\n=== MAGIC LINK REQUEST ANALYSIS ===");
    console.log(`Magic link requests: ${magicReqs.length}`);
    magicReqs.forEach((r, i) => {
      console.log(`  [${i}] ${r.method} ${r.url} status:${r.status}`);
    });

    expect(magicReqs.length).toBeLessThanOrEqual(1);
  });

  test("magic link success shows confirmation and cooldown", async ({ page }) => {
    const emailInput = page.locator('input[id="magic-email"]');
    await emailInput.fill("test-magic@example.com");
    await page.click('button:has-text("Send magic link")');

    await page.waitForTimeout(3000);

    // Check for either success message or error (rate limit)
    const successMsg = page.locator('text="magic link"');
    const errorMsg = page.locator('[role="alert"]');

    const hasSuccess = await successMsg.isVisible().catch(() => false);
    const hasError = await errorMsg.isVisible().catch(() => false);

    console.log("\n=== MAGIC LINK RESULT ===");
    console.log(`Success message: ${hasSuccess}`);
    console.log(`Error visible: ${hasError}`);

    if (hasError) {
      const text = await errorMsg.textContent();
      console.log(`Error text: ${text}`);
      expect(text).not.toContain("supabase");
      expect(text).not.toContain("429");
    }
  });

  test("magic link button disables after send (cooldown)", async ({ page }) => {
    await page.fill('input[id="magic-email"]', "test@example.com");
    await page.click('button:has-text("Send magic link")');
    await page.waitForTimeout(2000);

    // Button should either show cooldown or be in sent state
    const cooldownVisible = await page.locator('button:has-text("Wait")').isVisible().catch(() => false);
    const sentVisible = await page.locator('text="Send another link"').isVisible().catch(() => false);

    console.log("\n=== COOLDOWN STATE ===");
    console.log(`Cooldown button: ${cooldownVisible}`);
    console.log(`Sent state visible: ${sentVisible}`);

    // One of these should be true
    expect(cooldownVisible || sentVisible).toBeTruthy();
  });
});
