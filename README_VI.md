<p align="center">
  <img src="public/openchatcut-icon.png" width="96" alt="OpenChatCut" />
</p>

<h1 align="center">OpenChatCut — bản tiếng Việt</h1>

<p align="center">
  <strong>Trình chỉnh sửa video AI mã nguồn mở, ưu tiên chạy cục bộ và hỗ trợ tác nhân AI.</strong>
</p>

<p align="center">
  <strong>Tiếng Việt</strong> · <a href="README.md">Tiếng Anh</a> · <a href="README_ZH.md">Tiếng Trung giản thể</a>
</p>

OpenChatCut là một trình chỉnh sửa video có dòng thời gian thực, nơi Codex, Claude Code và tác nhân AI tích hợp có thể đọc, chỉnh sửa và xuất dự án video mà vẫn giữ khả năng chỉnh sửa tiếp.

## Điểm chính

- Dòng thời gian nhiều lớp cho video, hình ảnh, âm thanh, phụ đề và đồ họa chuyển động.
- Nhập tư liệu, chép lời, cắt lời nói, tạo phụ đề và chỉnh sửa theo đề xuất của tác nhân AI.
- Hỗ trợ xuất video, âm thanh, phụ đề, FCPXML và bản nháp CapCut/JianYing.
- Dữ liệu dự án ưu tiên lưu cục bộ trong trình duyệt hoặc ứng dụng desktop.
- Giao diện hỗ trợ tiếng Việt, tiếng Anh, tiếng Trung giản thể, tiếng Ý và tiếng Nga; bản fork này mặc định tiếng Việt.

Trang web: [openchatcut.com](https://openchatcut.com)

## Chạy từ mã nguồn

Yêu cầu Node.js và npm.

```bash
npm install
npm run dev
```

Mở địa chỉ localhost mà Vite hiển thị trong terminal. Để chạy bản desktop:

```bash
npm run desktop:dev
```

## Kiểm tra bản Việt hóa

```bash
npm run verify:i18n
npx tsc -b --pretty false
```

## Phát triển

Các thay đổi bản địa hóa nằm chủ yếu trong `src/i18n/dict/vi/`. Chuỗi giao diện dùng khóa tiếng Trung của dự án gốc; tên mẫu, âm thanh và thiết lập sẵn được dịch qua các bảng dữ liệu riêng để không làm thay đổi dữ liệu chuẩn trong dự án.

Nếu phát hiện chuỗi chưa được Việt hóa, hãy tạo báo cáo lỗi kèm đường dẫn màn hình hoặc tệp liên quan.

## Giấy phép

Xem [LICENSE](LICENSE) và tài liệu gốc để biết đầy đủ thông tin giấy phép, đóng góp và cộng đồng.
