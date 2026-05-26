import { test, expect, generateTestEmail, TEST_PASSWORD } from "./fixtures/auth.fixture";

test.describe("Network Inspection - Request Deduplication Analysis", () => {
  test("full signup flow network trace", async ({ page, networkInspector }) => {
    networkInspector.clear();
    const email = generateTestEmail();

    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const preSubmitRequests = networkInspector.requests.length;

    await page.fill('input[id="fullName"]', "Network Trace User");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for full round-trip
    await page.waitForTimeout(5000);

    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║  FULL SIGNUP FLOW - NETWORK TRACE            ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    console.log(`Pre-submit auth requests: ${preSubmitRequests}`);
    console.log(`Post-submit total requests: ${networkInspector.requests.length}`);
    console.log(`New requests from submit: ${networkInspector.requests.length - preSubmitRequests}`);

    console.log("\nAll auth requests (chronological):");
    networkInspector.requests.forEach((r, i) => {
      const urlPath = new URL(r.url).pathname;
      const timing = i === 0 ? "0ms" : `+${r.timestamp - networkInspector.requests[0].timestamp}ms`;
      console.log(`  [${i}] ${timing} | ${r.method} ${urlPath} | status: ${r.status ?? "?"}`);
    });

    const duplicates = networkInspector.getDuplicateRequests();
    console.log(`\nDuplicate request groups: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log("\n⚠️  DUPLICATES FOUND:");
      duplicates.forEach((d) => {
        console.log(`  ${d.endpoint} fired ${d.count} times`);
        const delta = d.requests[d.requests.length - 1].timestamp - d.requests[0].timestamp;
        console.log(`  Time span: ${delta}ms`);
        if (delta < 200) {
          console.log("  → RACE CONDITION: Requests fired nearly simultaneously");
          console.log("  → Likely cause: missing loading guard or Strict Mode doubling");
        } else if (delta < 1000) {
          console.log("  → RETRY: Requests fired within 1s - possible retry logic");
        } else {
          console.log("  → SEPARATE TRIGGERS: Requests far apart - different code paths");
        }
      });
    }

    const clusters = networkInspector.getRequestsWithinMs(300);
    if (clusters.length > 0) {
      console.log(`\nRequest clusters (within 300ms): ${clusters.length}`);
      clusters.forEach((cluster, i) => {
        console.log(`  Cluster ${i}: ${cluster.length} requests`);
        cluster.forEach((r) => {
          console.log(`    ${r.method} ${new URL(r.url).pathname} (${r.timestamp})`);
        });
      });
    }

    // Check for 429s
    const rateLimited = networkInspector.requests.filter((r) => r.status === 429);
    if (rateLimited.length > 0) {
      console.log(`\n🚨 RATE LIMIT (429) RESPONSES: ${rateLimited.length}`);
      rateLimited.forEach((r) => {
        console.log(`  ${r.method} ${new URL(r.url).pathname}`);
      });
      console.log("\n  ROOT CAUSE HYPOTHESIS:");
      if (duplicates.length > 0) {
        console.log("  → App is sending duplicate requests, triggering Supabase rate limits");
      } else {
        console.log("  → Supabase project-level rate limit (not app-caused duplication)");
      }
    }
  });

  test("full sign-in flow network trace", async ({ page, networkInspector }) => {
    networkInspector.clear();

    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const preSubmitRequests = networkInspector.requests.length;

    await page.click('text="Password"');
    await page.waitForTimeout(300);
    await page.fill('input[id="email"]', "trace@example.com");
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');

    await page.waitForTimeout(5000);

    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║  FULL SIGN-IN FLOW - NETWORK TRACE           ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    console.log(`Pre-submit auth requests: ${preSubmitRequests}`);
    console.log(`Total requests: ${networkInspector.requests.length}`);

    console.log("\nAll auth requests:");
    networkInspector.requests.forEach((r, i) => {
      const urlPath = new URL(r.url).pathname;
      const timing = i === 0 ? "0ms" : `+${r.timestamp - networkInspector.requests[0].timestamp}ms`;
      console.log(`  [${i}] ${timing} | ${r.method} ${urlPath} | status: ${r.status ?? "?"}`);
    });

    const duplicates = networkInspector.getDuplicateRequests();
    if (duplicates.length > 0) {
      console.log("\n⚠️  SIGN-IN DUPLICATES:");
      duplicates.forEach((d) => {
        console.log(`  ${d.endpoint}: ${d.count}x`);
      });
    }

    // After sign-in, there may be a post-login-redirect fetch
    const postLoginReqs = networkInspector.requests.filter(
      (r) => r.url.includes("post-login-redirect")
    );
    console.log(`\nPost-login redirect API calls: ${postLoginReqs.length}`);
    if (postLoginReqs.length > 1) {
      console.log("⚠️  Multiple post-login-redirect calls detected");
    }
  });

  test("magic link flow network trace", async ({ page, networkInspector }) => {
    networkInspector.clear();

    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.fill('input[id="magic-email"]', "magic-trace@example.com");
    await page.click('button:has-text("Send magic link")');

    await page.waitForTimeout(4000);

    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║  MAGIC LINK FLOW - NETWORK TRACE             ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    console.log(`Total auth requests: ${networkInspector.requests.length}`);
    networkInspector.requests.forEach((r, i) => {
      const urlPath = new URL(r.url).pathname;
      console.log(`  [${i}] ${r.method} ${urlPath} | status: ${r.status ?? "?"}`);
    });

    const otpRequests = networkInspector.requests.filter(
      (r) => r.url.includes("/otp") || r.url.includes("/magiclink")
    );
    console.log(`\nOTP/MagicLink requests: ${otpRequests.length}`);

    if (otpRequests.length > 1) {
      console.log("⚠️  MULTIPLE MAGIC LINK REQUESTS - possible double-send bug");
    }

    expect(otpRequests.length).toBeLessThanOrEqual(1);
  });

  test("consecutive auth attempts timing analysis", async ({
    page,
    networkInspector,
  }) => {
    networkInspector.clear();

    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");

    await page.click('text="Password"');
    await page.waitForTimeout(300);

    // Attempt 1
    await page.fill('input[id="email"]', "timing@example.com");
    await page.fill('input[id="password"]', "wrong1");
    await page.click('button:has-text("Sign in")');
    await page.waitForTimeout(3000);

    // Attempt 2
    await page.fill('input[id="password"]', "wrong2");
    const btn = page.locator('button:has-text("Sign in"):not([disabled])');
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(3000);
    }

    // Attempt 3
    await page.fill('input[id="password"]', "wrong3");
    const btn2 = page.locator('button:has-text("Sign in"):not([disabled])');
    if (await btn2.isVisible().catch(() => false)) {
      await btn2.click();
      await page.waitForTimeout(3000);
    }

    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║  CONSECUTIVE ATTEMPTS - TIMING ANALYSIS       ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    console.log(`Total requests across 3 attempts: ${networkInspector.requests.length}`);
    networkInspector.requests.forEach((r, i) => {
      const timing = i === 0 ? "0ms" : `+${r.timestamp - networkInspector.requests[0].timestamp}ms`;
      console.log(`  [${i}] ${timing} | ${r.method} ${new URL(r.url).pathname} | ${r.status}`);
    });

    const rateLimited = networkInspector.requests.filter((r) => r.status === 429);
    console.log(`\n429 responses: ${rateLimited.length}`);

    if (rateLimited.length > 0) {
      const firstReq = networkInspector.requests[0];
      const firstRL = rateLimited[0];
      const timeToRL = firstRL.timestamp - firstReq.timestamp;
      console.log(`Time from first request to rate limit: ${timeToRL}ms`);
      console.log(`Requests before rate limit: ${networkInspector.requests.indexOf(rateLimited[0])}`);

      if (timeToRL < 5000) {
        console.log("\n🚨 RATE LIMIT HIT VERY QUICKLY - possible duplicate request issue");
      } else {
        console.log("\n  Rate limit hit after reasonable number of attempts");
        console.log("  → Likely legitimate Supabase throttling, not app bug");
      }
    }
  });
});
