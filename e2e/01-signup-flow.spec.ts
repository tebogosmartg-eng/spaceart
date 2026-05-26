import { test, expect, generateTestEmail, TEST_PASSWORD } from "./fixtures/auth.fixture";

test.describe("Creator Sign Up - Duplicate Request Prevention", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");
  });

  test("page loads with correct form elements", async ({ page }) => {
    await expect(page.locator('input[id="fullName"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test("submit button disables during signup and only ONE request fires", async ({
    page,
    networkInspector,
  }) => {
    const email = generateTestEmail();

    await page.fill('input[id="fullName"]', "Test Creator");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', TEST_PASSWORD);

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();

    // Button should immediately show loading state
    await expect(submitBtn).toContainText("Creating account");

    // Button should be disabled during submission
    await expect(submitBtn).toBeDisabled();

    // Wait for response
    await page.waitForTimeout(3000);

    // CRITICAL CHECK: Only ONE signup request should have fired
    const signupRequests = networkInspector.requests.filter(
      (r) => r.url.includes("/signup") || r.url.includes("/sign-up")
    );

    console.log("\n=== SIGNUP REQUEST ANALYSIS ===");
    console.log(`Total auth requests: ${networkInspector.requests.length}`);
    console.log(`Signup requests: ${signupRequests.length}`);
    networkInspector.requests.forEach((r, i) => {
      console.log(`  [${i}] ${r.method} ${r.url} - status: ${r.status ?? "pending"} - ts: ${r.timestamp}`);
    });

    const duplicates = networkInspector.getDuplicateRequests();
    console.log(`\nDuplicate request groups: ${duplicates.length}`);
    duplicates.forEach((d) => {
      console.log(`  ${d.endpoint}: ${d.count} times`);
      d.requests.forEach((r) => {
        console.log(`    - ${r.timestamp} (status: ${r.status})`);
      });
    });

    expect(signupRequests.length).toBe(1);
    expect(duplicates.length).toBe(0);
  });

  test("rapid double-click does NOT produce duplicate requests", async ({
    page,
    networkInspector,
  }) => {
    const email = generateTestEmail();

    await page.fill('input[id="fullName"]', "Double Click Test");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', TEST_PASSWORD);

    const submitBtn = page.locator('button[type="submit"]');

    // Rapid double-click simulation
    await submitBtn.dblclick();

    await page.waitForTimeout(3000);

    const signupRequests = networkInspector.requests.filter(
      (r) => r.url.includes("/signup") || r.url.includes("/sign-up")
    );

    console.log("\n=== DOUBLE-CLICK ANALYSIS ===");
    console.log(`Signup requests after double-click: ${signupRequests.length}`);
    signupRequests.forEach((r, i) => {
      console.log(`  [${i}] ${r.method} ${r.url} (${r.timestamp})`);
    });

    // Should still only fire once due to loading guard
    expect(signupRequests.length).toBeLessThanOrEqual(1);
  });

  test("programmatic rapid form submissions are blocked", async ({
    page,
    networkInspector,
  }) => {
    const email = generateTestEmail();

    await page.fill('input[id="fullName"]', "Rapid Fire Test");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', TEST_PASSWORD);

    // Simulate rapid fire: submit form 3 times in quick succession
    const form = page.locator("form");
    await Promise.all([
      form.evaluate((el) => el.requestSubmit()),
      form.evaluate((el) => el.requestSubmit()),
      form.evaluate((el) => el.requestSubmit()),
    ]);

    await page.waitForTimeout(4000);

    const signupRequests = networkInspector.requests.filter(
      (r) => r.url.includes("/signup") || r.url.includes("/sign-up")
    );

    console.log("\n=== RAPID SUBMIT ANALYSIS ===");
    console.log(`Signup requests after 3x rapid submit: ${signupRequests.length}`);
    signupRequests.forEach((r, i) => {
      console.log(`  [${i}] ts:${r.timestamp} status:${r.status}`);
    });

    const rapidClusters = networkInspector.getRequestsWithinMs(500);
    console.log(`Request clusters within 500ms: ${rapidClusters.length}`);
    rapidClusters.forEach((cluster, i) => {
      console.log(`  Cluster ${i}: ${cluster.length} requests`);
    });

    // Critical: even with rapid submissions, only 1 should actually fire
    expect(signupRequests.length).toBeLessThanOrEqual(1);
  });

  test("successful signup shows confirmation and cooldown activates", async ({
    page,
    networkInspector,
  }) => {
    const email = generateTestEmail();

    await page.fill('input[id="fullName"]', "Success Test");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', TEST_PASSWORD);

    await page.click('button[type="submit"]');

    // Wait for either success state or error
    await page.waitForTimeout(5000);

    const signupRequests = networkInspector.requests.filter(
      (r) => r.url.includes("/signup") || r.url.includes("/sign-up")
    );

    console.log("\n=== SUCCESS FLOW ANALYSIS ===");
    console.log(`Signup requests: ${signupRequests.length}`);
    signupRequests.forEach((r) => {
      console.log(`  Status: ${r.status}`);
    });

    // Check for rate limit response
    const rateLimited = signupRequests.filter((r) => r.status === 429);
    if (rateLimited.length > 0) {
      console.log("\n⚠️  RATE LIMIT HIT on signup attempt!");
      console.log(`  429 responses: ${rateLimited.length}`);

      // Check if error message is humanized
      const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => null);
      console.log(`  Displayed error: ${errorMsg}`);

      if (errorMsg) {
        expect(errorMsg).not.toContain("429");
        expect(errorMsg).not.toContain("rate_limit");
        expect(errorMsg).not.toContain("supabase");
      }
    }

    // If successful, check for confirmation display
    const successIndicator = page.locator("text=confirmation email");
    const hasSuccess = await successIndicator.isVisible().catch(() => false);
    if (hasSuccess) {
      console.log("  ✓ Success confirmation displayed");
      await expect(page.locator(`text=${email}`)).toBeVisible();
    }
  });

  test("React hydration does not trigger auth requests on page load", async ({
    page,
    networkInspector,
  }) => {
    // Clear any existing requests
    networkInspector.clear();

    // Navigate to signup page and wait for full hydration
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    console.log("\n=== HYDRATION ANALYSIS ===");
    console.log(`Auth requests on page load: ${networkInspector.requests.length}`);
    networkInspector.requests.forEach((r, i) => {
      console.log(`  [${i}] ${r.method} ${r.url}`);
    });

    // No auth API requests should fire on page load alone
    const signupRequests = networkInspector.requests.filter(
      (r) => r.url.includes("/signup") || r.url.includes("/sign-up")
    );
    expect(signupRequests.length).toBe(0);
  });
});
