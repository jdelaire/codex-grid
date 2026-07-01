import { expect, test } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = 9876;
const baseUrl = `http://127.0.0.1:${port}`;
let serverProcess;

const threadsPayload = {
  source: "codex_app_server",
  generated_at_ms: Date.now(),
  capabilities: { read_threads: true, send_messages: false },
  counts: { active: 1, visible: 3, projects: 1 },
  threads: [
    {
      id: "parent",
      title: "Ship Codims",
      nickname: "Ship Codims",
      role: "thread",
      cwd: "/repo/codims",
      project: "codims",
      parent_id: "parent",
      parent_title: "Ship Codims",
      updated_at_ms: Date.now() - 120000,
      age_seconds: 120,
      state: "RECENT",
      intensity: "idle",
      last_response_snippet: "Ready for review.",
    },
    {
      id: "child-active",
      title: "Render rooms",
      nickname: "Ada",
      role: "agent",
      cwd: "/repo/codims",
      project: "codims",
      parent_id: "parent",
      parent_title: "Ship Codims",
      updated_at_ms: Date.now() - 30000,
      age_seconds: 30,
      state: "ACTIVE",
      intensity: "working",
      last_response_snippet: "Rendering room signs.",
    },
    {
      id: "child-done",
      title: "Review sidebar",
      nickname: "Grace",
      role: "agent",
      cwd: "/repo/codims",
      project: "codims",
      parent_id: "parent",
      parent_title: "Ship Codims",
      updated_at_ms: Date.now() - 300000,
      age_seconds: 300,
      state: "DONE",
      intensity: "idle",
      last_response_snippet: "Sidebar reviewed.",
    },
  ],
};

const threadDetailPayload = {
  source: "codex_app_server",
  generated_at_ms: Date.now(),
  thread: {
    id: "child-done",
    title: "Review sidebar",
    nickname: "Grace",
    role: "agent",
    cwd: "/repo/codims",
    project: "codims",
    parent_id: "parent",
    updated_at_ms: Date.now() - 300000,
    age_seconds: 300,
    turn_count: 2,
    agent_prompt: "Review sidebar behavior.",
    last_response: "Sidebar reviewed.",
    content: "Agent prompt\nReview sidebar behavior.\n\nLast response\nSidebar reviewed.",
  },
};

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) {
        return;
      }
    } catch {
      await delay(100);
    }
  }
  throw new Error("static smoke server did not start");
}

async function hasNonBlankScreenshot(page, locator) {
  const png = await locator.screenshot();
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  return page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();

    const sampler = document.createElement("canvas");
    sampler.width = image.width;
    sampler.height = image.height;
    const context = sampler.getContext("2d");
    if (!context) {
      return false;
    }

    context.drawImage(image, 0, 0);
    const samples = [
      [0.5, 0.5],
      [0.25, 0.5],
      [0.75, 0.5],
      [0.5, 0.25],
      [0.5, 0.75],
    ];
    for (const [x, y] of samples) {
      const pixel = context.getImageData(
        Math.floor(sampler.width * x),
        Math.floor(sampler.height * y),
        1,
        1,
      ).data;
      if (pixel[0] + pixel[1] + pixel[2] > 16) {
        return true;
      }
    }
    return false;
  }, dataUrl);
}

test.beforeAll(async () => {
  serverProcess = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  await waitForServer();
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/threads?**", async (route) => {
    await route.fulfill({ json: threadsPayload });
  });
  await page.route("**/api/thread/*", async (route) => {
    await route.fulfill({ json: threadDetailPayload });
  });
});

test("renders nonblank scene and action inbox", async ({ page }) => {
  await page.goto(`${baseUrl}/index.html`);
  await expect(page.locator("#scene canvas")).toBeVisible();
  await expect(page.locator("#activeCount")).toHaveText("1");
  await expect(page.locator("#visibleCount")).toHaveText("3");
  await expect(page.locator("#reviewList")).toContainText("Review sidebar");

  const nonBlank = await hasNonBlankScreenshot(page, page.locator("#scene canvas"));
  expect(nonBlank).toBe(true);
});

test("privacy mode hides sidebar content", async ({ page }) => {
  await page.goto(`${baseUrl}/index.html`);
  await page.locator("#privacyToggle").click();
  await expect(page.locator("#reviewList")).toContainText("Hidden");
});

test("mobile layout keeps scene and details visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/index.html`);
  await expect(page.locator("#scene canvas")).toBeVisible();
  await expect(page.locator(".details-panel")).toBeVisible();
});
