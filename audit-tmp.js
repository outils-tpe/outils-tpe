const fs = require("fs"), path = require("path");
const root = "public";
function walk(d) {
  let r = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) r = r.concat(walk(p));
    else if (e.name.endsWith(".html")) r.push(p);
  }
  return r;
}
const norm = (f) => f.split(path.sep).join("/");
const files = walk(root);
function resolve(u) {
  u = u.split("#")[0].split("?")[0];
  if (u === "/") return fs.existsSync("public/index.html") ? "public/index.html" : null;
  if (u.endsWith("/")) u = u.slice(0, -1);
  const c = ["public" + u + ".html", "public" + u + "/index.html", "public" + u];
  for (const f of c) if (fs.existsSync(f)) return norm(f);
  return null;
}
let broken = [], linkedTargets = new Set();
const linkRe = /href="(\/[^"]*)"/g;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  let m;
  while ((m = linkRe.exec(html))) {
    const u = m[1];
    if (u.startsWith("/assets") || u.startsWith("/files") || u.startsWith("//")) continue;
    const r = resolve(u);
    if (!r) broken.push(norm(f) + "  ->  " + u);
    else linkedTargets.add(r);
  }
}
console.log("=== PAGES (" + files.length + ") ===");
console.log(files.map(norm).join("\n"));
console.log("\n=== LIENS CASSES (" + broken.length + ") ===");
console.log(broken.length ? broken.join("\n") : "aucun");
const orphans = files.map(norm).filter((f) => f !== "public/index.html" && !linkedTargets.has(f));
console.log("\n=== ORPHELINES (non liees, hors accueil) (" + orphans.length + ") ===");
console.log(orphans.length ? orphans.join("\n") : "aucune");

// Sitemap : completude
const sm = fs.readFileSync("public/sitemap.xml", "utf8");
const locs = [...sm.matchAll(/<loc>https:\/\/outils-tpe\.fr([^<]*)<\/loc>/g)].map((m) => m[1]);
function pageToUrl(f) {
  let u = "/" + norm(f).replace(/^public\//, "").replace(/index\.html$/, "").replace(/\.html$/, "");
  return u;
}
const pageUrls = files.map(pageToUrl);
const missing = pageUrls.filter((u) => {
  const variants = [u, u.endsWith("/") ? u.slice(0, -1) : u + "/"];
  return !locs.some((l) => variants.includes(l) || variants.includes(l + "/") || variants.includes(l.replace(/\/$/, "")));
});
console.log("\n=== PAGES ABSENTES DU SITEMAP ===");
console.log(missing.length ? missing.join("\n") : "aucune");
console.log("\n=== URLS SITEMAP (" + locs.length + ") ===");
console.log(locs.join("\n"));
