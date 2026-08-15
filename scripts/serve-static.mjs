import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function resolve(urlPath) {
  const p = decodeURIComponent(urlPath.split("?")[0]);
  // 模拟 Cloudflare Pages _redirects: /outfit/:id → /outfit/?id=:id
  if (/^\/outfit\/[^/]+\/?$/.test(p)) return path.join(OUT, "outfit.html");
  let file = path.join(OUT, p === "/" ? "index.html" : p);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  if (fs.existsSync(file + ".html")) return file + ".html";
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    const index = path.join(file, "index.html");
    if (fs.existsSync(index)) return index;
  }
  return file;
}

http
  .createServer((req, res) => {
    let file;
    try {
      file = resolve(req.url || "/");
    } catch {
      res.writeHead(400);
      res.end("bad request");
      return;
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "public, max-age=0",
      });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(PORT, () => console.log(`static server: http://localhost:${PORT}`));
