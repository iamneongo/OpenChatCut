import type { AgentToolSchema } from '../../tool-schema';

export const TRACK_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'edit_track',
  description:
    'Quản lý rãnh. Các action: list | create | update | delete | tighten | reorder_items. '
    + 'Track có id ổn định cùng alias C1/C2/V1/A1, các alias này có thể đánh số lại sau khi chèn. '
    + 'create nhận json với trackType video/audio/caption, cùng count/order/name/role/audioRouting tùy chọn. '
    + 'Mỗi track caption sở hữu dữ liệu caption riêng. update thay đổi order/hidden/muted/locked/name/role/audioRouting — locked sẽ khóa lane. '
    + 'delete chỉ xóa track rỗng. tighten đóng các khoảng trống giữa các clip media. '
    + 'reorder_items xếp các clip trên một track theo thứ tự item id được truyền (mảng json.itemIds hoặc json.orderedIds), bắt đầu từ startFrame sớm nhất trong nhóm đó.',
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['list', 'create', 'update', 'delete', 'tighten', 'reorder_items'] },
      json: {
        type: 'string',
        description:
          'JSON cho create/update, hoặc cho reorder_items: {"itemIds":["id1","id2",…]} (alias orderedIds).',
      },
      trackId: { type: 'string', description: 'Bí danh Cn/Vn/An hiện tại hoặc ID rãnh ổn định (update/delete/tighten/reorder_items).' },
      trackIds: { type: 'array', items: { type: 'string' }, description: 'delete: xóa nguyên tử nhiều rãnh rỗng.' },
    },
    required: ['action'],
  },
}];

export const TRACK_TOOL_NAMES = new Set(TRACK_TOOL_SCHEMAS.map((tool) => tool.name));
