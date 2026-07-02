import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const files = ["style.css", "app.js"];

function rgbToHsl([red, green, blue]) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }
  const delta = max - min;
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);
  let hue;
  if (max === r) {
    hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    hue = ((b - r) / delta + 2) / 6;
  } else {
    hue = ((r - g) / delta + 4) / 6;
  }
  return { hue: hue * 360, saturation, lightness };
}

function isAllowedPaletteColor(rgb) {
  const [red, green, blue] = rgb;
  const { hue, saturation, lightness } = rgbToHsl(rgb);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const isNeutral = max - min <= 36 || saturation <= 0.16;
  const isNearBlack = lightness <= 0.12 && blue >= red && blue >= green - 14;
  const isCyanBlue = hue >= 180 && hue <= 214 && saturation >= 0.28;
  const isAmberOrange = hue >= 24 && hue <= 38 && saturation >= 0.55 && lightness >= 0.36;
  return isNeutral || isNearBlack || isCyanBlue || isAmberOrange;
}

function parseHexColor(value) {
  const hex = value.replace(/^#|^0x/, "");
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function parseRgbColor(value) {
  return value
    .match(/rgba?\(([^)]+)\)/)[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));
}

const disallowed = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const matches = text.matchAll(/#[0-9a-fA-F]{6}\b|0x[0-9a-fA-F]{6}\b|rgba?\([^)]+\)/g);
  for (const match of matches) {
    const literal = match[0];
    const rgb = literal.startsWith("rgb") ? parseRgbColor(literal) : parseHexColor(literal);
    if (!isAllowedPaletteColor(rgb)) {
      disallowed.push(`${file}: ${literal}`);
    }
  }
}

assert.deepEqual(disallowed, []);
