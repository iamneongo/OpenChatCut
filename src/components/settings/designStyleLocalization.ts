import { DESIGN_STYLE_PRESETS } from '../../editor/design-presets';
import type { Locale } from '../../i18n/locale';

const PRESET_NAME_ZH: Record<string, string> = {
  'Terracotta Editorial': '陶土杂志风',
  'Retro Duotone Print': '复古双色印刷',
  'Highlighter Notebook': '荧光笔记本',
  'Soft Organic Gradient': '柔和有机渐变',
  'Doodle Explainer': '手绘讲解风',
  'Emerald Deco': '翡翠装饰艺术',
  'Black Yellow Type': '黑黄字体风',
  'Electric Impact Type': '电光冲击字体',
  'Acid Script Poster': '酸性手写海报',
  'Neon Grid Commerce': '霓虹网格商业风',
  'Pale Tech Dashboard': '浅色科技仪表盘',
  'Liquid Aura': '流光氛围',
  'Grainy Heatwave': '颗粒热浪',
  'Blush Watercolor': '腮红水彩',
  'Archive Typewriter': '档案打字机',
  'Cubist Collage': '立体主义拼贴',
  'Redline Tech': '红线科技',
  'Black & White Neon': '黑白霓虹',
  'Violet Aura': '紫罗兰光晕',
  'Warm Paper': '暖调纸张',
  'Modern Editorial': '现代杂志编辑风',
  'Orange Minimal': '橙色极简',
  'Crimson Night Glass': '绯红夜色玻璃',
  'Jewel Deco': '宝石装饰艺术',
};

const PRESET_NAME_VI: Record<string, string> = {
  'Terracotta Editorial': 'Biên tập đất nung',
  'Retro Duotone Print': 'In hai màu hoài cổ',
  'Highlighter Notebook': 'Sổ tay bút nhớ',
  'Soft Organic Gradient': 'Chuyển màu hữu cơ mềm mại',
  'Doodle Explainer': 'Minh họa nguệch ngoạc',
  'Emerald Deco': 'Trang trí ngọc lục bảo',
  'Black Yellow Type': 'Kiểu chữ đen vàng',
  'Electric Impact Type': 'Kiểu chữ điện quang',
  'Acid Script Poster': 'Áp-phích chữ viết tay nổi bật',
  'Neon Grid Commerce': 'Thương mại lưới neon',
  'Pale Tech Dashboard': 'Bảng điều khiển công nghệ sáng',
  'Liquid Aura': 'Hào quang chất lỏng',
  'Grainy Heatwave': 'Sóng nhiệt nhiễu hạt',
  'Blush Watercolor': 'Màu nước hồng phấn',
  'Archive Typewriter': 'Máy đánh chữ lưu trữ',
  'Cubist Collage': 'Tranh ghép lập thể',
  'Redline Tech': 'Công nghệ đường đỏ',
  'Black & White Neon': 'Neon đen trắng',
  'Violet Aura': 'Hào quang tím',
  'Warm Paper': 'Giấy tông ấm',
  'Modern Editorial': 'Biên tập hiện đại',
  'Orange Minimal': 'Tối giản cam',
  'Crimson Night Glass': 'Kính đêm đỏ thẫm',
  'Jewel Deco': 'Trang trí đá quý',
};

