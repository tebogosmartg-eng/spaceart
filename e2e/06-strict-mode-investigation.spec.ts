import { test, expect } from "./fixtures/auth.fixture";

test.describe("React Strict Mode - Double Execution Investigation", () => {
  test("page load does not trigger duplicate auth state checks", async ({
    page,
    networkInspector,
  }) => {
    networkInspector.clear();

    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    // Wait extra time for any Strict Mode double-effects
    await page.waitForTimeout(3000);

    console.log("\n=== STRICT MODE: PAGE LOAD AUTH CALLS ===");
    console.log(`Auth requests on load: ${networkInspector.requests.length}`);
    networkInspector.requests.forEach((r, i) => {
      console.log(`  [${i}] ${r.method} ${new URL(r.url).pathname} (${r.timestamp})`);
    });

    // In dev mode with Strict Mode, effects fire twice.
    // If auth calls happen on mount, we'd see doubles.
    const sessionChecks = networkInspector.requests.filter(
      (r) => r.url.includes("/session") || r.url.includes("/user") || r.url.includes("/token")
    );
    console.log(`Session/user check requests: ${sessionChecks.length}`);

    if (sessionChecks.length > 1) {
      console.log("⚠️  STRICT MODE ISSUE: Multiple session checks detected on page load");
      console.log("    This suggests useEffect is calling auth APIs without cleanup/dedup");
    }
  });

  test("sign-in page does not fire duplicate session checks", async ({
    page,
    networkInspector,
  }) => {
    networkInspector.clear();

    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    console.log("\n=== STRICT MODE: SIGN-IN PAGE LOAD ===");
    console.log(`Auth requests: ${networkInspector.requests.length}`);
    networkInspector.requests.forEach((r, i) => {
      console.log(`  [${i}] ${r.method} ${new URL(r.url).pathname}`);
    });

    const duplicates = networkInspector.getDuplicateRequests();
    if (duplicates.length > 0) {
      console.log("\n⚠️  DUPLICATE REQUESTS DETECTED ON SIGN-IN LOAD:");
      duplicates.forEach((d) => {
        console.log(`  ${d.endpoint}: ${d.count} times`);
        const timeDiff = d.requests[d.requests.length - 1].timestamp - d.requests[0].timestamp;
        console.log(`  Time between first and last: ${timeDiff}ms`);
        if (timeDiff < 100) {
          console.log("  → Likely caused by React Strict Mode double-mounting");
        }
      });
    }
  });

  test("navigation between auth pages does not stack requests", async ({
    page,
    networkInspector,
  }) => {
    networkInspector.clear();

    // Navigate sign-up → sign-in → sign-up
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const afterFirstNav = networkInspector.requests.length;

    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const afterSecondNav = networkInspector.requests.length;

    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const afterThirdNav = networkInspector.requests.length;

    console.log("\n=== NAVIGATION REQUEST STACKING ===");
    console.log(`After /sign-up: ${afterFirstNav} requests`);
    console.log(`After /sign-in: ${afterSecondNav} requests`);
    console.log(`After /sign-up again: ${afterThirdNav} requests`);
    console.log(`Total accumulated: ${networkInspector.requests.length}`);

    // Each navigation should not add more than a reasonable number of auth calls
    // (0-1 session check per navigation is normal)
    const perNavAvg = networkInspector.requests.length / 3;
    console.log(`Average requests per navigation: ${perNavAvg.toFixed(1)}`);

    if (perNavAvg > 2) {
      console.log("⚠️  EXCESSIVE REQUESTS: More than 2 auth calls per navigation");
      console.log("    Possible causes: useEffect without cleanup, Strict Mode doubling");
    }
  });

  test("Supabase client is not recreated on every render", async ({
    page,
    networkInspector,
  }) => {
    networkInspector.clear();

    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Type in each field (each keystroke triggers re-render)
    await page.fill('input[id="fullName"]', "A");
    await page.waitForTimeout(100);
    await page.fill('input[id="fullName"]', "Ab");
    await page.waitForTimeout(100);
    await page.fill('input[id="fullName"]', "Abc");
    await page.waitForTimeout(100);

    await page.fill('input[id="email"]', "a");
    await page.waitForTimeout(100);
    await page.fill('input[id="email"]', "ab");
    await page.waitForTimeout(100);

    await page.waitForTimeout(2000);

    console.log("\n=== RE-RENDER AUTH CALL CHECK ===");
    console.log(`Auth requests during typing: ${networkInspector.requests.length}`);

    if (networkInspector.requests.length > 0) {
      console.log("⚠️  AUTH REQUESTS DURING TYPING - Supabase client may be misconfigured");
      networkInspector.requests.forEach((r, i) => {
        console.log(`  [${i}] ${r.method} ${new URL(r.url).pathname}`);
      });
    } else {
      console.log("  ✓ No spurious auth calls during input interactions");
    }

    expect(networkInspector.requests.length).toBe(0);
  });

  test("check if development mode has reactStrictMode enabled", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");

    // Check for React DevTools hook or __NEXT_DATA__
    const isStrictMode = await page.evaluate(() => {
      // Check for React 18+ Strict Mode indicators in dev
      const root = document.getElementById("__next");
      if (!root) return "unknown";
      // In React 18 dev with Strict Mode, components render twice
      // We can't directly detect it, but we can check the Next.js config
      const nextData = (window as any).__NEXT_DATA__;
      return {
        hasNextData: Boolean(nextData),
        buildId: nextData?.buildId,
        isDev: nextData?.runtimeConfig?.isDev ?? (nextData?.buildId === "development"),
      };
    });

    console.log("\n=== STRICT MODE CONFIGURATION ===");
    console.log(`Next.js data:`, JSON.stringify(isStrictMode, null, 2));
    console.log(`\nNote: Next.js enables React Strict Mode by default in development.`);
    console.log(`This means ALL useEffect hooks fire twice on mount.`);
    console.log(`If auth calls happen in useEffect without guards, they WILL double-fire.`);
  });
});
