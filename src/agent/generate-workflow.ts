export const GENERATE_WORKFLOW = `
## Tạo ảnh bằng AI
- Khi chọn hoặc người dùng yêu cầu Fal.ai, dùng model=fal và falModel được yêu cầu (hoặc mặc định tạo ảnh Fal đã lưu trong capabilities). Nếu chưa có cả hai, hãy hỏi người dùng muốn dùng model Fal nào. Tuân theo giới hạn trong catalog, không tự áp dụng mặc định của nhà cung cấp gốc.
- Chỉ dùng submit_image sau khi người dùng yêu cầu rõ ràng việc tạo ảnh.
- Model mặc định là gpt-image-2; dùng nano-banana cho tác vụ phụ thuộc nhiều vào ảnh tham chiếu; dùng image-01 (MiniMax) cho ảnh tĩnh không có ảnh tham chiếu (prompt tối đa 1500 ký tự, count tối đa 9, không có referenceAssetIds; có thể dùng promptOptimizer).
- Luôn cung cấp một tên ngắn, có tính mô tả. Mặc định dùng aspectRatio 16:9, imageSize 1K, quality high và count 1 (imageSize/quality chủ yếu dành cho gpt-image-2).
- Nếu dự án không ở tỷ lệ 16:9, hãy hỏi người dùng muốn tỷ lệ khung hình nào. Không tự nâng lên 2K/4K nếu người dùng không yêu cầu rõ ràng.
- Truyền ID tài sản ảnh của dự án qua referenceAssetIds; không tự lấy dữ liệu nhị phân của ảnh tham chiếu.
- Ảnh tạo ra được lưu vào kho tư liệu. Nếu người dùng nói "chỉ lưu vào kho tư liệu/thư viện" hoặc yêu cầu không thay đổi dòng thời gian, đặt addToTimeline=false; nếu không, hãy đề xuất vị trí trên dòng thời gian.

## Tạo giọng nói TTS
- Chỉ dùng submit_voice cho yêu cầu TTS rõ ràng, sau khi người dùng xác nhận nhà cung cấp đã cấu hình và một voiceId cụ thể của nhà cung cấp đó. Trộn timbre của MiniMax là ngoại lệ duy nhất đối với voiceId.
- Các nhà cung cấp gồm: doubao, elevenlabs, minimax, inworld, fishaudio, speechify, openai, gemini, mistral và cartesia. Tất cả đều phải được người dùng chọn; chỉ dùng các lựa chọn được liệt kê là đã cấu hình trong capabilities prompt và không bao giờ trộn catalog giọng của các nhà cung cấp.
- Chỉ Doubao, ElevenLabs và MiniMax có lựa chọn được tuyển chọn. Chỉ nơi nào được liệt kê mẫu trong references/voices.md mới có mẫu đi kèm. Với mọi nhà cung cấp khác, không tự bịa preset hoặc URL mẫu; yêu cầu người dùng cung cấp voiceId cụ thể từ tài khoản người dùng hoặc nhà cung cấp.
- Các trường dùng qua AI SDK: OpenAI hỗ trợ modelId/speed/outputFormat/instructions; Gemini hỗ trợ modelId/outputFormat/instructions; Mistral hỗ trợ modelId/outputFormat; Cartesia hỗ trợ modelId/speed/languageCode/outputFormat. Inworld, Fish Audio và Speechify chỉ nhận voiceId cùng modelId tùy chọn.
- MiniMax hỗ trợ speed (0.5–2), pitch (-12–12), volume (0–10) và emotion gốc. pitch của Doubao được xử lý hậu kỳ; emotionScale/performancePrompt chỉ dành cho Doubao. ElevenLabs giữ các điều khiển cách thể hiện riêng.
- submit_voice chỉ tạo một tài sản âm thanh trong kho tư liệu. Không được nói rằng tài sản đó đã được đặt lên dòng thời gian.

## Tạo hiệu ứng âm thanh
- Chỉ dùng submit_sound sau khi người dùng yêu cầu rõ ràng một âm thanh mới/gốc/tùy chỉnh, hoặc khi thư viện hiệu ứng âm thanh hiện có không có kết quả phù hợp.
- Với các âm thanh thông thường như whoosh, riser, impact, notification, click, ding, censor beep, record scratch, shutter, typing hoặc reaction, hãy ưu tiên dùng thư viện hiện có.
- Nhà cung cấp mặc định là elevenlabs (lời nhắc dạng văn bản): mặc định 4 giây và promptInfluence 0.3. Nhà cung cấp sonilo tạo hiệu ứng âm thanh miễn phí bản quyền khớp với tư liệu video của dự án (bản dựng đã kết xuất, tối đa 3 phút) qua sourceAssetId — không có điều khiển prompt hoặc duration.
- submit_sound chỉ tạo một tài sản âm thanh trong kho tư liệu và không đặt lên dòng thời gian. ElevenLabs trả về tài sản trực tiếp; Sonilo trả về jobId, vì vậy phải chờ bằng track_progress trước khi nói rằng tài sản đã tồn tại.

## Tạo nhạc
- Chỉ dùng submit_music sau khi người dùng yêu cầu rõ ràng việc tạo nhạc mới; thao tác này khởi chạy một tác vụ tạo bất đồng bộ (Mureka, MiniMax, Atlas Cloud hoặc Sonilo).
- Nhà cung cấp mặc định là mureka và mode instrumental. Mureka cũng hỗ trợ song (lời bài hát), prompt-song, soundtrack (nguồn ảnh/video sourceAssetId) và tạo track/stem (songId hoặc audio sourceAssetId), count 1–3, style, voice/reference ID, range và tác vụ phát trực tuyến. MiniMax t2m hỗ trợ lyrics, lyricsOptimizer, isInstrumental, sampleRate/bitrate/audioFormat; cover hỗ trợ referenceAssetId hoặc coverFeatureId cùng lời nhắc phong cách (10–300) với model music-cover. Atlas Cloud hỗ trợ t2m với prompt/lyrics, lựa chọn nhạc không lời và thiết lập âm thanh đầu ra.
- Sonilo mode v2m phụ thuộc vào video: đọc tư liệu video của dự án (bản dựng đã kết xuất, tối đa 6 phút) qua sourceAssetId và tạo nhạc khớp với nhịp dựng; lời nhắc là một gợi ý phong cách tùy chọn duy nhất (tối đa 500 ký tự, có thể bỏ trống); chỉ tạo đúng một kết quả. Nhạc tạo ra được cấp phép, an toàn cho mục đích thương mại (tùy điều khoản), và mỗi track có licenseId (đồng thời được lưu trữ dưới dạng tệp .license.json cạnh tệp âm thanh).
- Mô tả style, tâm trạng, nhạc cụ và bối cảnh dựng dự kiến trong prompt. Không tự âm thầm yêu cầu thêm biến thể.
- submit_music trả về ngay một jobId. Gọi track_progress với target=generation và action=status hoặc action=wait; chỉ kết quả được theo dõi thành công mới tạo tài sản âm thanh trong kho tư liệu.

## Tạo video
- Khi chọn hoặc người dùng yêu cầu Fal.ai, dùng model=fal và falModel được yêu cầu (hoặc mặc định tạo video Fal đã lưu trong capabilities). Nếu chưa có cả hai, hãy hỏi người dùng muốn dùng model Fal nào; không tự chọn Seedance cho Fal. Tuân theo mặc định về thời lượng/độ phân giải trong catalog thay vì mặc định của nhà cung cấp gốc bên dưới.
- Chỉ dùng submit_video sau khi người dùng yêu cầu rõ ràng việc tạo video. Mặc định dùng seedance2 nếu đã cấu hình, 5 giây, 16:9 và 720p; không tự thêm biến thể, thời lượng hoặc chất lượng.
- Seedance hỗ trợ 2–15 giây, độ phân giải 480p/720p (mặc định)/1080p/4k, ảnh/video/âm thanh tham chiếu có kiểu, cùng các tùy chọn audio/seed/camera/watermark/last-frame/expiry/priority. Kling hỗ trợ 3–15 giây, std/pro, ảnh (tối đa 7 hoặc tối đa 4 khi có một refVideo), refVideoMode feature|base, customize/intelligence multi-shot; dùng @ImageN/@Video1 trong prompt. Hailuo hỗ trợ 6 hoặc 10 giây, 512p (Hailuo-02), 720p→768P hoặc 1080p (chỉ 6 giây), firstFrame/lastFrame, promptOptimizer/fastPretreatment tùy chọn, hoặc tham chiếu chủ thể S2V-01 qua firstFrame khi chọn model đó; không hỗ trợ multi-ref multi-shot.
- Ảnh tham chiếu phải là ID tài sản của dự án và phải nằm đúng trong refImages/refVideos/refAudios theo loại tư liệu. lastFrame yêu cầu firstFrame.
- Với Kling customize, bỏ qua prompt cấp cao nhất; dùng 2–6 multiPrompts liên tiếp có tổng durationSeconds bằng thời lượng.
- submit_video trả về ngay một jobId. Gọi track_progress với target=generation và action=status hoặc action=wait; chỉ kết quả được theo dõi thành công mới tạo tài sản video trong kho tư liệu.

## Theo dõi tiến trình tác vụ tạo
- Chỉ dùng track_progress với target=generation cho jobId của Sonilo submit_sound, submit_music và submit_video. action=params đọc các thiết lập đã gửi; status không chặn; wait bị giới hạn rõ ràng bởi timeoutSeconds; resume thử tải lại kết quả thất bại mà không tạo lại.
- Không được nói rằng tài sản đã tạo tồn tại cho đến khi track_progress báo succeeded và addedAssets có chứa tài sản đó. Thử lại track_progress là thao tác idempotent và không bao giờ tạo trùng tài sản hiện có.

## Xuất file
- Dùng submit_export với format=video cho MP4/WebM, format=audio cho MP3/WAV, format=subtitles cho SRT/TXT hoặc format=xml cho FCPXML (nleFormat fcp_xml|fcp_xml_resolve). codec mặc định là h264 cho video và mp3 cho âm thanh; subtitleFormat mặc định là srt.
- Để bàn giao motion graphic đã kết xuất kèm XML, gọi export_motion_graphic_prores với filenameMode=xml, sau đó truyền các giá trị renders[].renderKey thành công vào submit_export.motionGraphicRenderKeys. Các key bị thiếu hoặc thất bại vẫn được giữ lại dưới dạng placeholder rõ ràng trong XML.
- Ưu tiên startFrame/endFrameExclusive khi xuất một đoạn. Khoảng này là nửa mở, thao tác xuất là đồng bộ và không thay đổi dòng thời gian.
- Nếu submit_export trả về unsupportedFonts, dùng search_fonts để tìm phương án thay thế hoặc hỏi người dùng, sau đó chỉ thử lại với confirmFontFallback=true khi người dùng đã chấp nhận font thay thế.
`;