const PRESET_GUIDE_ZH: Record<string, string> = {
  'Terracotta Editorial': '陶土杂志风：沉稳的弹簧入场与分组错峰动画，标题、姓名、要点和时间轴分别从不同方向轻缓进入。以陶土红、铜色和琥珀色为主，搭配白色文字与优雅衬线强调。',
  'Retro Duotone Print': '复古双色印刷：文字采用打字机式逐字出现，图表和时间轴线性生长，不使用透明度或缩放动画。以暖米色为底，只使用深蓝与橙红两种主色。',
  'Highlighter Notebook': '荧光笔记本：高亮笔划从左向右扫过文字，勾选线条逐步绘制，便签和装饰元素轻快弹入。使用柔和青绿色、白纸、黄色荧光笔与深灰文字。',
  'Soft Organic Gradient': '柔和有机渐变：奶油白画布搭配桃色和鼠尾草绿渐变色块，动画平滑克制、不反弹。使用衬线斜体章节号、衬线大标题和清晰的无衬线正文。',
  'Doodle Explainer': '手绘讲解风：元素以轻快弹跳方式出现，手绘星号、叉号和边框依次绘制。暖白底色搭配深蓝与红色，适合亲切、轻松的知识讲解。',
  'Emerald Deco': '翡翠装饰艺术：标题、图表和时间轴以柔和弹簧动画进入，金色线条从中心展开。深翡翠绿背景搭配奶油色文字和哑金装饰，整体典雅稳重。',
  'Black Yellow Type': '黑黄字体风：标题从遮罩中上滑，图表与时间轴直接、利落地展开。只使用纯黑、亮黄两种主色，避免灰色和渐变，形成强烈的排版冲击。',
  'Electric Impact Type': '电光冲击字体：文字逐词硬切出现，图表和节点按顺序直接显现。深电光蓝背景搭配纯红和白色，适合节奏强、信息密集的标题与数据展示。',
  'Acid Script Poster': '酸性手写海报：标题逐字出现，并混合窄体字和装饰手写体；曲线装饰逐步绘制。荧光黄绿色背景搭配纯黑文字与白色徽章，具有实验海报感。',
  'Neon Grid Commerce': '霓虹网格商业风：内容以网格卡片形式弹入，霓虹边框和图表线性生长，注释使用等宽字体逐字出现。黑色背景搭配荧光黄绿和白色正文。',
  'Pale Tech Dashboard': '浅色科技仪表盘：近白背景搭配紫蓝柔光色块，数字轻微缩放进入，图表平滑生长。使用等宽标题、像素数字和清晰正文，呈现技术感与数据感。',
  'Liquid Aura': '流光氛围：深紫蓝背景中加入持续缓慢流动的紫色、洋红和蓝色光团，文字平滑进入，进度环和指标逐步绘制。整体沉浸、流动且富有氛围。',
  'Grainy Heatwave': '颗粒热浪：元素从噪点纹理中逐渐显现，节奏缓慢、梦幻，图表使用高饱和橙色和洋红色。背景采用橙紫渐变与明显颗粒，文字保持纯白。',
  'Blush Watercolor': '腮红水彩：粉红、蓝色和桃色水彩晕染缓慢铺开，文字与图表柔和进入，线条自然绘制。使用轻盈衬线标题和清晰正文，呈现手绘、有机质感。',
  'Archive Typewriter': '档案打字机：所有文字按打字机节奏逐字出现，图表和时间轴线性绘制，元素依次登场。暖羊皮纸背景搭配黑色文字和暖金色强调。',
  'Cubist Collage': '立体主义拼贴：色块从中心弹入，文字从不同方向滑入，三角形、菱形和圆形装饰旋转出现。以奶油白为底，使用蓝、黄、红、青和橙等饱和色。',
  'Redline Tech': '红线科技：深炭黑表面、点阵纹理、锐利红色面板与斜向切换构成工业科技语言。红色负责焦点动作，白色承载主要内容，灰色仅用于次要信息。',
  'Black & White Neon': '黑白霓虹：近黑背景搭配发光白字、白色圆环、折线和描边，少量冷紫色只作为辅助光晕。每个画面保留一个明确焦点，并留出充足安静空间。',
  'Violet Aura': '紫罗兰光晕：深紫黑背景、紫粉渐变光晕、半透明大数字与圆角卡片共同形成梦幻解释风。每个画面围绕一个核心问题、数字、图表或语句展开。',
  'Warm Paper': '暖调纸张：奶油色纸张、细腻纹理、珊瑚橙强调、有机波浪与鹅卵石徽章组成温暖杂志风。衬线标题负责情绪，珊瑚色只标记真正的焦点。',
  'Modern Editorial': '现代杂志编辑风：暖灰纸张、笔记本或报刊网格、衬线标题与清晰的 Roboto 正文。整体像数据记者的批注笔记，以黑灰为主，仅用橙色或黄色强调关键数值和语句。',
  'Orange Minimal': '橙色极简：纸张质感的中性色背景、扁平几何块、粗体排版、编号徽章和简洁图表组成友好直接的商业解释风。橙色只用于关键数字、节点或横幅。',
  'Crimson Night Glass': '绯红夜色玻璃：元素从暗处柔和进入，标题和图表带克制红色辉光，圆角玻璃卡片逐步显现。近黑背景搭配暗红环境光与白色正文，适合高级暗调展示。',
  'Jewel Deco': '宝石装饰艺术：装饰边框先绘制，内容随后分组淡入，图表使用温暖渐变并带轻微旋转。近黑暖色背景搭配珊瑚、金色、青色、酒红和粉色宝石色调。',
};

