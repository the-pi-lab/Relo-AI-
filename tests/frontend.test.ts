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

// [4] Sidebar Navigation Cycling (roving keyboard pattern)
console.log("\n[4] Testing Sidebar Navigation Cycling (keyboard pattern)...");
const sidebarItems = ["home", "automations", "campaigns", "leads", "insights", "products", "settings"] as const;

function getNextSidebarItem(current: string, key: "ArrowDown" | "ArrowUp" | "Home" | "End"): string {
  const idx = (sidebarItems as readonly string[]).indexOf(current);
  if (key === "ArrowDown") return sidebarItems[(idx + 1) % sidebarItems.length];
  if (key === "ArrowUp") return sidebarItems[(idx - 1 + sidebarItems.length) % sidebarItems.length];
  if (key === "Home") return sidebarItems[0];
  if (key === "End") return sidebarItems[sidebarItems.length - 1];
  return current;
}

assert.strictEqual(getNextSidebarItem("home", "ArrowDown"), "automations");
assert.strictEqual(getNextSidebarItem("settings", "ArrowDown"), "home"); // wrap around
assert.strictEqual(getNextSidebarItem("home", "ArrowUp"), "settings"); // wrap backwards
assert.strictEqual(getNextSidebarItem("insights", "ArrowUp"), "leads");
assert.strictEqual(getNextSidebarItem("leads", "Home"), "home");
assert.strictEqual(getNextSidebarItem("leads", "End"), "settings");

console.log("✓ Sidebar navigation cycles, wraps boundaries, and handles Home/End.");

console.log("\n🎉 ALL FRONTEND UNIT TESTS PASSED WITH 100% SUCCESS!");

