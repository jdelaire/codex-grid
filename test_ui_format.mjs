import assert from "node:assert/strict";

import { cssHexColor, formatAge, visibleActivityLabel } from "./ui-format.mjs";

assert.equal(cssHexColor(0x000000), "#000000");
assert.equal(cssHexColor(0x22d3ee), "#22d3ee");
assert.equal(cssHexColor(0xffffff), "#ffffff");

assert.equal(formatAge(0), "0s");
assert.equal(formatAge(59), "59s");
assert.equal(formatAge(60), "1m");
assert.equal(formatAge(3599), "59m");
assert.equal(formatAge(3600), "1h");

assert.equal(visibleActivityLabel("Ada", true), "RUNNING - Ada");
assert.equal(visibleActivityLabel("Ada", false), "Ada");
