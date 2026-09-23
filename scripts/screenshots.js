const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = "shots";

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
  await page.fill('input[type="email"]', `rai${Date.now()}@school.ph`);
  await page.fill('input[type="password"]', "password1");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes("signup"));
}

async function adminLogin(page) {
  await page.goto(`${BASE}/admin`);
  await page.fill('input[type="email"]', "admin@snacksip.local");
  await page.fill('input[type="password"]', "anything");
  await page.click('button[type="submit"]');
  await page.waitForSelector("h1");
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
    await ctx.close();
  }

  // --- mobile admin ---
  {
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
    await signup(page);
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await shot(page, "d-checkout");
    await page.goto(`${BASE}/loyalty`, { waitUntil: "networkidle" });
    await shot(page, "d-loyalty");
    await page.goto(`${BASE}/orders`, { waitUntil: "networkidle" });
    await shot(page, "d-orders");
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
  {
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
  }

  await browser.close();
  console.log("done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