const PRESET_GUIDE_VI: Record<string, string> = {
  'Terracotta Editorial': 'Phong cách biên tập ấm áp với chuyển động lò xo có chủ đích, bảng màu đất nung, đồng và hổ phách; dùng chữ trắng và kiểu chữ có chân trang nhã.',
  'Retro Duotone Print': 'Phong cách in hai màu hoài cổ: chữ xuất hiện như máy đánh chữ, biểu đồ phát triển tuyến tính, nền kem ấm với xanh hải quân và đỏ cam.',
  'Highlighter Notebook': 'Phong cách sổ tay: nét bút nhớ quét sau chữ, dấu tích được vẽ dần, giấy trắng, xanh ngọc dịu và vàng sáng.',
  'Soft Organic Gradient': 'Nền kem với mảng chuyển màu đào và xanh xô thơm, chuyển động mượt và tiết chế, kết hợp tiêu đề có chân cùng nội dung không chân.',
  'Doodle Explainer': 'Phong cách giải thích thân thiện với nét vẽ tay, dấu sao và khung xuất hiện bằng chuyển động nảy nhẹ trên nền trắng ấm.',
  'Emerald Deco': 'Phong cách trang trí ngọc lục bảo: nền xanh đậm, chữ kem, đường viền vàng và chuyển động lò xo mềm mại, thanh lịch.',
  'Black Yellow Type': 'Phong cách chữ đen vàng mạnh mẽ: bố cục trực tiếp, chỉ dùng đen và vàng sáng, không dùng chuyển màu hay xám.',
  'Electric Impact Type': 'Phong cách điện quang giàu năng lượng: chữ xuất hiện theo từng từ trên nền xanh điện, nhấn đỏ và trắng.',
  'Acid Script Poster': 'Phong cách áp-phích chữ viết tay nổi bật: chữ hẹp kết hợp nét viết tay, đường cong được vẽ dần trên nền vàng xanh huỳnh quang.',
  'Neon Grid Commerce': 'Phong cách thương mại lưới neon: nội dung bật vào theo ô lưới, viền neon và chú thích chữ đơn cách trên nền đen.',
  'Pale Tech Dashboard': 'Bảng điều khiển công nghệ sáng với nền gần trắng, mảng tím xanh dịu, số lớn và biểu đồ chuyển động mượt.',
  'Liquid Aura': 'Phong cách hào quang chất lỏng: nền tím xanh sâu, các mảng sáng tím-hồng-xanh chuyển động chậm và chữ trắng nổi bật.',
  'Grainy Heatwave': 'Phong cách sóng nhiệt nhiễu hạt: phần tử dần hiện ra từ kết cấu nhiễu, dùng cam và đỏ tươi trên nền chuyển màu mạnh.',
  'Blush Watercolor': 'Phong cách màu nước hồng phấn: các mảng hồng, xanh và đào lan nhẹ như màu nước, kết hợp tiêu đề có chân thanh thoát.',
  'Archive Typewriter': 'Phong cách máy đánh chữ lưu trữ: chữ xuất hiện từng ký tự, biểu đồ vẽ tuyến tính trên nền giấy da ấm và chữ đen.',
  'Cubist Collage': 'Phong cách tranh ghép lập thể: mảng màu bật từ tâm, chữ trượt từ nhiều hướng, dùng các hình học và màu bão hòa.',
  'Redline Tech': 'Phong cách công nghệ công nghiệp đường đỏ: bề mặt than đen, lưới chấm, bảng đỏ sắc và kiểu chữ cô đọng mạnh.',
  'Black & White Neon': 'Phong cách studio đen trắng tiết chế: nền gần đen, chữ trắng phát sáng, đường tròn và biểu đồ tuyến tính, điểm tím dùng rất ít.',
  'Violet Aura': 'Phong cách hào quang tím mộng mơ: nền tím đen, quầng chuyển tím-hồng, số lớn mờ và thẻ bo góc với chữ trắng tương phản.',
  'Warm Paper': 'Phong cách biên tập trên giấy ấm: nền kem có vân, điểm nhấn cam san hô, hình sóng hữu cơ và kiểu chữ có chân thanh lịch.',
  'Modern Editorial': 'Phong cách biên tập hiện đại: giấy xám ấm, lưới sổ tay, tiêu đề có chân và chữ Roboto rõ ràng; cam hoặc vàng chỉ nhấn điểm quan trọng.',
  'Orange Minimal': 'Phong cách tối giản cam: nền trung tính như giấy, khối hình phẳng, kiểu chữ đậm, huy hiệu đánh số và biểu đồ sạch.',
  'Crimson Night Glass': 'Phong cách kính đêm đỏ thẫm: phần tử dịu dàng hiện ra từ bóng tối, thẻ kính bo góc và ánh đỏ tiết chế trên nền gần đen.',
  'Jewel Deco': 'Phong cách trang trí đá quý: khung viền được vẽ trước, nội dung hiện theo nhóm, dùng san hô, vàng, xanh ngọc, đỏ rượu và hồng.',
};

