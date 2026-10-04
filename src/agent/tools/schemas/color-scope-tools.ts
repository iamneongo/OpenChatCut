import type { AgentToolSchema } from '../../tool-schema';

export const COLOR_SCOPE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'inspect_color',
    description: [
      'Đo scope màu của frame BẰNG SỐ thay vì ước lượng bằng mắt qua ảnh chụp: điểm đen/trắng luma, % vùng',
      'bóng sáng bị cắt, giá trị trung bình từng kênh, cân bằng ấm-lạnh (R−B) và xanh lá-tím trên TOÀN ẢNH cũng như từng dải luma',
      '(bóng/tông trung/hightlight), độ bão hòa trung bình và histogram hue 12 nhóm có trọng số theo độ bão hòa (mỗi nhóm 30° tính từ đỏ) với',
      'nhãn hue chiếm ưu thế — ví dụ cụm màu cam thường là da, cyan/xanh thiên thanh thường là bầu trời.',
      'Chế độ mặc định đo dòng thời gian ĐÃ GHÉP tại `frame` hoặc `seconds` (đã áp dụng grade/filter/effect, xếp chồng mọi lớp',
      '— để đọc một đoạn, hãy chọn frame tại đó đoạn phủ đầy màn hình). Truyền assetId (+ sourceSeconds) để đo frame của tư liệu GỐC',
      'trong kho tư liệu trước khi grade.',
      'Vòng lặp thường dùng: inspect_color → điều chỉnh bằng filter edit_item / hiệu ứng màu / LUT look → inspect_color lại để',
      'xác nhận các chỉ số đã thay đổi đúng ý. Dùng view_timeline_frames nếu muốn XEM frame nữa.',
      'Để khớp với shot khác trong một lần gọi, truyền referenceFrame/referenceSeconds hoặc referenceAssetId/referenceSourceSeconds.',
      'Kết quả gồm delta có dấu theo target-trừ-reference và các gợi ý control có tên sau khi lọc vùng chết.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        frame: { type: 'number', description: 'Frame timeline cần đo (đã composite). Mặc định: giữa nội dung.' },
        seconds: { type: 'number', description: 'Thời điểm trên timeline tính bằng giây (thay cho frame).' },
        assetId: { type: 'string', description: 'Đo tư liệu GỐC trong kho tư liệu thay vì dòng thời gian (được dùng tiền tố ID).' },
        sourceSeconds: { type: 'number', description: 'Chỉ dùng ở chế độ tư liệu: thời điểm nguồn cần lấy mẫu (mặc định: giữa tư liệu).' },
        referenceFrame: { type: 'number', description: 'Frame timeline tham chiếu để so sánh.' },
        referenceSeconds: { type: 'number', description: 'Thời điểm timeline tham chiếu tính bằng giây (thay cho referenceFrame).' },
        referenceAssetId: { type: 'string', description: 'So sánh với frame của tư liệu GỐC trong kho tư liệu (được dùng tiền tố ID).' },
        referenceSourceSeconds: { type: 'number', description: 'Thời điểm nguồn của tư liệu tham chiếu (mặc định: giữa tư liệu).' },
      },
    },
  },
];

export const COLOR_SCOPE_TOOL_NAMES = new Set(COLOR_SCOPE_TOOL_SCHEMAS.map((t) => t.name));
