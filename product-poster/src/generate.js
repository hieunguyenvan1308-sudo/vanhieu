import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

const client = new Anthropic();

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

export const ProductContentSchema = z.object({
  title: z.string().describe("Tên sản phẩm hiển thị trên web, có từ khóa chính"),
  handle: z
    .string()
    .describe("Đường dẫn URL: chữ thường không dấu, nối bằng dấu gạch ngang"),
  focus_keyword: z.string().describe("Từ khóa SEO chính"),
  secondary_keywords: z.array(z.string()).describe("3-6 từ khóa phụ / biến thể"),
  seo_title: z.string().describe("Thẻ title SEO, tối đa 60 ký tự"),
  meta_description: z.string().describe("Meta description, 140-160 ký tự"),
  short_description: z.string().describe("Mô tả ngắn 1-2 câu"),
  body_html: z.string().describe("Bài viết sản phẩm dạng HTML"),
  tags: z.array(z.string()),
  product_type: z.string().describe("Loại sản phẩm, ví dụ: Điều hòa, Tủ lạnh"),
  vendor: z.string().describe("Thương hiệu"),
  needs_review: z
    .array(z.string())
    .describe("Các thông tin anh/chị cần kiểm tra lại trước khi đăng"),
});

const SYSTEM_PROMPT = `Bạn là người viết nội dung sản phẩm cho một website bán hàng tiếng Việt. Bạn nhận tên sản phẩm và giá, rồi viết trang sản phẩm chuẩn SEO để đăng lên Haravan.

Yêu cầu SEO:
- Chọn một từ khóa chính sát với cách khách tìm trên Google (thường là tên sản phẩm rút gọn + mã model). Đặt nó trong title, seo_title, câu đầu bài viết, ít nhất một thẻ <h2>, và meta_description.
- seo_title tối đa 60 ký tự. meta_description 140-160 ký tự, nêu lợi ích chính và giá hoặc ưu đãi.
- handle: chữ thường, bỏ dấu tiếng Việt, nối bằng "-", không quá 80 ký tự.
- body_html chỉ dùng các thẻ: h2, h3, p, ul, li, strong, table, tr, th, td. Không dùng h1 (Haravan đã dùng tên sản phẩm làm h1). Không chèn CSS, script hay ảnh.
- Bố cục gợi ý: đoạn mở đầu ngắn; các mục <h2> về đặc điểm nổi bật, thông số kỹ thuật (bảng), phù hợp với ai / không gian nào, câu hỏi thường gặp (3-5 câu, mỗi câu là <h3> kèm <p>); đoạn cuối nêu giá và mời liên hệ.
- Độ dài 600-1000 từ.

Độ chính xác (quan trọng nhất):
- Chỉ ghi thông số mà bạn chắc chắn đúng với đúng mã model này. Thông số nào không chắc, ghi "[Cần kiểm tra]" trong bảng thay vì đoán, và liệt kê nó trong needs_review.
- Nếu không nhận ra mã model, viết dựa trên loại sản phẩm và thương hiệu, không bịa con số, và ghi rõ điều đó trong needs_review.
- Không bịa chương trình khuyến mãi, quà tặng, thời gian bảo hành hay chứng nhận nếu người dùng không cung cấp.
- Dùng đúng giá được cung cấp, định dạng kiểu Việt Nam (ví dụ 12.490.000₫).

Văn phong:
- Viết như một nhân viên bán hàng hiểu sản phẩm đang nói chuyện với khách: rõ ràng, cụ thể, câu ngắn vừa phải.
- Mỗi câu phải cho khách thêm một thông tin. Bỏ các câu chỉ để tạo không khí.
- Tránh: "không chỉ... mà còn...", "hãy cùng tìm hiểu", "đỉnh cao", "hoàn hảo", "tuyệt vời", "đẳng cấp", "trải nghiệm vượt trội", câu chốt kiểu khẩu hiệu ở cuối đoạn, dồn ba tính từ liên tiếp, lạm dụng dấu gạch ngang và chữ in đậm.
- Không dùng emoji.`;

function formatVnd(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

/**
 * Generate SEO product content from a product name and price.
 * @param {{name: string, price: number, comparePrice?: number, notes?: string}} input
 */
export async function generateProductContent({ name, price, comparePrice, notes }) {
  const store = [
    process.env.STORE_NAME && `Tên cửa hàng: ${process.env.STORE_NAME}`,
    process.env.STORE_HOTLINE && `Hotline: ${process.env.STORE_HOTLINE}`,
    process.env.STORE_INFO && `Thông tin thêm về cửa hàng: ${process.env.STORE_INFO}`,
  ]
    .filter(Boolean)
    .join("\n");

  const userMessage = [
    `Tên sản phẩm: ${name}`,
    `Giá bán: ${formatVnd(price)}`,
    comparePrice ? `Giá gốc (trước giảm): ${formatVnd(comparePrice)}` : null,
    notes ? `Ghi chú / thông số do người bán cung cấp (tin cậy được):\n${notes}` : null,
    store ? `\n${store}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(ProductContentSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("AI từ chối tạo nội dung cho sản phẩm này. Hãy thử đổi cách ghi tên sản phẩm.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Bài viết bị cắt giữa chừng. Hãy thử lại.");
  }
  if (!response.parsed_output) {
    throw new Error("Không đọc được kết quả từ AI. Hãy thử lại.");
  }
  return response.parsed_output;
}