const ROLE_ZH: Record<string, string> = {
  primary: '主色',
  secondary: '辅色',
  accent: '强调色',
  background: '背景',
  text: '文字',
  'text secondary': '次要文字',
  'text-secondary': '次要文字',
  'text-on-dark': '深色背景文字',
  heading: '标题字体',
  body: '正文字体',
  quote: '引用字体',
  display: '展示字体',
  'display number': '数字展示字体',
  mono: '等宽字体',
  script: '手写字体',
  'heading serif': '衬线标题字体',
  Chinese: '中文字体',
  'Chinese heading': '中文标题字体',
  'Chinese body': '中文正文字体',
  'Chinese accent': '中文强调字体',
  'Chinese quote': '中文引用字体',
  'accent copper': '强调铜色',
  'accent amber': '强调琥珀色',
  'accent tan': '强调棕褐色',
  'accent gradient start': '强调渐变起始色',
  'accent gradient end': '强调渐变结束色',
  'accent-red': '强调红色',
  'accent-red-dark': '深强调红色',
  'accent-red-panel': '面板强调红色',
  'accent-red-vivid': '鲜艳强调红色',
  axis: '坐标轴',
  'background-chart': '图表背景',
  'background-neutral': '中性背景',
  'background-warm': '暖色背景',
  'background gradient start': '背景渐变起始色',
  'background gradient end': '背景渐变结束色',
  'chart-warm-light': '图表暖色浅调',
  'chart-warm-mid': '图表暖色中间调',
  'chart-warm-dark': '图表暖色深调',
  'chart-warm-deep': '图表暖色最深调',
  'chart accent 1': '图表强调色 1',
  'chart accent 2': '图表强调色 2',
  'chart accent 3': '图表强调色 3',
  highlight: '高亮色',
  badge: '徽章色',
  callout: '标注色',
  divider: '分隔线',
  grid: '网格线',
  paper: '纸张色',
  sticky: '便签色',
  texture: '纹理色',
  glow: '光晕色',
  'glow-main': '主光晕',
  'glow-soft': '柔光晕',
  'inner-glow': '内发光',
  'meta-text': '辅助文字',
  impact: '冲击色',
  neon: '霓虹色',
  'price-card': '价格卡片',
  'blob blue': '蓝色光团',
  'blob deep purple': '深紫光团',
  'blob green': '绿色光团',
  'blob magenta': '洋红光团',
  'blob purple': '紫色光团',
  'blob warm': '暖色光团',
  'wash blue': '蓝色水彩',
  'wash flower': '花朵水彩',
  'wash peach': '桃色水彩',
  'wash pink': '粉色水彩',
  burgundy: '酒红色',
  cobalt: '钴蓝色',
  coral: '珊瑚色',
  gold: '金色',
  orange: '橙色',
  pink: '粉色',
  red: '红色',
  teal: '青绿色',
  yellow: '黄色',
};

