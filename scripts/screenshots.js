const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = "shots";

// Node scripts don't auto-load .env.local like Next does — read it manually.
(function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {}
})();

const SUPABASE_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const ADMIN_EMAIL = process.env.SNACKSIP_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SNACKSIP_ADMIN_PASSWORD;
const ADMIN_READY = SUPABASE_READY && ADMIN_EMAIL && ADMIN_PASSWORD;

const mobile = { width: 390, height: 844 };
const desktop = { width: 1280, height: 900 };

async function newPage(browser, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  return { ctx, page };
}

async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

async function signup(page) {
  await page.goto(`${BASE}/signup`);
  await page.fill('input[type="text"]', "Rai Dela Cruz");
  await page.fill(
    'input[type="email"]',
    `rai${Date.now()}@school.ph`,
  );
  await page.fill('input[type="password"]', "password1");
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL((u) => !u.pathname.includes("signup"), {
      timeout: 8000,
    });
  } catch {
    throw new Error(
      "Signup did not complete. If the page says 'Check your email', turn OFF Confirm email in Supabase Studio → Authentication → Providers → Email.",
    );
  }
}

async function adminLogin(page) {
  await page.goto(`${BASE}/login?next=/admin`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith("/admin"), {
    timeout: 10000,
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // --- mobile customer ---
  {
    const { ctx, page } = await newPage(browser, mobile);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot(page, "m-home");

    await page.goto(`${BASE}/menu`, { waitUntil: "networkidle" });
    const adds = page.locator('button:has-text("Add")');
    await adds.nth(0).click();
    await adds.nth(0).click();
    await adds.nth(1).click();
    await shot(page, "m-menu");

    await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
    await shot(page, "m-cart");

    if (SUPABASE_READY) {
      await signup(page);
      await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
      await shot(page, "m-checkout");

      await page.click('button[type="submit"]');
      await page.waitForURL(/\/payment\//, { timeout: 10000 });
      await shot(page, "m-payment");

      await page.goto(`${BASE}/orders`, { waitUntil: "networkidle" });
      await shot(page, "m-orders");

      await page.goto(`${BASE}/loyalty`, { waitUntil: "networkidle" });
      await shot(page, "m-loyalty");
    } else {
      console.log(
        "skipped m-checkout/m-payment/m-orders/m-loyalty — add Supabase keys to .env.local",
      );
    }
    await ctx.close();
  }

  // --- mobile admin ---
  if (ADMIN_READY) {
    const { ctx, page } = await newPage(browser, mobile);
    await adminLogin(page);
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await shot(page, "m-admin-home");

    await page.goto(`${BASE}/admin/pos`, { waitUntil: "networkidle" });
    const tiles = page.locator("main button");
    await tiles.nth(0).click();
    await tiles.nth(1).click();
    await shot(page, "m-admin-pos");
    await ctx.close();
  }

  // --- desktop customer ---
  {
    const { ctx, page } = await newPage(browser, desktop);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot(page, "d-home");
    await page.goto(`${BASE}/menu`, { waitUntil: "networkidle" });
    const adds = page.locator('button:has-text("Add")');
    await adds.nth(0).click();
    await adds.nth(1).click();
    await shot(page, "d-menu");
    await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
    await shot(page, "d-cart");

    if (SUPABASE_READY) {
      await signup(page);
      await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
      await shot(page, "d-checkout");
      await page.goto(`${BASE}/loyalty`, { waitUntil: "networkidle" });
      await shot(page, "d-loyalty");
      await page.goto(`${BASE}/orders`, { waitUntil: "networkidle" });
      await shot(page, "d-orders");
    }
    await ctx.close();
  }

  // --- tablet customer ---
  {
    const { ctx, page } = await newPage(browser, {
      width: 834,
      height: 1112,
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot(page, "t-home");
    await page.goto(`${BASE}/menu`, { waitUntil: "networkidle" });
    await shot(page, "t-menu");
    await ctx.close();
  }

  // --- desktop admin ---
  if (ADMIN_READY) {
    const { ctx, page } = await newPage(browser, desktop);
    await adminLogin(page);
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await shot(page, "d-admin-home");
    await page.goto(`${BASE}/admin/pos`, { waitUntil: "networkidle" });
    const tiles = page.locator("main button");
    await tiles.nth(0).click();
    await tiles.nth(1).click();
    await shot(page, "d-admin-pos");
    await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
    await shot(page, "d-admin-orders");
    await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
    await shot(page, "d-admin-products");
    await ctx.close();
  } else {
    console.log(
      "skipped admin shots — set SNACKSIP_ADMIN_EMAIL/SNACKSIP_ADMIN_PASSWORD (plus Supabase keys) in .env.local",
    );
  }

  await browser.close();
  console.log("done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
