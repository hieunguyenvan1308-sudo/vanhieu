# Đăng sản phẩm tự động lên Haravan

Nhập **tên sản phẩm** và **giá**. AI (Claude) viết bài sản phẩm chuẩn SEO, anh xem lại và sửa nếu cần, rồi bấm một nút để lưu sản phẩm lên Haravan ở dạng **nháp (ẩn khỏi web)**.

AI viết những phần sau:
- Tên sản phẩm, đường dẫn URL không dấu
- Tiêu đề SEO (tối đa 60 ký tự) và mô tả SEO (140-160 ký tự), kèm bản xem trước trên Google
- Bài viết HTML: mở đầu, đặc điểm nổi bật, bảng thông số, phù hợp với ai, câu hỏi thường gặp, giá
- Tags, thương hiệu, loại sản phẩm
- Danh sách **"Cần kiểm tra"**: những thông số AI không chắc chắn. Trong bài, các ô đó được ghi `[Cần kiểm tra]` thay vì đoán số.

Muốn bài chính xác hơn thì mở "Tùy chọn thêm" và dán thông số hoặc khuyến mãi. AI sẽ dùng đúng thông tin anh đưa.

## Cài đặt (một lần)

1. Cài [Node.js](https://nodejs.org) bản 20 trở lên.
2. Mở terminal trong thư mục `product-poster`, chạy:
   ```bash
   npm install
   cp .env.example .env
   ```
3. Mở file `.env` và điền:
   - `ANTHROPIC_API_KEY`: tạo tại https://console.anthropic.com/settings/keys
   - `HARAVAN_ACCESS_TOKEN`: vào trang quản trị Haravan, tạo **app riêng (private app)** có quyền ghi sản phẩm (`com.write_products`), rồi lấy access token.
   - `HARAVAN_SHOP_DOMAIN`: ví dụ `tencuahang.myharavan.com`
   - `STORE_NAME`, `STORE_HOTLINE`: AI dùng ở đoạn cuối bài viết.

## Sử dụng

```bash
npm start
```

Mở http://localhost:3000, nhập tên và giá, bấm **Tạo bài viết** (mất khoảng 30-60 giây), xem lại, rồi bấm **Lưu nháp lên Haravan**. Sau đó vào Haravan kiểm tra lần cuối, thêm ảnh nếu chưa có, rồi bật hiển thị.

## Lưu ý

- Mỗi lần tạo bài tốn một ít phí API Claude (ước tính khoảng 3.000-5.000₫ một bài, tùy độ dài).
- Nếu Haravan báo lỗi ở trường SEO (`metafields_global_title_tag`), đặt `HARAVAN_SEND_SEO_FIELDS=false` trong `.env` rồi nhập tiêu đề và mô tả SEO bằng tay trong Haravan.
- Phần mềm chỉ chạy trên máy anh (`127.0.0.1`). Không chia sẻ file `.env` vì nó chứa khóa bí mật.
