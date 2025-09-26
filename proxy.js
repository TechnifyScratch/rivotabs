import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Setup __dirname (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (like index.html)
app.use(express.static(__dirname));

// Proxy route
app.get("/go", async (req, res) => {
  let url = req.query.u;
  if (!url) return res.status(400).send("No URL provided");

  // Force prepend http if missing
  if (!/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");
    res.set("content-type", contentType || "text/html");
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy running at http://localhost:${PORT}`);
});
