import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "./validate.mjs";
import { renderPoster } from "./render.mjs";

const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">`;

test("a real rendered poster validates clean", () => {
  const { ok, violations } = validate(renderPoster("instrument"));
  assert.deepEqual(violations, []);
  assert.strictEqual(ok, true);
});

test("catches an external image url", () => {
  const svg = `${SVG_OPEN}<image href="https://example.com/x.png"/></svg>`;
  const { ok, violations } = validate(svg);
  assert.strictEqual(ok, false);
  assert.ok(violations.some((v) => v.rule === "external-url"));
});

test("catches a protocol-relative url", () => {
  const svg = `${SVG_OPEN}<rect fill="url(//example.com/x.png)"/></svg>`;
  const { violations } = validate(svg);
  assert.ok(violations.some((v) => v.rule === "external-url"));
});

test("catches an @font-face block", () => {
  const svg = `${SVG_OPEN}<style>@font-face { font-family: "X"; ` +
    `src: url(data:font/woff2;base64,AAAA); }</style></svg>`;
  const { ok, violations } = validate(svg);
  assert.strictEqual(ok, false);
  assert.ok(violations.some((v) => v.rule === "font-face"));
});

test("catches a script element", () => {
  const svg = `${SVG_OPEN}<script>alert(1)</script></svg>`;
  const { ok, violations } = validate(svg);
  assert.strictEqual(ok, false);
  assert.ok(violations.some((v) => v.rule === "script-element"));
});

test("catches an event-handler attribute", () => {
  const svg = `${SVG_OPEN}<rect onclick="alert(1)" width="10" height="10"/></svg>`;
  const { ok, violations } = validate(svg);
  assert.strictEqual(ok, false);
  assert.ok(violations.some((v) => v.rule === "event-handler"));
});

test("catches an oversize poster", () => {
  const padding = "x".repeat(85 * 1024);
  const svg = `${SVG_OPEN}<!--${padding}--></svg>`;
  const { ok, violations } = validate(svg, { kind: "poster" });
  assert.strictEqual(ok, false);
  assert.ok(violations.some((v) => v.rule === "oversize"));
});

test("catches an oversize tile at the smaller budget", () => {
  const padding = "x".repeat(31 * 1024);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 180"><!--${padding}--></svg>`;
  const { ok, violations } = validate(svg);
  assert.strictEqual(ok, false);
  assert.ok(violations.some((v) => v.rule === "oversize" && v.detail.includes("(tile)")));
});

test("allow-list holds: url(#grad) and a data: image are not flagged external", () => {
  const svg = `${SVG_OPEN}<rect fill="url(#grad)"/><image href="data:image/png;base64,AAAA"/></svg>`;
  const { violations } = validate(svg);
  assert.ok(!violations.some((v) => v.rule === "external-url"));
});

test("rejects a document that is not an SVG", () => {
  const { ok, violations } = validate("<div>not svg</div>");
  assert.strictEqual(ok, false);
  assert.ok(violations.some((v) => v.rule === "not-svg"));
});
