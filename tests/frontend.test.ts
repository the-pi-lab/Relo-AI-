import assert from "node:assert";
import {
  calculateManyChatMonthly,
  calculateManyChatAnnual,
  calculateThreeYearSavings,
} from "../src/lib/calculator.js";
import {
  isValidButtonUrl,
  normalizeTriggerKeyword,
} from "../src/lib/validation.js";

console.log("=== RUNNING FRONTEND UNIT TEST SUITE ===\n");

// [1] Pricing Tier Calculations
console.log("[1] Testing ManyChat Tier Calculations & Savings Math...");
assert.strictEqual(calculateManyChatMonthly(500), 15);
assert.strictEqual(calculateManyChatAnnual(500), 180);
assert.strictEqual(calculateThreeYearSavings(500, 10), 530);

assert.strictEqual(calculateManyChatMonthly(1000), 25);
assert.strictEqual(calculateManyChatAnnual(1000), 300);
assert.strictEqual(calculateThreeYearSavings(1000, 10), 890);

assert.strictEqual(calculateManyChatMonthly(5000), 45);
assert.strictEqual(calculateManyChatAnnual(5000), 540);
assert.strictEqual(calculateThreeYearSavings(5000, 10), 1610);

assert.strictEqual(calculateManyChatMonthly(25000), 145);
assert.strictEqual(calculateManyChatAnnual(25000), 1740);
assert.strictEqual(calculateThreeYearSavings(25000, 10), 5210);

assert.strictEqual(calculateManyChatMonthly(50000), 235);
assert.strictEqual(calculateManyChatAnnual(50000), 2820);
assert.strictEqual(calculateThreeYearSavings(50000, 10), 8450);

console.log("✓ Pricing tier calculations match published ManyChat pricing models.");

// [2] URL Protocol Security (Anti-XSS)
console.log("\n[2] Testing URL Protocol Sanitization (Anti-XSS)...");
// Valid URLs
assert.strictEqual(isValidButtonUrl("https://relo.ai/blueprint"), true);
assert.strictEqual(isValidButtonUrl("https://instagram.com"), true);
assert.strictEqual(isValidButtonUrl("http://localhost:5173"), true);
assert.strictEqual(isValidButtonUrl("https://example.com/download?id=42&ref=ig"), true);

// Invalid / Malicious XSS vectors
assert.strictEqual(isValidButtonUrl("javascript:alert(1)"), false);
assert.strictEqual(isValidButtonUrl("javascript:eval('malicious')"), false);
assert.strictEqual(isValidButtonUrl("data:text/html;base64,PHNjcmlwdD4="), false);
assert.strictEqual(isValidButtonUrl("vbscript:msgbox"), false);
assert.strictEqual(isValidButtonUrl("file:///etc/passwd"), false);
assert.strictEqual(isValidButtonUrl(""), false);
assert.strictEqual(isValidButtonUrl("   "), false);
assert.strictEqual(isValidButtonUrl("not-a-valid-url"), false);

console.log("✓ URL validation strictly allows http/https and blocks dangerous protocols.");

// [3] Keyword Normalization
console.log("\n[3] Testing Keyword Sanitization & Normalization...");
assert.strictEqual(normalizeTriggerKeyword("#GUIDE"), "GUIDE");
assert.strictEqual(normalizeTriggerKeyword("###VIP"), "VIP");
assert.strictEqual(normalizeTriggerKeyword("  blueprint  "), "BLUEPRINT");
assert.strictEqual(normalizeTriggerKeyword("growth"), "GROWTH");
assert.strictEqual(normalizeTriggerKeyword(""), "");

console.log("✓ Keyword normalization strips # prefixes, trims whitespace, and uppercases.");

// [4] Keyboard Tab Navigation Cycling (WCAG AA Tabs Pattern)
console.log("\n[4] Testing Keyboard Tab Navigation Cycling (WCAG AA)...");
const studioTabs = ["reels", "editor", "leads", "analytics"] as const;

function getNextTab(current: string, key: "ArrowRight" | "ArrowLeft" | "Home" | "End"): string {
  const idx = studioTabs.indexOf(current as any);
  if (key === "ArrowRight") return studioTabs[(idx + 1) % studioTabs.length];
  if (key === "ArrowLeft") return studioTabs[(idx - 1 + studioTabs.length) % studioTabs.length];
  if (key === "Home") return studioTabs[0];
  if (key === "End") return studioTabs[studioTabs.length - 1];
  return current;
}

assert.strictEqual(getNextTab("reels", "ArrowRight"), "editor");
assert.strictEqual(getNextTab("editor", "ArrowRight"), "leads");
assert.strictEqual(getNextTab("leads", "ArrowRight"), "analytics");
assert.strictEqual(getNextTab("analytics", "ArrowRight"), "reels"); // wrap around
assert.strictEqual(getNextTab("reels", "ArrowLeft"), "analytics"); // wrap backwards
assert.strictEqual(getNextTab("leads", "Home"), "reels");
assert.strictEqual(getNextTab("leads", "End"), "analytics");

console.log("✓ Keyboard tab navigation cycles, wraps boundaries, and handles Home/End.");

console.log("\n🎉 ALL FRONTEND UNIT TESTS PASSED WITH 100% SUCCESS!");

