const API_BASE = process.env.HARAVAN_API_BASE || "https://apis.haravan.com/com";

export function haravanConfigured() {
  return Boolean(process.env.HARAVAN_ACCESS_TOKEN);
}

/**
 * Create a product on Haravan. Saved as hidden (draft) unless publish = true.
 * @param {object} content  Output of generateProductContent (possibly edited by the user)
 * @param {{price: number, comparePrice?: number, sku?: string, imageUrl?: string, publish?: boolean}} opts
 */
export async function createHaravanProduct(content, { price, comparePrice, sku, imageUrl, publish = false }) {
  const token = process.env.HARAVAN_ACCESS_TOKEN;
  if (!token) throw new Error("Chưa cấu hình HARAVAN_ACCESS_TOKEN trong file .env");

  const variant = { price, inventory_management: null };
  if (comparePrice) variant.compare_at_price = comparePrice;
  if (sku) variant.sku = sku;

  const product = {
    title: content.title,
    handle: content.handle,
    body_html: content.body_html,
    vendor: content.vendor,
    product_type: content.product_type,
    tags: content.tags.join(", "),
    published: publish,
    variants: [variant],
  };

  if (process.env.HARAVAN_SEND_SEO_FIELDS !== "false") {
    product.metafields_global_title_tag = content.seo_title;
    product.metafields_global_description_tag = content.meta_description;
  }
  if (imageUrl) product.images = [{ src: imageUrl }];

  const res = await fetch(`${API_BASE}/products.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const detail = data.errors ? JSON.stringify(data.errors) : text.slice(0, 500);
    throw new Error(`Haravan trả lỗi ${res.status}: ${detail}`);
  }

  const created = data.product;
  const adminUrl = process.env.HARAVAN_SHOP_DOMAIN
    ? `https://${process.env.HARAVAN_SHOP_DOMAIN}/admin/products/${created.id}`
    : null;
  return { id: created.id, handle: created.handle, adminUrl };
}
