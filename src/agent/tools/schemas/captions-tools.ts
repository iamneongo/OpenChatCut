import type { AgentToolSchema } from '../../tool-schema';
import { CAPTION_MOTION_OPTIONS } from '../../../captions/captionMotion';

const CAPTION_ACTIONS = [
  'enable', 'disable', 'hide_overlay', 'show_overlay',
  'display_text', 'template', 'style', 'animation', 'layout', 'layout_policy', 'positions',
  'preset_apply', 'preset_delete', 'preset_list', 'preset_rename', 'preset_save',
  'bilingual', 'language_mode', 'source_add', 'source_list', 'source_remove',
  'source_set', 'source_update', 'track',
];

export const CAPTIONS_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'read_captions',
    description: "Đọc trạng thái và các trang đã phân giải của một rãnh phụ đề. Truyền captionTrackId dạng C1/C2 hoặc ID ổn định; bỏ qua để dùng C1. Dùng list=true để khám phá mọi rãnh phụ đề.",
    input_schema: { type: 'object', properties: {
      captionTrackId: { type: 'string', description: 'Bí danh rãnh phụ đề (C1/C2) hoặc ID ổn định. Mặc định C1.' },
      list: { type: 'boolean', description: 'Liệt kê rãnh phụ đề thay vì đọc các trang đã phân giải.' },
    } },
  },
  {
    name: 'edit_captions',
    description:
      "Quản lý lớp phủ phụ đề qua một `action` duy nhất. Chỉ đọc văn bản trước với display_text (dùng read_captions); mọi action khác là một lần gọi trực tiếp.\n" +
      "- enable / disable: bật/tắt dữ liệu phụ đề (enable có thể nhận tên `preset` dựng sẵn).\n" +
      "- hide_overlay / show_overlay: cờ captionsHidden toàn cục (hiển thị phụ đề trên thanh công cụ) — ẩn lớp phụ đề trên màn hình và các đoạn chữ nhưng không xóa dữ liệu phụ đề; show_overlay bật lại.\n" +
      "- template: không có tham số → liệt kê 21 mẫu dựng sẵn; `templatePreset:\"netflix\"` → áp dụng một mẫu (giữ nguyên kích thước/vị trí).\n" +
      "- style: giao diện tùy chỉnh qua `json` — {font|fontFamily,sizePx|fontSizeRatio|fontSize,color,weight|fontWeight,fontStyle,textAlign|align,underline,strike,letterSpacing,lineHeight,strokeColor,strokeWidth,highlightColor,highlightBackground,shadow|shadowStrength,background|backgroundColor,backgroundOpacity,borderRadius,textTransform,displayMode,wordsPerPage,pacing}. Phủ lên template hiện tại; trường không ánh xạ được sẽ báo trong `ignored`. sizePx tính theo chiều cao CANVAS — trên khung dọc 9:16 (1080×1920), phụ đề mạng xã hội nên có sizePx ≥ 86 (≈4.5% chiều cao); bỏ qua size để giữ mặc định template. pacing: 'phrase' (mặc định, trang dễ đọc + tô sáng karaoke) — chỉ dùng 'word' khi người dùng nói rõ muốn bật từng từ.\n" +
      "- animation: chuyển động burn-in xác định, dùng chung cho xem trước/xuất; đặt `motionPreset` là none, fade-up, pop, word-pop hoặc karaoke-pulse.\n" +
      "- layout: đặt toàn bộ khối qua `json` {preset:\"bottom-center|top-center|center|…3×3\", offsetXRatio, offsetYRatio, scale, rotation, opacity}; transform cũng có thể lồng trong `{transforms:{scale,rotation,opacity}}`.\n" +
      "- display_text: ghi đè DISPLAY theo từng từ qua `json` {overrides:[{wordRef, text, hidden, forcePageBreak}], clearOverrides} — lấy wordRef opaque từ read_captions. wordIndex vẫn là phương án dự phòng cũ; wordRef ổn định khi nhóm lại và đổi thứ tự nguồn. Đặt clear:true trên mục để xóa từ đó theo một trong hai selector. Không tác động transcript.\n" +
      "- source_set / source_add / source_remove / source_list: chọn rãnh/đoạn đã chép lời mà phụ đề đọc (json {mode:\"timeline\"} cho mọi âm thanh nghe được, hoặc {sources:[{trackId|itemId}]}).\n" +
      "  Đoạn nhiều nguồn nhận trackOrder bắt đầu từ 0. source_update có thể di chuyển nguồn hiện có với {sourceId|index, trackOrder}; source_list trả về thứ tự hình ảnh đã chuẩn hóa.\n" +
      "- language_mode / bilingual: đổi ngôn ngữ phụ đề — json {mode:\"original|translation|bilingual\", languageCode} (tạo bản dịch trước bằng manage_transcript translate).\n" +
      "- track: trackId rãnh nguồn đơn cũ hoặc trackOrder nội bộ bắt đầu từ 0 (ưu tiên source_set cho văn bản nguồn hiển thị).\n" +
      "- layout_policy / positions / source_update: sắp xếp, tạo phong cách, ẩn và đổi thứ tự từng rãnh nguồn. preset_* quản lý phong cách phụ đề người dùng đã lưu.",
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: CAPTION_ACTIONS, description: 'Thao tác phụ đề cần thực hiện.' },
        json: { type: 'string', description: 'Dữ liệu JSON cho action (trường style, layout, ghi đè display_text, phạm vi source, ngôn ngữ). Có thể là chuỗi JSON hoặc đối tượng.' },
        templatePreset: { type: 'string', description: 'Với action=template: id/tên preset dựng sẵn cần áp dụng (bỏ qua để liệt kê).' },
        preset: { type: 'string', description: 'Với action=enable: tên preset dựng sẵn tùy chọn ("auto"/bỏ qua = mặc định Plain). Với action=template: bí danh cũ của templatePreset.' },
        motionPreset: {
          type: 'string',
          enum: CAPTION_MOTION_OPTIONS.map((option) => option.id),
          description: 'Với action=animation: mẫu chuyển động phụ đề xác định.',
        },
        trackId: { type: 'string', description: 'Chỉ với action=track: bí danh rãnh nguồn (V1/A1) hoặc id. Để chọn văn bản phụ đề hiển thị, ưu tiên source_set.' },
        trackOrder: { anyOf: [{ type: 'number' }, { type: 'string' }], description: 'Thứ tự rãnh dòng thời gian nội bộ bắt đầu từ 0, chỉ với action=track. Gọi action=track với list=true để xem đúng thứ tự.' },
        list: { type: 'boolean', description: 'Với action=track: liệt kê rãnh nguồn có sẵn thay vì đổi source.' },
        captionTrackId: { type: 'string', description: 'Bí danh rãnh phụ đề đích (C1/C2) hoặc id ổn định. Mặc định C1.' },
        captionsItemId: { type: 'string', description: 'Bí danh cũ của captionTrackId.' },
      },
      required: ['action'],
    },
  },
];

export const CAPTIONS_TOOL_NAMES = new Set(CAPTIONS_TOOL_SCHEMAS.map((t) => t.name));
