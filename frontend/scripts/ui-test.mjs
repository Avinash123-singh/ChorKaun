import { chromium } from "playwright-core";
import path from "path";
import { mkdirSync } from "fs";

const out = path.join(process.cwd(), ".ui-test");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 430, height: 920 } });
page.setDefaultTimeout(20000);

const base = process.env.APP_URL || "http://127.0.0.1:5180";

await page.goto(base, { waitUntil: "commit", timeout: 10000 });
await page.waitForTimeout(3200);
await page.screenshot({ path: path.join(out, "01-home.png") });

await page.getByText("CREATE ROOM", { exact: true }).first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(out, "02-create-room.png") });

await page.locator("button").filter({ hasText: /^CREATE ROOM$/ }).last().click();
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(out, "03-lobby.png") });

await page.getByText("START GAME", { exact: true }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(out, "04-shuffle.png") });
await page.waitForTimeout(2200);
await page.screenshot({ path: path.join(out, "05-role-revealed.png") });

await page.goto(base, { waitUntil: "commit", timeout: 10000 });
await page.waitForTimeout(3200);
await page.getByText("JOIN ROOM", { exact: true }).first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(out, "06-join-room.png") });

await browser.close();
console.log("screenshots done");
