import { test as base, expect, type Page, type Request } from "@playwright/test";

export interface AuthRequestLog {
  url: string;
  method: string;
  timestamp: number;
  postData?: string | null;
  status?: number;
}

export interface NetworkInspector {
  requests: AuthRequestLog[];
  getSignUpRequests(): AuthRequestLog[];
  getSignInRequests(): AuthRequestLog[];
  getMagicLinkRequests(): AuthRequestLog[];
  getDuplicateRequests(): { endpoint: string; count: number; requests: AuthRequestLog[] }[];
  getRequestsWithinMs(ms: number): AuthRequestLog[][];
  clear(): void;
}

function createNetworkInspector(page: Page): NetworkInspector {
  const requests: AuthRequestLog[] = [];

  page.on("request", (req: Request) => {
    const url = req.url();
    if (
      url.includes("supabase.co/auth") ||
      url.includes("/auth/v1/") ||
      url.includes("/api/auth/")
    ) {
      requests.push({
        url,
        method: req.method(),
        timestamp: Date.now(),
        postData: req.postData(),
      });
    }
  });

  page.on("response", (res) => {
    const url = res.url();
    const matched = requests.find(
      (r) => r.url === url && !r.status
    );
    if (matched) {
      matched.status = res.status();
    }
  });

  return {
    requests,
    getSignUpRequests() {
      return requests.filter((r) => r.url.includes("/signup") || r.url.includes("/sign-up"));
    },
    getSignInRequests() {
      return requests.filter(
        (r) =>
          r.url.includes("/token?grant_type=password") ||
          r.url.includes("signInWithPassword")
      );
    },
    getMagicLinkRequests() {
      return requests.filter(
        (r) => r.url.includes("/otp") || r.url.includes("/magiclink")
      );
    },
    getDuplicateRequests() {
      const grouped = new Map<string, AuthRequestLog[]>();
      for (const req of requests) {
        const key = `${req.method}:${new URL(req.url).pathname}`;
        const group = grouped.get(key) || [];
        group.push(req);
        grouped.set(key, group);
      }
      return Array.from(grouped.entries())
        .filter(([, reqs]) => reqs.length > 1)
        .map(([endpoint, reqs]) => ({
          endpoint,
          count: reqs.length,
          requests: reqs,
        }));
    },
    getRequestsWithinMs(ms: number) {
      const clusters: AuthRequestLog[][] = [];
      const sorted = [...requests].sort((a, b) => a.timestamp - b.timestamp);
      let current: AuthRequestLog[] = [];

      for (const req of sorted) {
        if (current.length === 0) {
          current.push(req);
        } else if (req.timestamp - current[0].timestamp <= ms) {
          current.push(req);
        } else {
          if (current.length > 1) clusters.push(current);
          current = [req];
        }
      }
      if (current.length > 1) clusters.push(current);
      return clusters;
    },
    clear() {
      requests.length = 0;
    },
  };
}

export const test = base.extend<{ networkInspector: NetworkInspector }>({
  networkInspector: async ({ page }, use) => {
    const inspector = createNetworkInspector(page);
    await use(inspector);
  },
});

export { expect };

export function generateTestEmail(): string {
  const id = Math.random().toString(36).slice(2, 10);
  return `e2e-test-${id}@spaceart-test.local`;
}

export const TEST_PASSWORD = "TestPass123!@#";
export const WEAK_PASSWORD = "short";
