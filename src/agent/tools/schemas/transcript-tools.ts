import type { AgentToolSchema } from '../../tool-schema';

export const TRANSCRIPT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'read_transcript',
    description: 'Đọc transcript timeline hiện tại dưới dạng các cụm câu gọn để lập kế hoạch và chỉnh sửa ngữ nghĩa. Đây là bề mặt đọc transcript mặc định cho video dài và nhiều take: từ được nhóm theo thay đổi người nói, khoảng dừng và kích thước cụm giới hạn, đồng thời giữ source item, timestamp nguồn, frame timeline và phạm vi word-index gốc. Từ đã xóa/cắt được bỏ qua, nhưng transcript cấp từ vẫn giữ nguyên để chỉnh sửa chính xác. Dùng find_transcript khi cần tìm một câu trích dẫn cụ thể.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Id clip hoặc tiền tố duy nhất, tùy chọn. Bỏ qua để đọc mọi clip đã có transcript.' },
        track: { type: 'string', description: 'Alias/id track, tùy chọn. Bị bỏ qua khi đã đặt itemId.' },
        silenceThresholdSeconds: { type: 'number', minimum: 0, maximum: 10, description: 'Bắt đầu cụm mới sau khoảng dừng này; mặc định 0.5 giây.' },
        maxWordsPerPhrase: { type: 'integer', minimum: 1, maximum: 100, description: 'Giới hạn cứng cho đoạn nói liên tục; mặc định 40 từ.' },
        offset: { type: 'integer', minimum: 0, description: 'Offset cụm để phân trang; mặc định 0.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Số cụm tối đa trả về; mặc định 80.' },
      },
    },
  },
  {
    name: 'transcribe_track',
    description: 'Chuyển lời các clip audio/video trên track, gắn dữ liệu transcript đã chuẩn hóa và bao gồm chi tiết từ/người nói khi provider trả về. Dùng provider được chọn trong Settings (mặc định AssemblyAI) trừ khi truyền provider rõ ràng. Bắt buộc gọi trước find_transcript / clean_script / delete_text / captions khi clip chưa có transcript.',
    input_schema: { type: 'object', properties: {
      track: { type: 'string', description: 'Alias hoặc id ổn định của track có audio cần chuyển lời (mặc định A1).' },
      provider: { type: 'string', enum: ['assemblyai', 'local', 'openai', 'mistral', 'deepgram', 'groq', 'elevenlabs', 'cartesia'], description: 'Provider đã cấu hình để ghi đè, tùy chọn. Bỏ qua để dùng provider được chọn trong Settings.' },
    } },
  },
  {
    name: 'search_media',
    description: 'Tìm media dự án qua một giao diện có kiểu rõ ràng. Trả về kết quả cảnh hình ảnh ChineseCLIP và kết quả transcript lời nói với điểm số chuẩn hóa theo từng modality, khoảng thời gian nguồn, id asset và revision nguồn. Kết quả được nhóm theo modality vì điểm cosine và điểm transcript không thể so sánh trực tiếp; kết quả suy dẫn đã cũ sẽ bị loại. Truyền nguyên vẹn sourceStartMs/sourceEndMs của kết quả vào edit_item adds với cùng tên field; edit_item tự chuyển mili giây thành frame nguồn.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Khái niệm hình ảnh hoặc câu nói cần tìm.' },
        modalities: {
          type: 'array',
          items: { type: 'string', enum: ['visual', 'spoken'] },
          description: 'Tập con tùy chọn; mặc định gồm cả visual và spoken.',
        },
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Số kết quả tối đa cho mỗi modality; mặc định 12.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_transcript',
    description: 'Tìm THỜI ĐIỂM một câu được nói — tra cứu tọa độ thời gian, không phải tool đọc hoặc chỉnh transcript. Trả về kết quả cùng phạm vi frame timeline (fromFrame/toFrame) để neo B-roll, motion graphic, marker hoặc overlay tại thời điểm đó (hoặc tìm vị trí trước delete_text). Mặc định: khớp liên tục không phân biệt hoa thường/dấu câu/khoảng trắng trên mọi clip có transcript trong timeline; các chỉnh sửa được tôn trọng (từ đã xóa sẽ không khớp). asset = tìm transcript raw của MỘT asset bất kể đang dùng trong timeline (tra cứu thư viện, bỏ qua chỉnh sửa). track = giới hạn trong track đó. fuzzy = khớp theo thứ tự token với dung sai cửa sổ (dùng khi ASR có thể chèn từ đệm như "uh," giữa các token truy vấn). includeWordTimestamps = thêm block Words dưới mỗi kết quả với thời điểm bắt đầu → kết thúc của từng từ — dùng khi đồng bộ nhịp animation với từ đang nói; bỏ qua khi chỉ cần neo câu (để tránh output thừa). limit = số kết quả tối đa (mặc định 10).',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Văn bản cần tìm.' },
        asset: { type: 'string', description: 'Id asset hoặc tiền tố id. Bỏ qua để tìm trong toàn bộ dự án.' },
        track: { type: 'string', description: 'Alias track (V1/A1/...) hoặc id track. Giới hạn tìm kiếm trong track đó.' },
        fuzzy: { type: 'boolean', description: 'Khớp theo cửa sổ token (cho phép có từ đệm giữa các token).' },
        includeWordTimestamps: { type: 'boolean', description: 'Bao gồm timestamp từng từ trong mỗi kết quả (mặc định false). Thêm block Words với thời điểm bắt đầu -> kết thúc của từng từ. Dùng khi đồng bộ nhịp animation với lời nói (ví dụ nhịp nội bộ MG khớp với từ đang được nói).' },
        limit: { type: 'integer', description: 'Số kết quả tối đa (mặc định 10).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'clean_script',
    description: 'Làm sạch clip đã chuyển lời theo cơ chế cố định, gồm xóa từ đệm và các quy tắc pause có kiểu. only có thể là "fillers", "silence" hoặc "fillers,silence". silence nhận compress:400, restore:500, normalize:500, range:300-800 cùng cú pháp cũ max:400, min:500, 500 và min:300,max:800. Quy tắc kéo dài pause không bao giờ vượt quá khoảng im lặng có trong bản ghi. Các lời gọi maxPauseSeconds/removeFillers hiện có vẫn được hỗ trợ. Toàn bộ thao tác là một bước undo.',
    input_schema: {
      type: 'object',
      properties: {
        track: { type: 'string', description: 'Alias/id track chứa clip voiceover cần làm sạch (mặc định A1). Làm sạch mọi clip đã chuyển lời trên track.' },
        itemId: { type: 'string', description: 'Tùy chọn: chỉ làm sạch clip này thay vì toàn bộ track.' },
        only: { type: 'string', description: 'Chạy fillers, silence hoặc cả hai dưới dạng fillers,silence. Bỏ qua để giữ hành vi mặc định hiện có.' },
        silence: { type: 'string', description: 'Quy tắc pause: compress:400, restore:500, normalize:500, range:300-800 hoặc cú pháp cũ.' },
        longSilence: { type: 'number', description: 'Ngưỡng pause dài tính bằng mili giây cho quy tắc silence mặc định (pause từ ngưỡng trở lên được nén còn 200ms). Mặc định 3000 khi only gồm silence mà không truyền quy tắc silence.' },
        maxPauseSeconds: { type: 'number', description: 'Nén pause dài hơn giá trị này xuống bằng nó (ví dụ 0.5). Bỏ qua để giữ pause.' },
        removeFillers: { type: 'boolean', description: 'Loại từ đệm (mặc định true).' },
        cutPadMs: { type: 'number', minimum: 0, maximum: 500, description: 'Khoảng đệm giữ quanh mỗi lần cắt từ, chia cho hai phía (ví dụ 150). Lấy từ khoảng im lặng sẵn có nên không lấn sang từ kế bên. 0 hoặc bỏ qua sẽ cắt đúng tại ranh giới từ.' },
      },
    },
  },
  {
    name: 'edit_gap',
    description:
      'Liệt kê hoặc chỉnh khoảng thở/im lặng giữa các từ nói trên clip đã chuyển lời. Khoảng được tính từ timestamp của từ (next.start − prev.end), không phải asset riêng. action=list trả về các khoảng nhìn thấy cùng afterWordIndex/gapSeconds/context. action=delete xóa một khoảng (silence→0, audio phía sau dồn về trước). action=cap nén một khoảng xuống maxSeconds (ví dụ 0.2). action=restore xóa ghi đè theo khoảng để trả lại pause gốc. Nên gọi list trước để lấy afterWordIndex. Để làm sạch pause hàng loạt trên toàn track, dùng clean_script.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'delete', 'cap', 'restore'],
          description: 'list=liệt kê khoảng; delete=xóa một khoảng; cap=nén một khoảng; restore=hoàn tác ghi đè theo khoảng.',
        },
        track: { type: 'string', description: 'Alias/id track (mặc định A1) khi bỏ qua itemId.' },
        itemId: { type: 'string', description: 'Id clip đích (chấp nhận tiền tố). Ưu tiên dùng khi nhiều clip chung một track.' },
        afterWordIndex: {
          type: 'number',
          description: 'Index của từ NGAY SAU khoảng (lấy từ list). Bắt buộc cho delete/cap/restore trừ khi truyền afterText.',
        },
        afterText: {
          type: 'string',
          description: 'Tìm khoảng theo câu nói BẮT ĐẦU sau khoảng đó (khớp trong transcript). Thay thế cho afterWordIndex.',
        },
        gapIndex: {
          type: 'number',
          description: 'Index bắt đầu từ 0 trong các khoảng có thể liệt kê của clip (lấy từ list). Thay thế cho afterWordIndex.',
        },
        maxSeconds: {
          type: 'number',
          description: 'Chỉ cap: số giây pause tối đa cần giữ (ví dụ 0.2 hoặc 0.5). Bắt buộc cho cap.',
        },
        minGapSeconds: {
          type: 'number',
          description: 'Chỉ list: khoảng raw tối thiểu cần đưa vào (mặc định 0.25s).',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'delete_text',
    description: 'Xóa một câu nói khỏi track — "xóa text = xóa video": audio của các từ khớp và thời lượng của chúng bị cắt, clip được tính lại timing. Nếu không chắc câu chính xác, hãy gọi find_transcript trước. ⚠ Chỉ clip AUDIO được tính lại timing theo cách này; clip VIDEO luôn phát liên tục từ srcInFrame — xóa từ KHÔNG cắt gì (caption vẫn phản chiếu lời nói nghe được nên không có hiệu ứng hiển thị). Để cắt clip video, dùng split_item / edit_item (srcInFrame + durationInFrames); để ẩn từng từ trong caption, dùng edit_captions action=display_text.',
    input_schema: { type: 'object', properties: { track: { type: 'string' }, query: { type: 'string', description: 'Câu cần xóa (khớp với transcript).' } }, required: ['query'] },
  },
  {
    name: 'manage_transcript',
    description: 'Sửa transcript nguồn và quản lý các biến thể dịch; phần lớn action giữ nguyên timing từ và thời lượng clip. Tám action:\n'
      + '- fix: sửa transcript nguồn. Với một từ, truyền wordIndex hoặc find chứa text nguồn sai cùng text đã sửa; chỉ word.text thay đổi. Để đổi tên hoặc gộp người nói, truyền from với nhãn hiện có như "A" cùng to là tên hiển thị mới; truyền một nhãn hiện có khác sẽ gộp người nói. Chỉ word.speaker thay đổi.\n'
      + '- clear_edits: đưa clip về transcript raw bằng cách xóa từ đã xóa, giới hạn silence, ghi đè gap và ghi đè thứ tự phát (giống nút “Khôi phục tất cả” trong panel Transcript). Tính lại timing clip theo toàn bộ thời lượng transcript.\n'
      + '- set_play_order: đổi thứ tự phát lời nói qua mảng chỉ số từ playOrder (giống kéo block lời nói trong panel Transcript). Truyền playOrder:null hoặc clearPlayOrder:true để khôi phục thứ tự thời gian. Tính lại timing clip.\n'
      + '- retry_transcription: buộc ASR chạy lại cho clip và thay transcript khi việc chuyển lời bị kẹt, lỗi hoặc cần làm mới. Nhận cùng provider override tùy chọn như transcribe_track.\n'
      + '- translation_create: dịch toàn bộ transcript sang lang và tạo hoặc thay thế biến thể dịch cấp từ dùng chung timeline nguồn.\n'
      + '- translation_ensure: dùng lại biến thể hiện có cho lang một cách idempotent hoặc tạo mới nếu chưa có. Ưu tiên action này cho yêu cầu dịch thông thường.\n'
      + '- translation_list: liệt kê transcript nguồn và mọi biến thể dịch cùng id/lang/số từ.\n'
      + '- translation_read: đọc từ của biến thể dịch được chọn bởi lang hoặc targetLanguage.\n'
      + 'Biến thể dịch chỉ chứa text đã dịch. Để hiển thị một ngôn ngữ trong caption, dùng edit_captions language_mode.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'fix', 'clear_edits', 'set_play_order', 'retry_transcription',
            'translation_create', 'translation_ensure', 'translation_list', 'translation_read',
          ],
          description: 'Xem mô tả tool: sửa từ/người nói, khôi phục chỉnh sửa, đặt thứ tự phát lời nói, chạy lại ASR hoặc quản lý bản dịch.',
        },
        itemId: { type: 'string', description: 'Id item clip đích hoặc tiền tố duy nhất; bỏ qua để dùng clip audio/video có transcript đầu tiên trên track.' },
        track: { type: 'string', description: 'Khi bỏ qua itemId, tìm theo alias hoặc id ổn định của track; mặc định A1.' },
        provider: {
          type: 'string',
          enum: ['assemblyai', 'local', 'openai', 'mistral', 'deepgram', 'groq', 'elevenlabs', 'cartesia'],
          description: 'retry_transcription: provider override đã cấu hình, tùy chọn, cùng giá trị như transcribe_track. Bỏ qua để dùng provider được chọn trong Settings.',
        },
        wordIndex: { type: 'number', description: 'fix word: index của từ cần sửa; loại trừ lẫn nhau với find.' },
        find: { type: 'string', description: 'fix word: text nguồn sai phải khớp đúng một từ; loại trừ lẫn nhau với wordIndex.' },
        text: { type: 'string', description: 'fix word: text đã sửa.' },
        from: { type: 'string', description: 'fix speaker: nhãn người nói hiện có cần đổi tên, ví dụ "A" hoặc "B".' },
        to: { type: 'string', description: 'fix speaker: tên hiển thị mới; truyền nhãn đã có sẽ gộp người nói, ví dụ "B" thành "A".' },
        playOrder: {
          type: 'array',
          items: { type: 'integer' },
          description: 'set_play_order: các index từ theo thứ tự phát. null cùng clearPlayOrder sẽ xóa ghi đè.',
        },
        clearPlayOrder: {
          type: 'boolean',
          description: 'set_play_order: khi true, xóa transcriptPlayOrder và khôi phục lời nói theo thứ tự thời gian.',
        },
        lang: { type: 'string', description: 'translation_create/ensure: ngôn ngữ đích, như English, Chinese hoặc Japanese; translation_read: ngôn ngữ của biến thể cần đọc.' },
        targetLanguage: { type: 'string', description: 'translation_read: alias của lang để chọn ngôn ngữ đã dịch.' },
      },
      required: ['action'],
    },
  },
];

export const TRANSCRIPT_TOOL_NAMES = new Set(TRANSCRIPT_TOOL_SCHEMAS.map((t) => t.name));