const ROLE_VI: Record<string, string> = {
  primary: 'màu chính', secondary: 'màu phụ', accent: 'màu nhấn', background: 'nền', text: 'chữ',
  'text secondary': 'chữ phụ', 'text-secondary': 'chữ phụ', 'text-on-dark': 'chữ trên nền tối',
  heading: 'phông chữ tiêu đề', body: 'phông chữ nội dung', quote: 'phông chữ trích dẫn', display: 'phông chữ trình bày',
  'display number': 'phông chữ số trình bày', mono: 'phông chữ đơn cách', script: 'phông chữ viết tay',
  'heading serif': 'phông chữ có chân cho tiêu đề', Chinese: 'phông chữ tiếng Trung', 'Chinese heading': 'phông chữ tiêu đề tiếng Trung',
  'Chinese body': 'phông chữ nội dung tiếng Trung', 'Chinese accent': 'phông chữ nhấn tiếng Trung', 'Chinese quote': 'phông chữ trích dẫn tiếng Trung',
  'accent copper': 'màu nhấn đồng', 'accent amber': 'màu nhấn hổ phách', 'accent tan': 'màu nhấn nâu vàng',
  'accent gradient start': 'đầu chuyển màu nhấn', 'accent gradient end': 'cuối chuyển màu nhấn',
  'accent-red': 'màu nhấn đỏ', 'accent-red-dark': 'màu nhấn đỏ sẫm', 'accent-red-panel': 'màu nhấn đỏ cho bảng',
  'accent-red-vivid': 'màu nhấn đỏ tươi', axis: 'trục', 'background-chart': 'nền biểu đồ',
  'background-neutral': 'nền trung tính', 'background-warm': 'nền tông ấm',
  'background gradient start': 'đầu chuyển màu nền', 'background gradient end': 'cuối chuyển màu nền',
  'chart-warm-light': 'màu ấm sáng của biểu đồ', 'chart-warm-mid': 'màu ấm giữa của biểu đồ',
  'chart-warm-dark': 'màu ấm tối của biểu đồ', 'chart-warm-deep': 'màu ấm rất tối của biểu đồ',
  'chart accent 1': 'màu nhấn biểu đồ 1', 'chart accent 2': 'màu nhấn biểu đồ 2', 'chart accent 3': 'màu nhấn biểu đồ 3',
  highlight: 'màu tô sáng', badge: 'màu huy hiệu', callout: 'màu chú thích', divider: 'màu đường phân cách',
  grid: 'màu đường lưới', paper: 'màu giấy', sticky: 'màu giấy ghi chú', texture: 'màu họa tiết', glow: 'màu quầng sáng',
  'glow-main': 'quầng sáng chính', 'glow-soft': 'quầng sáng mềm', 'inner-glow': 'quầng sáng bên trong',
  'meta-text': 'chữ phụ trợ', impact: 'màu tương phản', neon: 'màu neon', 'price-card': 'thẻ giá',
  'blob blue': 'mảng xanh dương', 'blob deep purple': 'mảng tím đậm', 'blob green': 'mảng xanh lá',
  'blob magenta': 'mảng đỏ tươi', 'blob purple': 'mảng tím', 'blob warm': 'mảng tông ấm',
  'wash blue': 'màu nước xanh dương', 'wash flower': 'màu nước hoa', 'wash peach': 'màu nước đào',
  'wash pink': 'màu nước hồng', burgundy: 'đỏ rượu', cobalt: 'xanh cô-ban', coral: 'san hô', gold: 'vàng kim',
  orange: 'cam', pink: 'hồng', red: 'đỏ', teal: 'xanh ngọc', yellow: 'vàng',
};

const FONT_ROLE_ZH: Record<string, string> = {
  ...ROLE_ZH,
  accent: '强调字体',
  callout: '标注字体',
  impact: '冲击字体',
};

const GUIDE_ZH_BY_SOURCE = new Map(
  DESIGN_STYLE_PRESETS
    .filter((preset) => preset.style.styleGuide && PRESET_GUIDE_ZH[preset.name])
    .map((preset) => [preset.style.styleGuide as string, PRESET_GUIDE_ZH[preset.name]]),
);
const GUIDE_VI_BY_SOURCE = new Map(
  DESIGN_STYLE_PRESETS
    .filter((preset) => preset.style.styleGuide && PRESET_GUIDE_VI[preset.name])
    .map((preset) => [preset.style.styleGuide as string, PRESET_GUIDE_VI[preset.name]]),
);

export function localizeDesignPresetName(name: string, locale: Locale): string {
  if (locale === 'zh') return PRESET_NAME_ZH[name] ?? name;
  if (locale === 'vi') return PRESET_NAME_VI[name] ?? name;
  return name;
}
export function localizeDesignRole(role: string, locale: Locale): string {
  if (locale === 'zh') return ROLE_ZH[role] ?? role;
  if (locale === 'vi') return ROLE_VI[role] ?? role;
  return role;
}

export function localizeDesignFontRole(role: string, locale: Locale): string {
  if (locale === 'zh') return FONT_ROLE_ZH[role] ?? role;
  if (locale === 'vi') return ROLE_VI[role] ?? role;
  return role;
}

export function localizeDesignStyleGuide(guide: string, locale: Locale): string {
  if (locale === 'zh') return GUIDE_ZH_BY_SOURCE.get(guide) ?? guide;
  if (locale === 'vi') return GUIDE_VI_BY_SOURCE.get(guide) ?? guide;
  return guide;
}
