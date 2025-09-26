import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/go", async (req, res) => {
  let url = req.query.u;
  if (!url) return res.status(400).send("No URL provided");

  if (!/^https?:\/\//i.test(url)) url = "http://" + url;

  try {
    const response = await fetch(url);
    let body = await response.text();
    let contentType = response.headers.get("content-type") || "text/html";

    // If it's HTML, rewrite it
    if (contentType.includes("text/html")) {
      const dom = new JSDOM(body);
      const doc = dom.window.document;

      // Rewrite all <a>, <img>, <script>, <link>
      doc.querySelectorAll("a[href]").forEach(a => {
        a.href = "/go?u=" + encodeURIComponent(new URL(a.href, url).href);
      });
      doc.querySelectorAll("img[src]").forEach(img => {
        img.src = "/go?u=" + encodeURIComponent(new URL(img.src, url).href);
      });
      doc.querySelectorAll("script[src]").forEach(s => {
        s.src = "/go?u=" + encodeURIComponent(new URL(s.src, url).href);
      });
      doc.querySelectorAll("link[href]").forEach(l => {
        l.href = "/go?u=" + encodeURIComponent(new URL(l.href, url).href);
      });

      body = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    }

    // Strip headers that block embedding
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("X-Frame-Options");

    res.set("content-type", contentType);
    res.send(body);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Smart Proxy running at http://localhost:${PORT}`);
});
