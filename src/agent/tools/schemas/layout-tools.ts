import type { AgentToolSchema } from '../../tool-schema';
import { LAYOUT_IDS } from '../../../editor/layouts';

export const LAYOUT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'apply_layout',
    description: [
      'Sắp xếp các clip hình ảnh vào layout nhiều video có tên (chia màn hình / picture-in-picture / lưới) trong MỘT bước có thể undo.',
      'Chọn layout và gán clip cho từng slot; tool tự tính scale/position/crop để mỗi clip LẤP ĐẦY slot',
      'từ mép này đến mép kia mà KHÔNG kéo giãn (mode=cover cắt layer; anchorX/anchorY 0..1 chọn phía cần giữ, mặc định ở giữa).',
      'mode=fit dùng letterbox thay vì cắt. layout=full đưa một clip về toàn khung (xóa crop/scale của layout).',
      'Layout và slot: full(full) · 2up-horizontal(left,right) · 2up-vertical(top,bottom) · 3up-horizontal(left,center,right)',
      '· grid-4(top-left,top-right,bottom-left,bottom-right) · pip(main,inset; insetCorner/insetSize/insetMargin điều chỉnh cửa sổ nhỏ).',
      'Gán ít slot hơn tổng số slot vẫn được (các slot khác để trống). Thứ tự xếp lớp theo thứ tự track (hàng timeline phía trên render ở trên),',
      'vì vậy hãy đặt clip inset của pip ở hàng CAO HƠN main — kết quả sẽ báo nếu không đúng. Các clip phải chồng thời gian để nhìn thấy cùng lúc.',
      'Tool hoạt động trên layer canvas: với timeline fit=contain, source có tỷ lệ khác canvas vẫn giữ letterbox riêng bên trong slot.',
      'Sau khi áp dụng, kiểm tra bằng view_timeline_frames.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        layout: { type: 'string', enum: [...LAYOUT_IDS], description: 'Layout có tên cần áp dụng.' },
        assignments: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              slot: { type: 'string', description: 'Tên slot của layout đã chọn (ví dụ "left", "inset").' },
              itemId: { type: 'string', description: 'Id item hình ảnh trên timeline (video/image/gif/svg) cần đặt vào slot.' },
            },
            required: ['slot', 'itemId'],
          },
          description: 'Một entry cho mỗi slot cần điền. Slot và item phải là duy nhất trong một lần gọi.',
        },
        mode: { type: 'string', enum: ['cover', 'fit'], description: 'cover (mặc định) cắt để lấp đầy slot; fit dùng letterbox.' },
        anchorX: { type: 'number', minimum: 0, maximum: 1, description: 'Chỉ cover: phía ngang cần giữ, 0=trái 0.5=giữa (mặc định) 1=phải.' },
        anchorY: { type: 'number', minimum: 0, maximum: 1, description: 'Chỉ cover: phía dọc cần giữ, 0=trên 0.5=giữa (mặc định) 1=dưới.' },
        insetCorner: { type: 'string', enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], description: 'Chỉ pip: góc cửa sổ nhỏ (mặc định dưới phải).' },
        insetSize: { type: 'number', minimum: 0.1, maximum: 0.6, description: 'Chỉ pip: kích thước cửa sổ nhỏ theo phần của canvas (mặc định 0.3).' },
        insetMargin: { type: 'number', minimum: 0, maximum: 0.2, description: 'Chỉ pip: khoảng cách tới mép canvas (mặc định 0.04).' },
      },
      required: ['layout', 'assignments'],
    },
  },
];

export const LAYOUT_TOOL_NAMES = new Set(LAYOUT_TOOL_SCHEMAS.map((t) => t.name));
