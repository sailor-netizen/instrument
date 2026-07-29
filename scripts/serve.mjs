#!/usr/bin/env node
/* ==============================================================================================
   The gallery server.  `npm run gallery`
   ==============================================================================================

   This replaced `python -m http.server`, for one reason that cost real time: that server sends a
   `Last-Modified` header and no `Cache-Control`, so browsers fall back to HEURISTIC freshness and
   may reuse a stylesheet for minutes WITHOUT revalidating. Editing contract.css and reloading gave
   a page built from the new components.css and the old contract.css — every figure collapsed to
   18px and it looked exactly like a CSS bug in the change I had just made. It was not.

   That failure mode is disqualifying for what this gallery is FOR. The whole argument of sheets/ is
   that you judge a design by looking at it; a server that can quietly show you a stale mixture makes
   looking untrustworthy, and it is worse for an assistant driving a browser than for a human, because
   a human eventually thinks to hard-reload. So: no-store, everywhere, always. This is a local dev
   server for a handful of files — there is no performance argument on the other side.

   Zero dependencies, same as check.mjs, and Node rather than Python because this repo already
   requires Node and does not require Python.
   ============================================================================================== */

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const PORT = Number(process.env.PORT) || 4322;
const HOST = "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".md": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  // Never cache. See the header comment — this is the entire reason this file exists.
  res.setHeader("Cache-Control", "no-store, must-revalidate");

  let pathname;
  try {
    ({ pathname } = new URL(req.url, `http://${HOST}`));
  } catch {
    res.writeHead(400).end("bad request");
    return;
  }

  // Resolve, then confirm the result is still inside ROOT. Serving a whole repo over HTTP means
  // `..` in a URL is a directory-traversal read of the user's disk; decoding first and checking the
  // RESOLVED path is what makes `%2e%2e%2f` and friends fail too.
  const rel = decodeURIComponent(pathname).replace(/^\/+/, "");
  const target = resolve(join(ROOT, rel || "gallery/index.html"));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    res.writeHead(403).end("outside the served root");
    return;
  }

  let file = target;
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, "index.html");
    await stat(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`404 ${pathname}\n\nServed from ${ROOT}\nTry /gallery/index.html\n`);
    return;
  }

  res.writeHead(200, { "content-type": TYPES[extname(file).toLowerCase()] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  const base = `http://${HOST}:${PORT}`;
  console.log(`instrument gallery — serving ${ROOT}`);
  console.log(`  components   ${base}/gallery/index.html`);
  console.log(`  themes       ${base}/gallery/themes.html`);
  console.log(`  compare      ${base}/gallery/compare.html   one screen, every theme`);
  console.log(`  sheets       ${base}/gallery/sheets.html    every direction, side by side`);
  console.log(`\nno-store on every response, so an edit is one reload away.`);
});
