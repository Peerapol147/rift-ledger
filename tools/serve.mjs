// Local preview of play.html for testing; the game itself needs no server. /test keeps frames running in a hidden window.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const shim = `<script>window.__err=[];addEventListener('error',e=>__err.push(e.message));window.requestAnimationFrame=f=>setTimeout(()=>f(performance.now()),16);</script>`;
createServer((q, r) => { r.setHeader("content-type", "text/html; charset=utf-8"); r.setHeader("cache-control", "no-store"); const h = readFileSync(new URL("../play.html", import.meta.url), "utf8"); r.end(q.url.startsWith("/test") ? h.replace("<head>", () => "<head>" + shim) : h); }).listen(5177, "127.0.0.1");
