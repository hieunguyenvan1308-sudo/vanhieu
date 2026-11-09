import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { generateProductContent } from "./generate.js";
import { createHaravanProduct, haravanConfigured } from "./haravan.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(here, "..", "public")));

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function errorMessage(err) {
  if (err instanceof Anthropic.AuthenticationError) return "Sai hoặc thiếu ANTHROPIC_API_KEY trong file .env";
  if (err instanceof Anthropic.RateLimitError) return "AI đang quá tải, đợi một phút rồi thử lại.";
  if (err instanceof Anthropic.APIError) return `Lỗi AI (${err.status}): ${err.message}`;
  return err?.message || String(err);
}

app.get("/api/config", (_req, res) => {
  res.json({
    haravan: haravanConfigured(),
    storeName: process.env.STORE_NAME || "",
  });
});

app.post("/api/generate", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const price = parsePrice(req.body.price);
  if (!name || !price) return res.status(400).json({ error: "Cần nhập tên sản phẩm và giá." });
  try {
    const content = await generateProductContent({
      name,
      price,
      comparePrice: parsePrice(req.body.comparePrice),
      notes: String(req.body.notes || "").trim() || undefined,
    });
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: errorMessage(err) });
  }
});

app.post("/api/publish", async (req, res) => {
  const { content } = req.body;
  const price = parsePrice(req.body.price);
  if (!content?.title || !content?.body_html || !price) {
    return res.status(400).json({ error: "Thiếu nội dung hoặc giá." });
  }
  try {
    const result = await createHaravanProduct(content, {
      price,
      comparePrice: parsePrice(req.body.comparePrice),
      sku: String(req.body.sku || "").trim() || undefined,
      imageUrl: String(req.body.imageUrl || "").trim() || undefined,
      publish: req.body.publish === true,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: errorMessage(err) });
  }
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log(`Mở trình duyệt: http://localhost:${port}`);
});
