import type { AgentToolSchema } from '../../tool-schema';

export const EDIT_ITEM_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'edit_item',
    description:
      'Các thao tác cấp mục thống nhất cho video, hình ảnh, âm thanh, gif, svg, đồ họa chuyển động, chữ, màu nền, hiệu ứng và chuyển cảnh. '
      + 'Flex crop (flexcrop) là cắt phần thừa theo không gian — không phải cắt dòng thời gian. Dùng edit_item updates.transform.crop hoặc transform.flexCrop {left?,right?,top?,bottom?} theo pixel composition (Crop Left/Right 0..chiều rộng canvas, Crop Top/Bottom 0..chiều cao canvas; pixel bị cắt hoàn toàn trong suốt; null để xóa). '
      + 'Người dùng không cần nói "một lượt", "không kiểm tra lại frame" hoặc "không dùng run_code" — đó là mặc định. "Chỉ giữ dashboard/panel/vùng này" = crop đoạn đã chọn (bỏ qua itemId hoặc truyền "selected") để chỉ còn vùng đó, rồi dừng. Đặt mọi cạnh cần thiết trong một update. Không gọi run_code, probe_media, e2b hoặc edit_asset. '
      + 'adds đặt mục thư viện (effect/transition/zoom/MG/SFX), tư liệu trong KHO thành đoạn (type=video|image|gif|svg|audio, assetId=…), HOẶC đoạn tự tạo không có assetId: type=text (text/fontSize/color/fontWeight/align?) hoặc type=solid (color?). '
      + 'updates di chuyển/cắt/đổi thời gian theo itemId|id. Bỏ qua itemId hoặc truyền "selected" để nhắm lựa chọn trong inspector (read_project.timeline.selectedId). Nếu người dùng gọi tên đoạn đã chọn, không chọn rãnh bên cạnh. Bí danh video đi từ dưới lên (V1 = video dưới cùng). Truyền assetId trên đoạn có tệp sẽ thay thế nguyên tử từ kho tư liệu nhưng giữ ID mục, rãnh, thời điểm bắt đầu dòng thời gian, thời lượng và trạng thái chỉnh sửa hình/âm thanh. '
      + 'fromFrame là trường thời gian chuẩn (startFrame được nhận như bí danh). Trường không biết sẽ khiến toàn bộ lần gọi bị từ chối với "unknown field" + Did you mean. '
      + 'Mục chạy theo thứ tự adds→updates→deletes trên một bản nháp riêng; chỉ bản nháp hợp lệ/áp dụng hoàn chỉnh mới được công bố một lần. Mọi lỗi validator hoặc draft-apply sẽ hủy bản nháp, không để lại trạng thái dòng thời gian một phần. '
      + 'validateOnly chạy cùng draft tuần tự nhưng không publish. Lời gọi thay đổi sau đó đi qua propose→apply. split_item dùng để cắt đoạn.',
    input_schema: {
      type: 'object',
      properties: {
        adds: {
          type: 'array',
          description:
            'effect: {type,targetItemId,assetId,propertyOverrides?}. transition: {type,assetId,incomingItemId,outgoingItemId?,durationInFrames?}. motion-graphic: {type,assetId:library:motion-graphic:*,track?,fromFrame|startFrame?}. Audio SFX: {type:"audio",assetId:library:sound:*,fromFrame?}. Media B-roll trong POOL (video/image/gif/svg/audio): {type,assetId,track|trackId?,fromFrame|startFrame?,durationInFrames?} — không có name/props trong pool add (sau đó dùng update_item_props). Add source-window nhận frame chính xác {sourceStartFrame?,sourceDurationInFrames?} hoặc giới hạn thời gian {sourceStartMs?,sourceEndMs?,sourceStartSeconds?,sourceEndSeconds?}; dùng một dạng và không kết hợp với durationInFrames/srcInFrame. Text tự tạo: {type:"text",text,name?,track?,fromFrame?,durationInFrames?,fontSize?,color?,fontWeight?,align?}. Solid tự tạo: {type:"solid",color?,name?,track?,fromFrame?,durationInFrames?}.',
          items: { type: 'object' },
        },
        updates: {
          type: 'array',
          description:
            'Cập nhật đoạn tổng quát — type PHẢI là kind thực của mục, một trong: video, audio, image, gif, svg, text, solid, motion-graphic. KHÔNG BAO GIỜ ghi literal "generic" hoặc "clip" làm type — sẽ bị từ chối ("update type not supported"). Dạng: {type,itemId|id,track|trackId?,fromFrame|startFrame?,durationInFrames?,srcInFrame|sourceStartFrame?,sourceDurationInFrames?,props?,volume?,fadeInSeconds?,fadeOutSeconds?,keyframes?,clearKeyframes?,filters?,transform?,backgroundFill?,backgroundFillStrength?,speed|playbackRate?}. Thay kho chính xác: {type,itemId|id,assetId,sourceStartFrame?,sourceDurationInFrames?}; mặc định giữ thời lượng dòng thời gian gốc và đặt điểm vào nguồn mới về 0. Slip rõ ràng: {operation:"slip",itemId|id,deltaInFrames}; số dương dời cửa sổ nguồn về sau, số âm dời về trước, còn vị trí/thời lượng dòng thời gian giữ nguyên. Kết quả báo appliedDeltaInFrames, srcInFrame, sourceWindow, clamped/status hoặc code có cấu trúc cho input unknown/invalid. '
            + 'Thao tác tư liệu nguồn: {operation:"replace_media",itemId,src} nướng/đổi đoạn thành vỏ video tại cùng ô; {operation:"relink_media",itemId,src,name?,durationInFrames?,width?,height?} chỉ liên kết lại đoạn (tách khỏi kho gốc — dùng manage_media_pool relink_asset để cập nhật kho + mọi đoạn). '
            + 'keyframe: {x|y|scale|rotation|opacity|volume:[{frame,value,easing?}]} theo frame cục bộ item; easing lưu trên keyframe bên trái và điều khiển khoảng tiếp theo. Nhận linear/easeIn/easeOut/easeInOut và alias CSS ease-in/ease-out/ease-in-out. clearKeyframes:true xóa tất cả, hoặc clearKeyframes:"opacity" cho một prop. '
            + 'filter: {brightness?,contrast?,saturate? 0..2 (1=bình thường), blur? 0..30 px} trên đoạn hình ảnh. transform: {scale? 0.05..16, x?/y? % canvas, rotation? deg, opacity? 0..1, borderRadius?, crop?|flexCrop?: {left?,right?,top?,bottom?} pixel composition}. Flex crop (flexcrop) = Crop Left/Right/Top/Bottom; left/right 0..chiều rộng canvas px, top/bottom 0..chiều cao canvas px; pixel crop hoàn toàn trong suốt; null để xóa. backgroundFill:true lấp canvas chưa dùng bằng bản sao blur; backgroundFillStrength đặt phần trăm nguyên chính xác từ 0 đến 100 và bật fill khi dùng riêng. Chỉ đoạn video/hình ảnh trên rãnh video dưới cùng (V1). speed/playbackRate: 0.1..8 trên video/audio/gif (tính lại thời lượng). '
            + 'Không có field layout CSS (left/right/top/bottom/width/height) — đặt đoạn bằng transform hoặc keyframe x/y; flex crop phải nằm trong transform.crop hoặc transform.flexCrop, không ở left/right/top/bottom cấp cao nhất. layout BÊN TRONG MG thuộc code/props của nó. '
            + 'Cập nhật effect/transition/zoom như trước (đổi effect assetId là cho chồng FX, không phải đoạn tư liệu).',
          items: { type: 'object' },
        },
        deletes: {
          type: 'array',
          description:
            'Đoạn tổng quát: {type,itemId|id,ripple?} (ripple đóng khoảng trống). effect: {type:"effect",id|effectId,targetItemId?} hoặc clear chỉ với targetItemId. transition: {type:"transition",id}. zoom: {type:"effect",targetItemId,assetId:"builtin:zoom"}.',
          items: { type: 'object' },
        },
        ripple: {
          type: 'boolean',
          description:
            'Khi true, add MG/audio đẩy các mục cùng rãnh phía sau (insert). Không kết hợp với validateOnly.',
        },
        validateOnly: {
          type: 'boolean',
          description: 'Nếu true, dùng cùng draft riêng tuần tự để kiểm tra toàn bộ request, rồi hủy mà không publish.',
        },
        projectId: { type: 'string', description: 'Bỏ qua. Dùng dự án mà session agent hiện đang nhắm tới.' },
      },
      additionalProperties: false,
    },
  },
];

export const EDIT_ITEM_TOOL_NAMES = new Set(EDIT_ITEM_TOOL_SCHEMAS.map((t) => t.name));
