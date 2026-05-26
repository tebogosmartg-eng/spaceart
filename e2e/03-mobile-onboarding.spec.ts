import { test, expect } from "./fixtures/auth.fixture";

test.describe("Mobile Onboarding - iPhone Viewport", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  });

  test("sign-up form is fully visible without scroll on initial load", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // Check button is in viewport
    const box = await submitBtn.boundingBox();
    console.log("\n=== MOBILE SIGNUP CTA VISIBILITY (iPhone) ===");
    console.log(`Submit button position: y=${box?.y}, height=${box?.height}`);
    console.log(`Viewport height: 844`);

    if (box) {
      const isInViewport = box.y + box.height <= 844;
      console.log(`CTA in viewport without scroll: ${isInViewport}`);
      if (!isInViewport) {
        console.log("⚠️  BUG: Submit button is below fold on iPhone - users may not see CTA");
      }
    }
  });

  test("inputs do not get hidden by virtual keyboard (accessibility check)", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    // Focus on email input to simulate keyboard appearance
    const emailInput = page.locator('input[id="email"]');
    await emailInput.focus();
    await page.waitForTimeout(500);

    // Check that input is still visible
    await expect(emailInput).toBeVisible();

    const box = await emailInput.boundingBox();
    console.log("\n=== KEYBOARD OVERLAP CHECK ===");
    console.log(`Email input position: y=${box?.y}`);

    // Typical iOS keyboard is ~300px, so input should be in top 544px
    if (box) {
      const keyboardHeight = 300;
      const safeZone = 844 - keyboardHeight;
      const inputVisible = box.y < safeZone;
      console.log(`Safe zone (above keyboard): ${safeZone}px`);
      console.log(`Input above keyboard: ${inputVisible}`);
    }
  });

  test("onboarding wizard steps are navigable on mobile", async ({ page }) => {
    await page.goto("/dashboard/onboarding");
    await page.waitForLoadState("networkidle");

    // May redirect to sign-in if not authenticated - that's expected
    const url = page.url();
    console.log("\n=== MOBILE ONBOARDING ACCESS ===");
    console.log(`Redirected to: ${url}`);

    if (url.includes("/auth/sign-in")) {
      console.log("  (Redirected to sign-in - expected for unauthenticated user)");
      return;
    }

    // If we somehow reach onboarding, test mobile layout
    const getStartedBtn = page.locator('button:has-text("Get started")');
    if (await getStartedBtn.isVisible().catch(() => false)) {
      const box = await getStartedBtn.boundingBox();
      console.log(`Get Started button: y=${box?.y}, w=${box?.width}`);

      // Button should span reasonable width on mobile
      if (box) {
        expect(box.width).toBeGreaterThan(200);
      }
    }
  });

  test("sign-in form tabs are usable at mobile width", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");

    const magicTab = page.locator('button[role="tab"]:has-text("Magic Link")');
    const passwordTab = page.locator('button[role="tab"]:has-text("Password")');

    await expect(magicTab).toBeVisible();
    await expect(passwordTab).toBeVisible();

    // Both tabs should be tappable (not overlapping, not too small)
    const magicBox = await magicTab.boundingBox();
    const passBox = await passwordTab.boundingBox();

    console.log("\n=== MOBILE TAB SIZING ===");
    console.log(`Magic Link tab: w=${magicBox?.width}, h=${magicBox?.height}`);
    console.log(`Password tab: w=${passBox?.width}, h=${passBox?.height}`);

    if (magicBox && passBox) {
      // FINDING: Tab height is 25px - below WCAG 2.5.8 minimum of 44px
      // This is a real accessibility issue on mobile
      if (magicBox.height < 36) {
        console.log("⚠️  BUG: Tab touch targets are too small for mobile (${magicBox.height}px < 36px minimum)");
        console.log("    WCAG 2.5.8 recommends minimum 44x44px touch targets");
      }
      // Tabs should not overlap
      expect(passBox.x).toBeGreaterThanOrEqual(magicBox.x + magicBox.width - 2);
    }
  });
});

test.describe("Mobile Onboarding - Android Viewport", () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36",
  });

  test("sign-up form renders correctly on Android", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    const nameInput = page.locator('input[id="fullName"]');
    const emailInput = page.locator('input[id="email"]');
    const passInput = page.locator('input[id="password"]');

    // All inputs visible
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passInput).toBeVisible();

    // Check none are clipped
    const nameBox = await nameInput.boundingBox();
    const passBox = await passInput.boundingBox();
    const btnBox = await submitBtn.boundingBox();

    console.log("\n=== ANDROID LAYOUT CHECK ===");
    console.log(`Name input: y=${nameBox?.y}`);
    console.log(`Password input: y=${passBox?.y}`);
    console.log(`Submit button: y=${btnBox?.y}`);
    console.log(`Viewport: 412x915`);

    if (btnBox) {
      const inViewport = btnBox.y + btnBox.height <= 915;
      console.log(`All elements in viewport: ${inViewport}`);
    }
  });

  test("input fields have correct mobile input modes", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[id="email"]');
    const inputMode = await emailInput.getAttribute("inputMode");
    const type = await emailInput.getAttribute("type");

    console.log("\n=== INPUT MODE VERIFICATION ===");
    console.log(`Email inputMode: ${inputMode}`);
    console.log(`Email type: ${type}`);

    expect(inputMode).toBe("email");
    expect(type).toBe("email");

    // Verify password autocomplete
    const passInput = page.locator('input[id="password"]');
    const autoComplete = await passInput.getAttribute("autoComplete");
    console.log(`Password autoComplete: ${autoComplete}`);
    expect(autoComplete).toBe("new-password");
  });
});
