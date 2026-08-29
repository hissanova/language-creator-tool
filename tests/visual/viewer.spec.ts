import { expect, test } from "@playwright/test";

type ViewerMode = "conversation" | "developer";

const cases: Array<{
  name: string;
  route: string;
  mode: ViewerMode;
  snapshot: string;
}> = [
  {
    name: "Uchinaaguchi smoke fixture in conversation mode",
    route: "/contents/lessons/sample",
    mode: "conversation",
    snapshot: "uchinaaguchi-conversation.png",
  },
  {
    name: "Uchinaaguchi smoke fixture in developer mode",
    route: "/contents/lessons/sample",
    mode: "developer",
    snapshot: "uchinaaguchi-developer.png",
  },
  {
    name: "Chinese medium fixture in conversation mode",
    route: "/contents/generated/conversation-chinese-medium",
    mode: "conversation",
    snapshot: "chinese-conversation.png",
  },
  {
    name: "Chinese medium fixture in developer mode",
    route: "/contents/generated/conversation-chinese-medium",
    mode: "developer",
    snapshot: "chinese-developer.png",
  },
];

for (const visualCase of cases) {
  test(visualCase.name, async ({ page }) => {
    await page.goto(visualCase.route);

    const themeSelector = page.getByRole("combobox", { name: "Theme" });
    await expect(async () => {
      await themeSelector.selectOption("light");
      await expect(page.locator("html")).toHaveClass(/\blight\b/);
    }).toPass();
    await expect(themeSelector).toHaveValue("light");

    const viewerSelector = page.getByRole("combobox", { name: "Viewer" });
    await viewerSelector.selectOption(visualCase.mode);
    await expect(viewerSelector).toHaveValue(visualCase.mode);

    if (visualCase.mode === "developer") {
      await expect(page.getByText("Metadata", { exact: true })).toBeVisible();
    } else {
      await expect(page.getByRole("combobox", { name: "Translation" })).toBeVisible();
    }

    const viewer = page.getByRole("main");
    await expect(viewer).toHaveCount(1);
    await expect(viewer).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    await expect(viewer).toHaveScreenshot(visualCase.snapshot, {
      animations: "disabled",
      // Native media controls expose timing-dependent buffering UI. Keep the
      // surrounding media layout covered while excluding playback chrome.
      mask: [viewer.locator("audio, video")],
      maskColor: "#ffffff",
    });
  });
}
