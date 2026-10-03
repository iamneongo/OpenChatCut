import type { AgentToolSchema } from '../../tool-schema';

export const MEDIA_POOL_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'manage_media_pool',
  description:
    'Sắp xếp media pool của dự án: liệt kê, tạo/đổi tên/xóa folder rỗng, di chuyển asset, đổi tên hiển thị, đánh dấu/bỏ yêu thích, xóa asset khỏi pool hoặc liên kết lại master offline/thất lạc tới một path media cùng origin mới. Các action folder và metadata không thay đổi clip timeline; relink_asset cập nhật asset trong pool và mọi clip dùng master đó.',
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
          'Các id/tiền tố/tên asset phân tách bằng dấu phẩy cho move_assets, rename_asset (một id), favorite_assets, unfavorite_assets, delete_assets; relink_asset nhận đúng một id.',
      },
      folderPath: { type: 'string', description: 'Path folder như Master/B-roll, hoặc tiền tố id folder.' },
      name: { type: 'string', description: 'Tên folder mới cho create_folder; không được chứa /. relink_asset: tên hiển thị tùy chọn cho source thay thế.' },
      newName: { type: 'string', description: 'Tên hiển thị mới của folder hoặc asset cho action đổi tên.' },
      parentPath: { type: 'string', description: 'Path folder cha cho create_folder; mặc định là Master.' },
      targetPath: { type: 'string', description: 'Path folder đích cho move_assets; mặc định là Master.' },
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
