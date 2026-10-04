import type { AgentToolSchema } from '../../tool-schema';

export const MEDIA_POOL_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'manage_media_pool',
  description:
    'Sắp xếp kho tư liệu của dự án: liệt kê, tạo/đổi tên/xóa thư mục rỗng, di chuyển tư liệu, đổi tên hiển thị, đánh dấu/bỏ yêu thích, xóa tư liệu khỏi kho hoặc liên kết lại bản gốc ngoại tuyến/thất lạc tới một đường dẫn tư liệu cùng nguồn gốc mới. Các action thư mục và metadata không thay đổi đoạn trên dòng thời gian; relink_asset cập nhật tư liệu trong kho và mọi đoạn dùng bản gốc đó.',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'list',
          'create_folder',
          'rename_folder',
          'delete_empty_folder',
          'move_assets',
          'rename_asset',
          'favorite_assets',
          'unfavorite_assets',
          'delete_assets',
          'relink_asset',
        ],
      },
      assetIds: {
        type: 'string',
        description:
          'Các ID/tiền tố/tên tư liệu phân tách bằng dấu phẩy cho move_assets, rename_asset (một ID), favorite_assets, unfavorite_assets, delete_assets; relink_asset nhận đúng một ID.',
      },
      folderPath: { type: 'string', description: 'Đường dẫn thư mục như Master/B-roll, hoặc tiền tố ID thư mục.' },
      name: { type: 'string', description: 'Tên thư mục mới cho create_folder; không được chứa /. relink_asset: tên hiển thị tùy chọn cho nguồn thay thế.' },
      newName: { type: 'string', description: 'Tên hiển thị mới của thư mục hoặc tư liệu cho action đổi tên.' },
      parentPath: { type: 'string', description: 'Đường dẫn thư mục cha cho create_folder; mặc định là Master.' },
      targetPath: { type: 'string', description: 'Đường dẫn thư mục đích cho move_assets; mặc định là Master.' },
      src: {
        type: 'string',
        description:
          'relink_asset: path media thay thế (cùng origin /media/uploads/… sau khi upload lại, hoặc URL media khác của dự án có thể truy cập). Khi thay file cục bộ, ưu tiên upload lại + finalize_uploaded_asset với cùng assetId.',
      },
      durationInFrames: { type: 'number', description: 'relink_asset: thời lượng mới tính bằng frame, tùy chọn khi đã biết.' },
      width: { type: 'number', description: 'relink_asset: chiều rộng pixel, tùy chọn.' },
      height: { type: 'number', description: 'relink_asset: chiều cao pixel, tùy chọn.' },
      sourceFilename: { type: 'string', description: 'relink_asset: tên file gốc tùy chọn để giữ identity trong NLE.' },
      confirm: {
        type: 'boolean',
        description:
          'delete_assets: khi asset được chọn vẫn được clip timeline tham chiếu, lần gọi đầu trả về needsConfirm; gửi lại với confirm:true để chỉ xóa entry trong pool (clip vẫn giữ media đã sao chép).',
      },
    },
    required: ['action'],
  },
}];

export const MEDIA_POOL_TOOL_NAMES = new Set(MEDIA_POOL_TOOL_SCHEMAS.map((tool) => tool.name));
