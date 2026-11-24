/* My skin — interface languages (English source, Arabic, Korean).
   The app renders English; this file translates text nodes and a few attributes in place
   as they appear (MutationObserver), so every screen follows the chosen language.
   Keys are the English text. "{}" in a key matches any text; the matched parts are
   translated too and fill {0}, {1}… in the value. An Arabic value written "feminine¦masculine"
   follows the sex chosen in the medical profile. */
(function(){
const LANGS = {
  en: {name:'English', dir:'ltr', locale:'en'},
  ar: {name:'العربية', dir:'rtl', locale:'ar-u-nu-latn'},
  ko: {name:'한국어', dir:'ltr', locale:'ko'}
};

// [English, Arabic, Korean]
const D = [
// brand and chrome
['My skin', 'بشرتي', '마이 스킨'],
['Your daily skincare companion', 'رفيقتك اليومية للعناية بالبشرة¦رفيقك اليومي للعناية بالبشرة', '매일 함께하는 스킨케어 도우미'],
['My skin — your daily skincare companion', 'بشرتي — رفيقتك اليومية للعناية بالبشرة', '마이 스킨 — 매일 함께하는 스킨케어 도우미'],
['My skin is a guidance tool for everyday skincare and does not replace a dermatologist, especially if you have a chronic health condition. Camera results are approximate and depend on lighting.',
 'بشرتي أداة إرشادية للعناية اليومية بالبشرة ولا تُغني عن طبيب الجلدية، خاصة إذا كانت لديك حالة صحية مزمنة. نتائج الكاميرا تقريبية وتعتمد على الإضاءة.',
 '마이 스킨은 일상 스킨케어를 위한 안내 도구이며, 특히 만성 질환이 있는 경우 피부과 전문의를 대신하지 않습니다. 카메라 결과는 대략적이며 조명에 따라 달라집니다.'],
['Home', 'الرئيسية', '홈'],
['Language', 'اللغة', '언어'],
['Medical profile', 'الملف الطبي', '건강 프로필'],
['Profile', 'الملف', '프로필'],
['Skin type', 'نوع البشرة', '피부 타입'],
['Pore scan', 'فحص المسام', '모공 스캔'],
['Pores', 'المسام', '모공'],
['Ingredient check', 'فحص المكونات', '성분 확인'],
['Ingredients', 'المكونات', '성분'],
['Sunscreen', 'واقي الشمس', '선크림'],

// UV and weather
['Low', 'منخفض', '낮음'],
['Low risk, but sunscreen still helps if you will be outside for a long time.', 'الخطر منخفض، لكن واقي الشمس يفيد إذا كنت ستبقى في الخارج لوقت طويل.', '위험은 낮지만 밖에 오래 있을 예정이라면 자외선 차단제가 도움이 됩니다.'],
['Moderate', 'متوسط', '보통'],
['Apply SPF 30+ sunscreen 15 minutes before going out.', 'ضعي واقي شمس SPF 30+ قبل الخروج بـ15 دقيقة.¦ضع واقي شمس SPF 30+ قبل الخروج بـ15 دقيقة.', '외출 15분 전에 SPF 30 이상 자외선 차단제를 바르세요.'],
['High', 'مرتفع', '높음'],
['Use SPF 50 and reapply every 2 hours, with a hat and sunglasses.', 'استخدمي SPF 50 وجدّديه كل ساعتين، مع قبعة ونظارة شمسية.¦استخدم SPF 50 وجدّده كل ساعتين، مع قبعة ونظارة شمسية.', 'SPF 50을 사용하고 2시간마다 덧바르세요. 모자와 선글라스도 함께 쓰세요.'],
['Very high', 'مرتفع جدًا', '매우 높음'],
['Avoid direct sun from 11 am to 3 pm as much as you can.', 'تجنّبي الشمس المباشرة من 11 صباحًا إلى 3 عصرًا قدر الإمكان.¦تجنّب الشمس المباشرة من 11 صباحًا إلى 3 عصرًا قدر الإمكان.', '오전 11시부터 오후 3시까지는 직사광선을 최대한 피하세요.'],
['Extreme', 'شديد جدًا', '위험'],
['Stay in the shade as much as you can — skin can burn within minutes.', 'ابقي في الظل قدر الإمكان — قد تحترق البشرة خلال دقائق.¦ابقَ في الظل قدر الإمكان — قد تحترق البشرة خلال دقائق.', '최대한 그늘에 머무르세요. 몇 분 만에 피부가 탈 수 있습니다.'],
['This browser does not support location.', 'هذا المتصفح لا يدعم تحديد الموقع.', '이 브라우저는 위치 기능을 지원하지 않습니다.'],
['Could not load weather data, please try again.', 'تعذّر تحميل بيانات الطقس، حاولي مرة أخرى.¦تعذّر تحميل بيانات الطقس، حاول مرة أخرى.', '날씨 정보를 불러오지 못했습니다. 다시 시도해 주세요.'],
['Location permission was not granted.', 'لم يتم منح إذن الموقع.', '위치 권한이 허용되지 않았습니다.'],
['Could not find your current location.', 'تعذّر تحديد موقعك الحالي.', '현재 위치를 찾을 수 없습니다.'],
['UV right now', 'الأشعة فوق البنفسجية الآن', '현재 자외선'],
['Refresh', 'تحديث', '새로고침'],
['Finding your location and UV index…', 'جارٍ تحديد موقعك ومؤشر الأشعة…', '위치와 자외선 지수를 찾는 중…'],
['Turn on location to see the UV index and temperature where you are.', 'فعّلي الموقع لرؤية مؤشر الأشعة فوق البنفسجية ودرجة الحرارة في مكانك.¦فعّل الموقع لرؤية مؤشر الأشعة فوق البنفسجية ودرجة الحرارة في مكانك.', '위치를 켜면 현재 위치의 자외선 지수와 기온을 볼 수 있습니다.'],
['Use my current location', 'استخدم موقعي الحالي', '현재 위치 사용'],
['UV index now', 'مؤشر الأشعة الآن', '현재 자외선 지수'],
['UV {}', 'مؤشر الأشعة {0}', '자외선 {0}'],
['UV {} at your location', 'مؤشر الأشعة {0} في موقعك', '현재 위치 자외선 {0}'],
['UV {} (estimated — turn on location for a real value)', 'مؤشر الأشعة {0} (تقديري — فعّل الموقع للحصول على قيمة حقيقية)', '자외선 {0} (추정치 — 실제 값을 보려면 위치를 켜세요)'],
['{}°', '{0}°', '{0}°'],
['Oil production: {}', 'إفراز الدهون: {0}', '피지 분비: {0}'],
['We recommend seeing a dermatologist: {}', 'ننصح بمراجعة طبيب جلدية: {0}', '피부과 진료를 권장합니다: {0}'],
['🩺 We recommend seeing a dermatologist: {}', '🩺 ننصح بمراجعة طبيب جلدية: {0}', '🩺 피부과 진료를 권장합니다: {0}'],
['Coverage = share of measured points whose colour changed beyond their own noise (CIELAB ΔE).', 'التغطية = نسبة النقاط المقاسة التي تغيّر لونها أكثر من تذبذبها الطبيعي (CIELAB ΔE).', '커버리지 = 측정 포인트 중 자체 노이즈보다 색이 더 크게 변한 비율(CIELAB ΔE).'],
['Protection is a model estimate, not a lab measurement.', 'الحماية تقدير من نموذج، وليست قياسًا مخبريًا.', '보호력은 모델 추정치이며 실험실 측정값이 아닙니다.'],
['UV {}, peak {}','مؤشر الأشعة {0}، الذروة {1}', '자외선 {0}, 최고 {1}'],
['today’s peak {}','ذروة اليوم {0}', '오늘 최고 {0}'],
['UV index now {} ({})', 'مؤشر الأشعة الآن {0} ({1})', '현재 자외선 지수 {0} ({1})'],
['Last product checked: {}', 'آخر منتج تم فحصه: {0}', '마지막으로 확인한 제품: {0}'],
['Sunscreen coverage {}%', 'تغطية واقي الشمس {0}%', '자외선 차단제 커버리지 {0}%'],
['don’t forget: {}', 'لا تنسي: {0}¦لا تنسَ: {0}', '잊지 마세요: {0}'],
['Age {}', 'العمر {0}', '나이 {0}'],
['Your current result: {}', 'نتيجتك الحالية: {0}', '현재 결과: {0}'],
['Answered {} of {}', 'تمت الإجابة على {0} من {1}', '{1}개 중 {0}개 답변'],
['Apply on {}', 'ضعيه على {0}¦ضعه على {0}', '{0}에 바르세요'],
['lightness L*', 'السطوع L*', '밝기 L*'],
['whitening', 'التبييض', '백탁'],
['shine', 'اللمعان', '광택'],
['{}/{} pts', '{0}/{1} نقطة', '{0}/{1} 포인트'],

// reminder
['Reapply sunscreen now, especially on your nose, ears and neck.', 'جدّدي واقي الشمس الآن، خاصة على الأنف والأذنين والرقبة.¦جدّد واقي الشمس الآن، خاصة على الأنف والأذنين والرقبة.', '지금 자외선 차단제를 덧바르세요. 특히 코, 귀, 목에 신경 쓰세요.'],
['Notification', 'إشعار', '알림'],
['Time to reapply sunscreen', 'حان وقت تجديد واقي الشمس', '자외선 차단제를 덧바를 시간입니다'],
['{} h {} min', '{0} س {1} د', '{0}시간 {1}분'],
['{} min', '{0} د', '{0}분'],
['{} h', '{0} س', '{0}시간'],
['Time’s up — reapply sunscreen now.', 'انتهى الوقت — جدّدي واقي الشمس الآن.¦انتهى الوقت — جدّد واقي الشمس الآن.', '시간이 됐습니다 — 지금 자외선 차단제를 덧바르세요.'],
['Done — remind me in 2 hours', 'تم — ذكّرني بعد ساعتين', '완료 — 2시간 뒤에 알려 주세요'],
['Stop', 'إيقاف', '중지'],
['Notifications are off, so the reminder will only show inside the page.', 'الإشعارات متوقفة، لذلك سيظهر التذكير داخل الصفحة فقط.', '알림이 꺼져 있어 알림은 페이지 안에서만 표시됩니다.'],
['Next reapplication in', 'التجديد القادم بعد', '다음 덧바르기까지'],
['The reminder works while the page is open.', 'يعمل التذكير ما دامت الصفحة مفتوحة.', '알림은 페이지가 열려 있는 동안 작동합니다.'],
['Cancel reminder', 'إلغاء التذكير', '알림 취소'],
['Sunscreen reminder', 'تذكير واقي الشمس', '자외선 차단제 알림'],
['Remind me to reapply in 2 hours', 'ذكّرني بالتجديد بعد ساعتين', '2시간 뒤에 덧바르라고 알려 주세요'],
['Swimming or sweating? Remind me in 80 minutes', 'سباحة أو تعرّق؟ ذكّرني بعد 80 دقيقة', '수영하거나 땀을 흘리나요? 80분 뒤에 알려 주세요'],
['Reminder set for {}.', 'تم ضبط التذكير بعد {0}.', '{0} 뒤로 알림을 설정했습니다.'],

// skin types
['Oily', 'دهنية', '지성'],
['High oil and shine, especially in the T-zone, with more visible pores.', 'دهون ولمعان عاليان، خاصة في منطقة T، مع مسام أوضح.', '특히 T존에 유분과 번들거림이 많고 모공이 더 잘 보입니다.'],
['Dry', 'جافة', '건성'],
['Feels tight and may flake; needs rich moisture and barrier care.', 'تشعر بالشدّ وقد تتقشر؛ تحتاج ترطيبًا غنيًا وعناية بالحاجز.', '당기고 각질이 일어날 수 있어 풍부한 보습과 장벽 관리가 필요합니다.'],
['Combination', 'مختلطة', '복합성'],
['Oily on the forehead, nose and chin; normal or dry on the cheeks.', 'دهنية في الجبهة والأنف والذقن؛ عادية أو جافة على الخدين.', '이마, 코, 턱은 지성이고 볼은 중성 또는 건성입니다.'],
['Sensitive', 'حساسة', '민감성'],
['Gets irritated or red easily; short, fragrance-free ingredient lists work best.', 'تتهيّج أو تحمرّ بسهولة؛ الأنسب قوائم مكونات قصيرة وخالية من العطور.', '쉽게 자극받거나 붉어집니다. 성분이 적고 무향인 제품이 가장 좋습니다.'],
['Normal', 'عادية', '중성'],
['Balanced, without noticeable oiliness or dryness; a simple, steady routine works.', 'متوازنة، بلا دهون أو جفاف ملحوظ؛ يكفيها روتين بسيط ومنتظم.', '눈에 띄는 유분이나 건조함 없이 균형 잡혀 있어 간단하고 꾸준한 루틴이면 충분합니다.'],
['{} skin', 'بشرة {0}', '{0} 피부'],
['Unrated', 'غير مقيّم', '평가 없음'],

// routine
['Pregnancy or breastfeeding', 'الحمل أو الرضاعة', '임신 또는 수유'],
['Gentle gel cleanser', 'غسول جل لطيف', '순한 젤 클렌저'],
['Niacinamide serum', 'سيروم النياسيناميد', '나이아신아마이드 세럼'],
['Light oil-free moisturiser', 'مرطب خفيف خالٍ من الزيوت', '가벼운 오일프리 보습제'],
['Lightweight SPF 30+ sunscreen', 'واقي شمس خفيف SPF 30+', '가벼운 SPF 30+ 자외선 차단제'],
['Gel cleanser', 'غسول جل', '젤 클렌저'],
['Salicylic acid 2–3 times a week', 'حمض الساليسيليك 2–3 مرات أسبوعيًا', '살리실산 주 2–3회'],
['Light moisturiser', 'مرطب خفيف', '가벼운 보습제'],
['Sulfate-free cream cleanser', 'غسول كريمي خالٍ من الكبريتات', '설페이트 프리 크림 클렌저'],
['Hyaluronic acid on damp skin', 'حمض الهيالورونيك على بشرة رطبة', '촉촉한 피부에 히알루론산'],
['Ceramide-rich moisturiser', 'مرطب غني بالسيراميد', '세라마이드가 풍부한 보습제'],
['Moisturising SPF 30+ sunscreen', 'واقي شمس مرطب SPF 30+', '보습 SPF 30+ 자외선 차단제'],
['Cream cleanser', 'غسول كريمي', '크림 클렌저'],
['Rich moisturiser or night balm', 'مرطب غني أو بلسم ليلي', '리치 보습제 또는 나이트 밤'],
['Lukewarm water instead of hot', 'ماء فاتر بدل الساخن', '뜨거운 물 대신 미지근한 물'],
['Gentle cleanser', 'غسول لطيف', '순한 클렌저'],
['Niacinamide', 'نياسيناميد', '나이아신아마이드'],
['Light moisturiser for the T-zone', 'مرطب خفيف لمنطقة T', 'T존용 가벼운 보습제'],
['SPF 30+ sunscreen', 'واقي شمس SPF 30+', 'SPF 30+ 자외선 차단제'],
['Salicylic acid on the T-zone twice a week', 'حمض الساليسيليك على منطقة T مرتين أسبوعيًا', 'T존에 살리실산 주 2회'],
['Richer moisturiser for the cheeks', 'مرطب أغنى للخدين', '볼에는 더 리치한 보습제'],
['Fragrance-free cleanser', 'غسول خالٍ من العطور', '무향 클렌저'],
['Moisturiser with few ingredients (ceramides, panthenol)', 'مرطب قليل المكونات (سيراميد، بانثينول)', '성분이 적은 보습제 (세라마이드, 판테놀)'],
['Mineral sunscreen (zinc oxide)', 'واقي شمس معدني (أكسيد الزنك)', '무기자차 (징크옥사이드)'],
['Soothing moisturiser', 'مرطب مهدّئ', '진정 보습제'],
['Patch-test any new product on a small area for 48 hours', 'اختبري أي منتج جديد على مساحة صغيرة لمدة 48 ساعة¦اختبر أي منتج جديد على مساحة صغيرة لمدة 48 ساعة', '새 제품은 작은 부위에 48시간 동안 패치 테스트하세요'],
['Antioxidant such as vitamin C', 'مضاد أكسدة مثل فيتامين C', '비타민 C 같은 항산화제'],
['Moisturiser', 'مرطب', '보습제'],
['Avoid retinol while pregnant or breastfeeding', 'تجنّبي الريتينول أثناء الحمل أو الرضاعة', '임신·수유 중에는 레티놀을 피하세요'],
['Low-strength retinol (optional)', 'ريتينول منخفض التركيز (اختياري)', '저농도 레티놀 (선택)'],
['None', 'لا شيء', '없음'],

// home
['My skin · {}', 'بشرتي · {0}', '마이 스킨 · {0}'],
['Coverage {}%', 'التغطية {0}%', '커버리지 {0}%'],
['Not started yet', 'لم يبدأ بعد', '아직 시작하지 않음'],
['You have {} without current medical follow-up — we recommend seeing a dermatologist before using treatment products.', 'لديك {0} دون متابعة طبية حالية — ننصح بمراجعة طبيب جلدية قبل استخدام المنتجات العلاجية.', '현재 의료 관리 없이 {0}이(가) 있습니다 — 치료 제품을 쓰기 전에 피부과 진료를 권장합니다.'],
['Because of pregnancy or breastfeeding: avoid retinoids and hydroquinone.', 'بسبب الحمل أو الرضاعة: تجنّبي الريتينويدات والهيدروكينون.', '임신 또는 수유 중이므로 레티노이드와 하이드로퀴논을 피하세요.'],
['Your skin is', 'بشرتك', '당신의 피부는'],
['My skin:', 'بشرتي:', '마이 스킨:'],
['We recommend seeing a dermatologist:', 'ننصح بمراجعة طبيب جلدية:', '피부과 진료를 권장합니다:'],
['Clear shine on: {} — focus your cleanser and oil-control products there.', 'لمعان واضح على: {0} — ركّزي الغسول ومنتجات ضبط الدهون هناك.¦لمعان واضح على: {0} — ركّز الغسول ومنتجات ضبط الدهون هناك.', '번들거림이 뚜렷한 부위: {0} — 클렌저와 피지 조절 제품을 그곳에 집중하세요.'],
['The scan showed no strong oily shine.', 'لم يُظهر الفحص لمعانًا دهنيًا قويًا.', '스캔 결과 강한 유분 번들거림은 없었습니다.'],
['Last product checked:', 'آخر منتج تم فحصه:', '마지막으로 확인한 제품:'],
['Sunscreen coverage', 'تغطية واقي الشمس', '자외선 차단제 커버리지'],
['You haven’t completed the medical profile or the skin type quiz yet. Start with step 1 to get accurate recommendations.', 'لم تكملي الملف الطبي أو اختبار نوع البشرة بعد. ابدئي بالخطوة 1 لتحصلي على توصيات دقيقة.¦لم تكمل الملف الطبي أو اختبار نوع البشرة بعد. ابدأ بالخطوة 1 لتحصل على توصيات دقيقة.', '아직 건강 프로필이나 피부 타입 퀴즈를 완료하지 않았습니다. 정확한 추천을 받으려면 1단계부터 시작하세요.'],
['Your suggested routine', 'روتينك المقترح', '추천 루틴'],
['skin routine', 'روتين البشرة', '피부 루틴'],
['{} skin routine', 'روتين البشرة {0}', '{0} 피부 루틴'],
['Morning', 'الصباح', '아침'],
['Evening', 'المساء', '저녁'],
['Delete all my data', 'حذف جميع بياناتي', '내 데이터 모두 삭제'],
['Your skin summary', 'ملخص بشرتك', '피부 요약'],
['At a glance', 'نظرة سريعة', '한눈에 보기'],
['Five steps · {} of 5', 'خمس خطوات · {0} من 5', '5단계 · {0}/5 완료'],
['Five steps', 'خمس خطوات', '5단계'],
['{} of 5', '{0} من 5', '{0}/5'],
['Your skin journey', 'رحلة بشرتك', '나의 피부 여정'],
['Complete each step for a full analysis tailored to your skin.', 'أكملي كل خطوة للحصول على تحليل كامل مصمم لبشرتك.¦أكمل كل خطوة للحصول على تحليل كامل مصمم لبشرتك.', '각 단계를 완료하면 내 피부에 맞춘 전체 분석을 받을 수 있습니다.'],

// medical profile
['Diabetes', 'السكري', '당뇨병'],
['High blood pressure', 'ضغط الدم المرتفع', '고혈압'],
['Known skin allergy', 'حساسية جلدية معروفة', '알려진 피부 알레르기'],
['Eczema', 'الإكزيما', '습진'],
['Psoriasis', 'الصدفية', '건선'],
['Rosacea', 'الوردية', '주사'],
['Hormonal acne', 'حب الشباب الهرموني', '호르몬성 여드름'],
['Low (mostly indoors)', 'قليل (غالبًا في الداخل)', '적음 (주로 실내)'],
['Moderate (1–2 hours a day)', 'متوسط (1–2 ساعة يوميًا)', '보통 (하루 1–2시간)'],
['High (outdoor work or sport)', 'كثير (عمل أو رياضة في الخارج)', '많음 (야외 근무나 운동)'],
['Step {} of 5', 'الخطوة {0} من 5', '5단계 중 {0}단계'],
['Your information stays on your device only. It helps us tailor recommendations and flag unsuitable ingredients.', 'تبقى معلوماتك على جهازك فقط، وتساعدنا على تخصيص التوصيات والتنبيه إلى المكونات غير المناسبة.', '정보는 기기에만 저장됩니다. 맞춤 추천과 맞지 않는 성분 표시에 사용됩니다.'],
['Sex', 'الجنس', '성별'],
['Female', 'أنثى', '여성'],
['Male', 'ذكر', '남성'],
['Age', 'العمر', '나이'],
['Do you have any of these conditions?', 'هل لديك أي من هذه الحالات؟', '다음 중 해당하는 질환이 있나요?'],
['Medications you currently take (optional)', 'الأدوية التي تتناولينها حاليًا (اختياري)¦الأدوية التي تتناولها حاليًا (اختياري)', '현재 복용 중인 약 (선택)'],
['Allergies to specific ingredients (optional)', 'حساسية من مكونات معينة (اختياري)', '특정 성분 알레르기 (선택)'],
['How much sun do you usually get?', 'كم تتعرضين للشمس عادة؟¦كم تتعرض للشمس عادة؟', '평소 햇빛에 얼마나 노출되나요?'],
['Save and continue', 'حفظ ومتابعة', '저장하고 계속'],
['e.g. 26', 'مثال: 26', '예: 26'],
['e.g. isotretinoin, an antibiotic…', 'مثال: الإيزوتريتينوين، مضاد حيوي…', '예: 이소트레티노인, 항생제…'],
['e.g. fragrance, lanolin…', 'مثال: العطور، اللانولين…', '예: 향료, 라놀린…'],
['Choose your sex first.', 'اختاري الجنس أولًا.¦اختر الجنس أولًا.', '먼저 성별을 선택하세요.'],
['Enter a valid age between 10 and 100.', 'أدخلي عمرًا صحيحًا بين 10 و100.¦أدخل عمرًا صحيحًا بين 10 و100.', '10에서 100 사이의 올바른 나이를 입력하세요.'],
['Choose at least one condition, or "None".', 'اختاري حالة واحدة على الأقل، أو "لا شيء".¦اختر حالة واحدة على الأقل، أو "لا شيء".', '질환을 하나 이상 선택하거나 "없음"을 선택하세요.'],
['Before you continue', 'قبل المتابعة', '계속하기 전에'],
['A condition that needs medical supervision', 'حالة تحتاج إلى إشراف طبي', '의료 관리가 필요한 질환'],
['You selected "', 'اخترتِ "¦اخترتَ "', '선택한 항목: "'],
['". My skin’s recommendations are general and may not suit this condition without medical follow-up. Are you currently under a specialist’s care for it?', '". توصيات بشرتي عامة وقد لا تناسب هذه الحالة دون متابعة طبية. هل تتابعين حاليًا مع طبيب مختص بشأنها؟¦". توصيات بشرتي عامة وقد لا تناسب هذه الحالة دون متابعة طبية. هل تتابع حاليًا مع طبيب مختص بشأنها؟', '". 마이 스킨의 추천은 일반적인 내용이라 의료 관리 없이는 이 질환에 맞지 않을 수 있습니다. 현재 전문의의 진료를 받고 있나요?'],
['Yes, I’m under medical care', 'نعم، أنا تحت متابعة طبية', '네, 진료를 받고 있습니다'],
['No, not right now', 'لا، ليس حاليًا', '아니요, 지금은 아닙니다'],
['We recommend seeing a dermatologist — we’ll continue with general advice.', 'ننصح بمراجعة طبيب جلدية — وسنكمل بنصائح عامة.', '피부과 진료를 권장합니다 — 일반적인 조언으로 계속 진행합니다.'],

// skin type quiz
['How does your skin feel two hours after washing, with no products on?', 'كيف تشعر بشرتك بعد ساعتين من غسلها دون أي منتجات؟', '세안 2시간 후, 아무것도 바르지 않았을 때 피부가 어떤가요?'],
['Shiny and oily, especially on the forehead and nose', 'لامعة ودهنية، خاصة على الجبهة والأنف', '번들거리고 기름짐, 특히 이마와 코'],
['Noticeable oil', 'دهون ملحوظة', '눈에 띄는 유분'],
['Tight and on the dry side', 'مشدودة ومائلة للجفاف', '당기고 건조한 편'],
['Feels tight or flaky', 'شدّ أو تقشر', '당김이나 각질'],
['Oily in the T-zone and dry on the cheeks', 'دهنية في منطقة T وجافة على الخدين', 'T존은 지성, 볼은 건조'],
['Different across the face', 'تختلف من منطقة لأخرى', '부위마다 다름'],
['Balanced and comfortable', 'متوازنة ومريحة', '균형 잡히고 편안함'],
['Neither oily nor dry', 'لا دهنية ولا جافة', '지성도 건성도 아님'],
['Do you often get breakouts or enlarged pores?', 'هل تظهر لديك حبوب أو مسام واسعة كثيرًا؟', '트러블이나 넓은 모공이 자주 생기나요?'],
['Yes, often', 'نعم، كثيرًا', '네, 자주요'],
['Sometimes, only in the T-zone', 'أحيانًا، في منطقة T فقط', '가끔, T존에만'],
['Rarely, but my skin gets irritated easily', 'نادرًا، لكن بشرتي تتهيّج بسهولة', '드물지만 피부가 쉽게 자극받아요'],
['Very rarely', 'نادرًا جدًا', '거의 없어요'],
['How does your skin react to new products?', 'كيف تتفاعل بشرتك مع المنتجات الجديدة؟', '새 제품에 피부가 어떻게 반응하나요?'],
['Turns red or irritated quickly', 'تحمرّ أو تتهيّج بسرعة', '금방 붉어지거나 자극받아요'],
['Clearly reactive to ingredients', 'تتفاعل بوضوح مع المكونات', '성분에 확실히 반응함'],
['Sometimes flakes with certain products', 'تتقشر أحيانًا مع بعض المنتجات', '일부 제품에 가끔 각질이 생겨요'],
['Handles most products without problems', 'تتحمل معظم المنتجات دون مشاكل', '대부분의 제품을 문제없이 써요'],
['Barely reacts, but gets shiny fast', 'بالكاد تتفاعل، لكنها تلمع بسرعة', '반응은 거의 없지만 금방 번들거려요'],
['How does your skin look at the end of the day?', 'كيف تبدو بشرتك في نهاية اليوم؟', '하루가 끝날 때 피부는 어떤가요?'],
['Shiny all over', 'لامعة في كل الوجه', '얼굴 전체가 번들거려요'],
['Shiny on the forehead and nose only', 'لامعة على الجبهة والأنف فقط', '이마와 코만 번들거려요'],
['Dull or flaky', 'باهتة أو متقشرة', '칙칙하거나 각질이 있어요'],
['About the same as in the morning', 'تقريبًا كما في الصباح', '아침과 거의 같아요'],
['What happens to your skin in heat or sun?', 'ماذا يحدث لبشرتك في الحر أو الشمس؟', '더위나 햇빛에 피부가 어떻게 되나요?'],
['Redness, itching or burning', 'احمرار أو حكة أو حرقة', '붉어짐, 가려움 또는 화끈거림'],
['Gets drier and tighter', 'تزداد جفافًا وشدًّا', '더 건조하고 당겨요'],
['Gets shinier and oilier', 'تزداد لمعانًا ودهونًا', '더 번들거리고 기름져요'],
['Doesn’t change much', 'لا تتغير كثيرًا', '별로 변하지 않아요'],
['Your current result:', 'نتيجتك الحالية:', '현재 결과:'],
['Question', 'سؤال', '질문'],
['Question {}', 'السؤال {0}', '질문 {0}'],
['Question {} of {}', 'السؤال {0} من {1}', '질문 {0}/{1}'],
['Show result and continue', 'عرض النتيجة والمتابعة', '결과 보고 계속하기'],
['Skin type quiz', 'اختبار نوع البشرة', '피부 타입 퀴즈'],
['Answer {} short questions to find your skin type.', 'أجيبي عن {0} أسئلة قصيرة لمعرفة نوع بشرتك.¦أجب عن {0} أسئلة قصيرة لمعرفة نوع بشرتك.', '짧은 질문 {0}개에 답하고 피부 타입을 알아보세요.'],
['Answer', 'أجيبي عن¦أجب عن', '답하기'],
['short questions to find your skin type.', 'أسئلة قصيرة لمعرفة نوع بشرتك.', '개의 짧은 질문으로 피부 타입을 알아보세요.'],

// camera
['Start scanner', 'تشغيل الماسح', '스캐너 시작'],
['Camera permission was denied. Allow access in your browser settings, then try again.', 'تم رفض إذن الكاميرا. اسمحي بالوصول من إعدادات المتصفح ثم حاولي مرة أخرى.¦تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم حاول مرة أخرى.', '카메라 권한이 거부되었습니다. 브라우저 설정에서 허용한 뒤 다시 시도하세요.'],
['No suitable camera was found on this device.', 'لم يتم العثور على كاميرا مناسبة في هذا الجهاز.', '이 기기에서 사용할 수 있는 카메라를 찾지 못했습니다.'],
['This browser does not support the camera. Open the site over https in a modern browser.', 'هذا المتصفح لا يدعم الكاميرا. افتحي الموقع عبر https في متصفح حديث.¦هذا المتصفح لا يدعم الكاميرا. افتح الموقع عبر https في متصفح حديث.', '이 브라우저는 카메라를 지원하지 않습니다. 최신 브라우저에서 https로 사이트를 여세요.'],
['Could not start the camera. Close any other app using it and try again.', 'تعذّر تشغيل الكاميرا. أغلقي أي تطبيق آخر يستخدمها وحاولي مرة أخرى.¦تعذّر تشغيل الكاميرا. أغلق أي تطبيق آخر يستخدمها وحاول مرة أخرى.', '카메라를 시작할 수 없습니다. 카메라를 쓰는 다른 앱을 닫고 다시 시도하세요.'],
['Forehead', 'الجبهة', '이마'],
['Hold still and look at the camera — checking your forehead', 'اثبتي وانظري إلى الكاميرا — نفحص الجبهة¦اثبت وانظر إلى الكاميرا — نفحص الجبهة', '움직이지 말고 카메라를 보세요 — 이마 확인 중'],
['Nose', 'الأنف', '코'],
['Checking your nose', 'نفحص الأنف', '코 확인 중'],
['Right cheek', 'الخد الأيمن', '오른쪽 볼'],
['Turn your head slightly to the left — checking your right cheek', 'أديري رأسك قليلًا لليسار — نفحص الخد الأيمن¦أدر رأسك قليلًا لليسار — نفحص الخد الأيمن', '고개를 왼쪽으로 살짝 돌리세요 — 오른쪽 볼 확인 중'],
['Left cheek', 'الخد الأيسر', '왼쪽 볼'],
['Turn your head slightly to the right — checking your left cheek', 'أديري رأسك قليلًا لليمين — نفحص الخد الأيسر¦أدر رأسك قليلًا لليمين — نفحص الخد الأيسر', '고개를 오른쪽으로 살짝 돌리세요 — 왼쪽 볼 확인 중'],
['Chin', 'الذقن', '턱'],
['Lift your chin slightly — checking your chin', 'ارفعي ذقنك قليلًا — نفحص الذقن¦ارفع ذقنك قليلًا — نفحص الذقن', '턱을 살짝 드세요 — 턱 확인 중'],
['Cheeks', 'الخدان', '볼'],

// pores
['Clear oily shine', 'لمعان دهني واضح', '뚜렷한 유분 번들거림'],
['Moderate shine, needs care', 'لمعان متوسط يحتاج عناية', '보통 번들거림, 관리 필요'],
['Balanced surface, no excess shine', 'سطح متوازن بلا لمعان زائد', '균형 잡힌 피부, 과한 번들거림 없음'],
['High oil activity', 'نشاط دهني مرتفع', '피지 활동 많음'],
['Moderate shine in some areas', 'لمعان متوسط في بعض المناطق', '일부 부위에 보통 번들거림'],
['Balanced skin', 'بشرة متوازنة', '균형 잡힌 피부'],
['For a more accurate analysis, complete the medical profile and skin type first — they are sent along with the photo.', 'لتحليل أدق، أكملي الملف الطبي ونوع البشرة أولًا — فهما يُرسلان مع الصورة.¦لتحليل أدق، أكمل الملف الطبي ونوع البشرة أولًا — فهما يُرسلان مع الصورة.', '더 정확한 분석을 위해 건강 프로필과 피부 타입을 먼저 완료하세요 — 사진과 함께 전송됩니다.'],
['AI pore analysis', 'تحليل المسام بالذكاء الاصطناعي', 'AI 모공 분석'],
['Take or upload a photo of your face. My skin analyses it together with your medical profile and skin type and writes you a detailed report.', 'التقطي صورة لوجهك أو ارفعيها. يحللها بشرتي مع ملفك الطبي ونوع بشرتك ويكتب لك تقريرًا مفصلًا.¦التقط صورة لوجهك أو ارفعها. يحللها بشرتي مع ملفك الطبي ونوع بشرتك ويكتب لك تقريرًا مفصلًا.', '얼굴 사진을 찍거나 업로드하세요. 마이 스킨이 건강 프로필, 피부 타입과 함께 분석해 자세한 리포트를 작성합니다.'],
['No makeup or filters, at least an hour after washing your face.', 'بدون مكياج أو فلاتر، وبعد غسل الوجه بساعة على الأقل.', '메이크업이나 필터 없이, 세안 후 최소 1시간 뒤에 찍으세요.'],
['Daylight from the front, no flash.', 'ضوء نهار من الأمام، بدون فلاش.', '정면에서 들어오는 자연광, 플래시 없이.'],
['Face close and filling the frame, camera steady.', 'الوجه قريب ويملأ الإطار، والكاميرا ثابتة.', '얼굴이 화면을 가득 채우도록 가까이, 카메라는 고정.'],
['Open the camera and take a photo, or upload one from your device.', 'افتحي الكاميرا والتقطي صورة، أو ارفعي صورة من جهازك.¦افتح الكاميرا والتقط صورة، أو ارفع صورة من جهازك.', '카메라를 열어 사진을 찍거나 기기에서 업로드하세요.'],
['Or try the live shine scan (no AI)', 'أو جرّبي فحص اللمعان المباشر (بدون ذكاء اصطناعي)¦أو جرّب فحص اللمعان المباشر (بدون ذكاء اصطناعي)', '또는 실시간 번들거림 스캔 사용 (AI 없음)'],
['Capture now', 'التقاط الآن', '지금 촬영'],
['Cancel', 'إلغاء', '취소'],
['Take a photo', 'التقاط صورة', '사진 찍기'],
['Upload a photo', 'رفع صورة', '사진 업로드'],
['Starting camera…', 'جارٍ تشغيل الكاميرا…', '카메라 시작 중…'],
['Move closer until your face fills the frame, then tap "Capture now"', 'اقتربي حتى يملأ وجهك الإطار، ثم اضغطي "التقاط الآن"¦اقترب حتى يملأ وجهك الإطار، ثم اضغط "التقاط الآن"', '얼굴이 화면을 가득 채울 때까지 가까이 온 뒤 "지금 촬영"을 누르세요'],
['Choose an image file.', 'اختاري ملف صورة.¦اختر ملف صورة.', '이미지 파일을 선택하세요.'],
['Could not read the image. Try a JPG or PNG.', 'تعذّرت قراءة الصورة. جرّبي JPG أو PNG.¦تعذّرت قراءة الصورة. جرّب JPG أو PNG.', '이미지를 읽을 수 없습니다. JPG나 PNG로 시도하세요.'],
['Looking at your pores…', 'نفحص مسامك…', '모공을 살펴보는 중…'],
['Checking forehead and nose…', 'نفحص الجبهة والأنف…', '이마와 코 확인 중…'],
['Measuring pore size…', 'نقيس حجم المسام…', '모공 크기 측정 중…'],
['Looking for blackheads and congestion…', 'نبحث عن الرؤوس السوداء والانسداد…', '블랙헤드와 막힘 확인 중…'],
['Analysing your skin…', 'نحلل بشرتك…', '피부 분석 중…'],
['Identifying your pore type…', 'نحدد نوع مسامك…', '모공 타입 파악 중…'],
['Comparing results with your medical profile…', 'نقارن النتائج بملفك الطبي…', '건강 프로필과 결과 비교 중…'],
['First analysis', 'التحليل الأول', '첫 번째 분석'],
['Second analysis', 'التحليل الثاني', '두 번째 분석'],
['Third analysis', 'التحليل الثالث', '세 번째 분석'],
['Merging results and writing the report', 'دمج النتائج وكتابة التقرير', '결과 통합 및 리포트 작성'],
['Analysing your skin', 'نحلل بشرتك', '피부 분석 중'],
['Checking the photo and analysing pores', 'فحص الصورة وتحليل المسام', '사진 확인 및 모공 분석'],
['Writing the report', 'كتابة التقرير', '리포트 작성'],
['Analysis stopped', 'توقف التحليل', '분석 중단됨'],
['OK', 'حسنًا', '확인'],
['The analysis service is not available here — run the site with "npm start" and open http://localhost:3000.', 'خدمة التحليل غير متاحة هنا — شغّلي الموقع بـ "npm start" وافتحي http://localhost:3000.¦خدمة التحليل غير متاحة هنا — شغّل الموقع بـ "npm start" وافتح http://localhost:3000.', '여기서는 분석 서비스를 사용할 수 없습니다 — "npm start"로 사이트를 실행하고 http://localhost:3000을 여세요.'],
['Could not reach the analysis service.', 'تعذّر الوصول إلى خدمة التحليل.', '분석 서비스에 연결할 수 없습니다.'],
['The connection dropped before the analysis finished, please try again.', 'انقطع الاتصال قبل انتهاء التحليل، حاولي مرة أخرى.¦انقطع الاتصال قبل انتهاء التحليل، حاول مرة أخرى.', '분석이 끝나기 전에 연결이 끊겼습니다. 다시 시도해 주세요.'],
['Something went wrong.', 'حدث خطأ ما.', '문제가 발생했습니다.'],
['Good', 'جيد', '좋음'],
['Watch', 'انتبهي¦انتبه', '주의'],
['Needs care', 'يحتاج عناية', '관리 필요'],
['Strong agreement between analyses', 'اتفاق قوي بين التحاليل', '분석 간 일치도 높음'],
['Moderate agreement between analyses', 'اتفاق متوسط بين التحاليل', '분석 간 일치도 보통'],
['The analyses disagreed', 'اختلفت التحاليل', '분석 결과가 서로 달랐습니다'],
['High confidence', 'ثقة عالية', '신뢰도 높음'],
['Medium confidence', 'ثقة متوسطة', '신뢰도 보통'],
['Low confidence', 'ثقة منخفضة', '신뢰도 낮음'],
['{} independent analyses', '{0} تحاليل مستقلة', '독립 분석 {0}회'],
['AI analysis', 'تحليل بالذكاء الاصطناعي', 'AI 분석'],
['The photo isn’t clear enough.', 'الصورة ليست واضحة بما يكفي.', '사진이 충분히 선명하지 않습니다.'],
['As your personal assistant from My skin, I couldn’t analyse this photo accurately:', 'بصفتي مساعدتك الشخصية من بشرتي، لم أتمكن من تحليل هذه الصورة بدقة:¦بصفتي مساعدك الشخصي من بشرتي، لم أتمكن من تحليل هذه الصورة بدقة:', '마이 스킨의 개인 도우미로서 이 사진을 정확히 분석할 수 없었습니다:'],
['Take a new photo', 'التقاط صورة جديدة', '새 사진 찍기'],
['Key findings', 'أبرز النتائج', '주요 결과'],
['Ingredients to look for', 'مكونات يُنصح بها', '찾아볼 성분'],
['Ingredients to avoid', 'مكونات يُنصح بتجنّبها', '피해야 할 성분'],
['🩺 We recommend seeing a dermatologist:', '🩺 ننصح بمراجعة طبيب جلدية:', '🩺 피부과 진료를 권장합니다:'],
['As your personal assistant from My skin, here is your analysis:', 'بصفتي مساعدتك الشخصية من بشرتي، إليك تحليلك:', '마이 스킨의 개인 도우미로서 분석 결과를 알려 드립니다:'],
['Pore type', 'نوع المسام', '모공 타입'],
['Oil production:', 'إفراز الدهون:', '피지 분비:'],
['Face zones', 'مناطق الوجه', '얼굴 부위'],
['AI guidance only — not a medical diagnosis.', 'إرشاد بالذكاء الاصطناعي فقط — وليس تشخيصًا طبيًا.', 'AI 안내일 뿐이며 의학적 진단이 아닙니다.'],
['Next: ingredient check', 'التالي: فحص المكونات', '다음: 성분 확인'],
['New analysis', 'تحليل جديد', '새 분석'],
['Scanned without face tracking (the model failed to load), so the result is less accurate.', 'تم الفحص دون تتبع الوجه (تعذّر تحميل النموذج)، لذا النتيجة أقل دقة.', '얼굴 추적 없이 스캔되어(모델 로드 실패) 결과의 정확도가 낮습니다.'],
['Result', 'النتيجة', '결과'],
['/5 balanced', '/5 متوازنة', '/5 균형'],
['Results are estimates and depend on lighting and camera.', 'النتائج تقديرية وتعتمد على الإضاءة والكاميرا.', '결과는 추정치이며 조명과 카메라에 따라 달라집니다.'],
['Loading the face tracking model…', 'جارٍ تحميل نموذج تتبع الوجه…', '얼굴 추적 모델 로드 중…'],
['Place your face inside the frame', 'ضعي وجهك داخل الإطار¦ضع وجهك داخل الإطار', '얼굴을 프레임 안에 맞추세요'],
['Too dark — move somewhere brighter', 'الإضاءة ضعيفة — انتقلي إلى مكان أكثر إضاءة¦الإضاءة ضعيفة — انتقل إلى مكان أكثر إضاءة', '너무 어둡습니다 — 더 밝은 곳으로 이동하세요'],
['(no tracking)', '(بدون تتبع)', '(추적 없음)'],
['Scan complete ✓', 'اكتمل الفحص ✓', '스캔 완료 ✓'],

// ingredient database
['Fragrance', 'العطور', '향료'],
['One of the most common causes of allergy and irritation.', 'من أكثر أسباب الحساسية والتهيّج شيوعًا.', '알레르기와 자극의 가장 흔한 원인 중 하나입니다.'],
['Drying alcohol', 'الكحول المجفف', '건조성 알코올'],
['Can dry out and irritate sensitive or dry skin.', 'قد يجفف البشرة الحساسة أو الجافة ويهيّجها.', '민감하거나 건조한 피부를 건조하게 하고 자극할 수 있습니다.'],
['Essential oils', 'الزيوت العطرية', '에센셜 오일'],
['Natural fragrance compounds that can cause contact allergy.', 'مركبات عطرية طبيعية قد تسبب حساسية تلامسية.', '접촉성 알레르기를 일으킬 수 있는 천연 향 성분입니다.'],
['Sulfates (SLS/SLES)', 'الكبريتات (SLS/SLES)', '설페이트 (SLS/SLES)'],
['A harsh cleanser that can weaken the skin barrier.', 'منظف قاسٍ قد يُضعف حاجز البشرة.', '피부 장벽을 약하게 할 수 있는 강한 세정 성분입니다.'],
['Coconut oil', 'زيت جوز الهند', '코코넛 오일'],
['High chance of clogging pores.', 'احتمال عالٍ لسد المسام.', '모공을 막을 가능성이 높습니다.'],
['Isopropyl myristate', 'أيزوبروبيل ميريستات', '아이소프로필 미리스테이트'],
['Can clog pores on oily skin.', 'قد يسد المسام في البشرة الدهنية.', '지성 피부의 모공을 막을 수 있습니다.'],
['Mineral oil', 'الزيت المعدني', '미네랄 오일'],
['Can feel heavy on oily or combination skin.', 'قد يكون ثقيلًا على البشرة الدهنية أو المختلطة.', '지성이나 복합성 피부에는 무겁게 느껴질 수 있습니다.'],
['Cocoa butter', 'زبدة الكاكاو', '코코아 버터'],
['A rich texture that can clog pores.', 'قوام غني قد يسد المسام.', '모공을 막을 수 있는 리치한 제형입니다.'],
['Retinoids', 'الريتينويدات', '레티노이드'],
['Effective, but can cause dryness and sun sensitivity; not recommended during pregnancy or breastfeeding.', 'فعّالة، لكنها قد تسبب الجفاف والحساسية للشمس؛ ولا يُنصح بها أثناء الحمل أو الرضاعة.', '효과적이지만 건조함과 햇빛 민감성을 일으킬 수 있으며, 임신·수유 중에는 권장하지 않습니다.'],
['Hydroquinone', 'الهيدروكينون', '하이드로퀴논'],
['A strong lightening agent, to be used only under medical supervision.', 'مادة تفتيح قوية، تُستخدم فقط تحت إشراف طبي.', '강한 미백 성분으로, 의료진의 관리 하에서만 사용해야 합니다.'],
['AHA acids', 'أحماض AHA', 'AHA 산'],
['Exfoliants that increase sun sensitivity — use them at night and wear sunscreen by day.', 'مقشرات تزيد الحساسية للشمس — استخدميها ليلًا وضعي واقي الشمس نهارًا.¦مقشرات تزيد الحساسية للشمس — استخدمها ليلًا وضع واقي الشمس نهارًا.', '햇빛 민감성을 높이는 각질 제거 성분입니다 — 밤에 사용하고 낮에는 자외선 차단제를 바르세요.'],
['Benzoyl peroxide', 'بيروكسيد البنزويل', '벤조일 퍼옥사이드'],
['Effective against acne but can cause dryness and irritation.', 'فعّال ضد حب الشباب لكنه قد يسبب الجفاف والتهيّج.', '여드름에 효과적이지만 건조함과 자극을 일으킬 수 있습니다.'],
['Parabens', 'البارابين', '파라벤'],
['A preservative that can cause allergy in some people.', 'مادة حافظة قد تسبب الحساسية لدى بعض الأشخاص.', '일부 사람에게 알레르기를 일으킬 수 있는 방부제입니다.'],
['Salicylic acid', 'حمض الساليسيليك', '살리실산'],
['Clears pores and suits oily skin; can dry out dry skin.', 'ينظف المسام ويناسب البشرة الدهنية؛ وقد يجفف البشرة الجافة.', '모공을 깨끗하게 하며 지성 피부에 맞지만, 건성 피부는 건조해질 수 있습니다.'],
['Calms the skin and regulates oil.', 'يهدئ البشرة وينظم الدهون.', '피부를 진정시키고 유분을 조절합니다.'],
['Hyaluronic acid', 'حمض الهيالورونيك', '히알루론산'],
['A light humectant that draws water into the skin.', 'مرطب خفيف يجذب الماء إلى البشرة.', '피부에 수분을 끌어들이는 가벼운 보습 성분입니다.'],
['Ceramides', 'السيراميدات', '세라마이드'],
['Strengthen the skin barrier and reduce moisture loss.', 'تقوي حاجز البشرة وتقلل فقدان الرطوبة.', '피부 장벽을 강화하고 수분 손실을 줄입니다.'],
['Glycerin', 'الجلسرين', '글리세린'],
['A gentle humectant that suits every skin type.', 'مرطب لطيف يناسب جميع أنواع البشرة.', '모든 피부 타입에 맞는 순한 보습 성분입니다.'],
['Panthenol', 'البانثينول', '판테놀'],
['Soothes and repairs irritated skin.', 'يهدئ البشرة المتهيّجة ويرممها.', '자극받은 피부를 진정시키고 회복시킵니다.'],
['Zinc oxide', 'أكسيد الزنك', '징크옥사이드'],
['A gentle mineral UV filter that suits sensitive skin.', 'فلتر معدني لطيف للأشعة يناسب البشرة الحساسة.', '민감한 피부에 맞는 순한 무기 자외선 차단 성분입니다.'],
['Vitamin C', 'فيتامين C', '비타민 C'],
['An antioxidant that supports radiance.', 'مضاد أكسدة يدعم النضارة.', '광채를 돕는 항산화 성분입니다.'],
['Aloe vera', 'الصبار', '알로에 베라'],
['Soothing and lightly moisturising.', 'مهدّئ ومرطب خفيف.', '진정 효과가 있고 가볍게 보습합니다.'],
['Listed as an allergy in your medical profile.', 'مذكور كحساسية في ملفك الطبي.', '건강 프로필에 알레르기로 등록되어 있습니다.'],
['We didn’t recognise any ingredient from our list — we can’t rate this product.', 'لم نتعرّف على أي مكوّن من قائمتنا — لا يمكننا تقييم هذا المنتج.', '목록에 있는 성분을 찾지 못해 이 제품을 평가할 수 없습니다.'],
['Not recommended for you — it contains ingredients that conflict with your skin or condition.', 'غير مناسب لك — يحتوي على مكونات تتعارض مع بشرتك أو حالتك.', '추천하지 않습니다 — 피부나 질환과 맞지 않는 성분이 들어 있습니다.'],
['Suitable with caution — patch-test it on a small area for 48 hours first.', 'مناسب بحذر — اختبريه على مساحة صغيرة لمدة 48 ساعة أولًا.¦مناسب بحذر — اختبره على مساحة صغيرة لمدة 48 ساعة أولًا.', '주의해서 사용 가능 — 먼저 작은 부위에 48시간 동안 패치 테스트하세요.'],
['Suits your skin, based on the ingredients we know.', 'يناسب بشرتك، بناءً على المكونات التي نعرفها.', '알려진 성분 기준으로 피부에 잘 맞습니다.'],
['For a more accurate result, complete the medical profile and skin type quiz first.', 'لنتيجة أدق، أكملي الملف الطبي واختبار نوع البشرة أولًا.¦لنتيجة أدق، أكمل الملف الطبي واختبار نوع البشرة أولًا.', '더 정확한 결과를 위해 건강 프로필과 피부 타입 퀴즈를 먼저 완료하세요.'],
['Scan the barcode, search by product name, or paste the ingredient list from the pack. We compare it with your skin type and medical profile.', 'امسحي الباركود، أو ابحثي باسم المنتج، أو الصقي قائمة المكونات من العبوة. نقارنها بنوع بشرتك وملفك الطبي.¦امسح الباركود، أو ابحث باسم المنتج، أو الصق قائمة المكونات من العبوة. نقارنها بنوع بشرتك وملفك الطبي.', '바코드를 스캔하거나 제품명으로 검색하거나 포장의 성분 목록을 붙여 넣으세요. 피부 타입과 건강 프로필과 비교합니다.'],
['Scan barcode', 'مسح الباركود', '바코드 스캔'],
['Point the back camera at the product’s barcode.', 'وجّهي الكاميرا الخلفية إلى باركود المنتج.¦وجّه الكاميرا الخلفية إلى باركود المنتج.', '후면 카메라를 제품 바코드에 맞추세요.'],
['Search by product name', 'البحث باسم المنتج', '제품명으로 검색'],
['Search', 'بحث', '검색'],
['Ingredient list', 'قائمة المكونات', '성분 목록'],
['Analyse ingredients', 'تحليل المكونات', '성분 분석'],
['e.g. CeraVe moisturizing cream', 'مثال: CeraVe moisturizing cream', '예: CeraVe moisturizing cream'],
['Unnamed product', 'منتج بدون اسم', '이름 없는 제품'],
['Avoid', 'تجنّبيه¦تجنّبه', '피하기'],
['Caution', 'بحذر', '주의'],
['Suitable', 'مناسب', '적합'],
['We found no ingredients from our list in this product.', 'لم نجد في هذا المنتج أي مكوّن من قائمتنا.', '이 제품에서 목록에 있는 성분을 찾지 못했습니다.'],
['We check {} common ingredients only, and we don’t know their actual concentrations.', 'نفحص {0} مكوّنًا شائعًا فقط، ولا نعرف تراكيزها الفعلية.', '흔한 성분 {0}개만 확인하며 실제 농도는 알 수 없습니다.'],
['Next: sunscreen', 'التالي: واقي الشمس', '다음: 자외선 차단제'],
['No ingredient list for this product in the database — paste it from the pack.', 'لا توجد قائمة مكونات لهذا المنتج في قاعدة البيانات — الصقيها من العبوة.¦لا توجد قائمة مكونات لهذا المنتج في قاعدة البيانات — الصقها من العبوة.', '데이터베이스에 이 제품의 성분 목록이 없습니다 — 포장에서 붙여 넣으세요.'],
['Barcode {} — searching…', 'الباركود {0} — جارٍ البحث…', '바코드 {0} — 검색 중…'],
['Product found ({}).', 'تم العثور على المنتج ({0}).', '제품을 찾았습니다 ({0}).'],
['Product {} isn’t in Open Beauty Facts. Try searching by name or paste the ingredients.', 'المنتج {0} غير موجود في Open Beauty Facts. جرّبي البحث بالاسم أو الصقي المكونات.¦المنتج {0} غير موجود في Open Beauty Facts. جرّب البحث بالاسم أو الصق المكونات.', '{0} 제품이 Open Beauty Facts에 없습니다. 이름으로 검색하거나 성분을 붙여 넣으세요.'],
['Could not reach the product database.', 'تعذّر الوصول إلى قاعدة بيانات المنتجات.', '제품 데이터베이스에 연결할 수 없습니다.'],
['Stop scanner', 'إيقاف الماسح', '스캐너 중지'],
['Point the camera at the barcode…', 'وجّهي الكاميرا إلى الباركود…¦وجّه الكاميرا إلى الباركود…', '카메라를 바코드에 맞추세요…'],
['Type a product name first.', 'اكتبي اسم المنتج أولًا.¦اكتب اسم المنتج أولًا.', '먼저 제품명을 입력하세요.'],
['Searching…', 'جارٍ البحث…', '검색 중…'],
['no ingredient list', 'بدون قائمة مكونات', '성분 목록 없음'],
['No results. Try another name, or paste the ingredients directly.', 'لا توجد نتائج. جرّبي اسمًا آخر أو الصقي المكونات مباشرة.¦لا توجد نتائج. جرّب اسمًا آخر أو الصق المكونات مباشرة.', '결과가 없습니다. 다른 이름으로 검색하거나 성분을 직접 붙여 넣으세요.'],
['Search isn’t available right now.', 'البحث غير متاح حاليًا.', '지금은 검색을 사용할 수 없습니다.'],
['Paste the ingredient list first.', 'الصقي قائمة المكونات أولًا.¦الصق قائمة المكونات أولًا.', '먼저 성분 목록을 붙여 넣으세요.'],

// sunscreen
['Around the eyes', 'حول العينين', '눈가'],
['Ears', 'الأذنان', '귀'],
['Neck', 'الرقبة', '목'],
['Back of neck', 'مؤخرة الرقبة', '뒷목'],
['Lips', 'الشفتان', '입술'],
['Ears are among the most often forgotten — and burned — spots.', 'الأذنان من أكثر المناطق التي تُنسى — وتحترق.', '귀는 가장 자주 잊히고, 가장 자주 타는 부위 중 하나입니다.'],
['Your neck is in the sun all day and shows ageing quickly.', 'رقبتك تحت الشمس طوال اليوم وتظهر عليها علامات التقدم في السن بسرعة.', '목은 하루 종일 햇빛을 받아 노화가 빨리 드러납니다.'],
['The back of your neck gets direct sun whenever you walk.', 'مؤخرة رقبتك تتعرض للشمس المباشرة كلما مشيت.', '걸을 때마다 뒷목에 직사광선이 닿습니다.'],
['Use a lip balm with SPF.', 'استخدمي مرطب شفاه فيه SPF.¦استخدم مرطب شفاه فيه SPF.', 'SPF가 있는 립밤을 사용하세요.'],
['Apply a thin layer away from the lash line, or wear sunglasses.', 'ضعي طبقة رقيقة بعيدًا عن خط الرموش، أو ارتدي نظارة شمسية.¦ضع طبقة رقيقة بعيدًا عن خط الرموش، أو ارتدِ نظارة شمسية.', '속눈썹 라인에서 떨어뜨려 얇게 바르거나 선글라스를 쓰세요.'],
['Not sure', 'لست متأكدة¦لست متأكدًا', '잘 모름'],
['Start the smart check', 'ابدئي الفحص الذكي¦ابدأ الفحص الذكي', '스마트 체크를 시작하세요'],
['before', 'قبل', '전에'],
['you apply sunscreen: we capture your bare skin first, then you apply each zone while the camera tracks your hand and the change in shine and colour. Then we draw a live protection map on your face, based on your city’s UV index and your SPF.',
 'وضع واقي الشمس: نلتقط بشرتك دونه أولًا، ثم تضعينه على كل منطقة بينما تتابع الكاميرا يدك وتغيّر اللمعان واللون. بعدها نرسم خريطة حماية مباشرة على وجهك، بناءً على مؤشر الأشعة في مدينتك ودرجة SPF.¦وضع واقي الشمس: نلتقط بشرتك دونه أولًا، ثم تضعه على كل منطقة بينما تتابع الكاميرا يدك وتغيّر اللمعان واللون. بعدها نرسم خريطة حماية مباشرة على وجهك، بناءً على مؤشر الأشعة في مدينتك ودرجة SPF.',
 '자외선 차단제를 바르기 전에: 먼저 맨 피부를 촬영한 뒤, 카메라가 손과 광택·색의 변화를 추적하는 동안 부위별로 바릅니다. 그런 다음 지역 자외선 지수와 SPF를 바탕으로 얼굴에 실시간 보호 지도를 그립니다.'],
['Smart camera check', 'الفحص الذكي بالكاميرا', '스마트 카메라 체크'],
['Choose your SPF below, then start the check — the video is analysed on your device only and never uploaded.', 'اختاري درجة SPF أدناه ثم ابدئي الفحص — يُحلَّل الفيديو على جهازك فقط ولا يُرفع أبدًا.¦اختر درجة SPF أدناه ثم ابدأ الفحص — يُحلَّل الفيديو على جهازك فقط ولا يُرفع أبدًا.', '아래에서 SPF를 선택한 뒤 체크를 시작하세요 — 영상은 기기에서만 분석되며 업로드되지 않습니다.'],
['Areas you covered', 'المناطق التي غطيتِها¦المناطق التي غطيتَها', '바른 부위'],
['Your product’s SPF', 'درجة SPF لمنتجك', '제품의 SPF'],
['Did you use enough? (two finger-lengths for face and neck)', 'هل استخدمتِ كمية كافية؟ (طول إصبعين للوجه والرقبة)¦هل استخدمتَ كمية كافية؟ (طول إصبعين للوجه والرقبة)', '충분히 발랐나요? (얼굴과 목에 손가락 두 마디 길이)'],
['Yes', 'نعم', '네'],
['Less than that', 'أقل من ذلك', '그보다 적게'],
['Calculate coverage', 'احسب التغطية', '커버리지 계산'],
['Add a layer on this area.', 'أضيفي طبقة على هذه المنطقة.¦أضف طبقة على هذه المنطقة.', '이 부위에 한 겹 더 바르세요.'],
['SPF 15 isn’t enough for daily exposure — use at least SPF 30.', 'SPF 15 لا يكفي للتعرض اليومي — استخدمي SPF 30 على الأقل.¦SPF 15 لا يكفي للتعرض اليومي — استخدم SPF 30 على الأقل.', 'SPF 15는 매일 노출에 충분하지 않습니다 — 최소 SPF 30을 사용하세요.'],
['Check the pack: choose "broad spectrum" with SPF 30 or higher.', 'تحقّقي من العبوة: اختاري "واسع الطيف" بدرجة SPF 30 أو أعلى.¦تحقّق من العبوة: اختر "واسع الطيف" بدرجة SPF 30 أو أعلى.', '포장을 확인하세요: SPF 30 이상의 "광범위 차단(broad spectrum)" 제품을 고르세요.'],
['Too little sunscreen cuts real protection a lot — use two full finger-lengths.', 'الكمية القليلة تقلل الحماية الفعلية كثيرًا — استخدمي طول إصبعين كاملين.¦الكمية القليلة تقلل الحماية الفعلية كثيرًا — استخدم طول إصبعين كاملين.', '너무 적게 바르면 실제 차단 효과가 크게 줄어듭니다 — 손가락 두 마디 길이를 가득 쓰세요.'],
['Excellent coverage!', 'تغطية ممتازة!', '커버리지가 훌륭합니다!'],
['Good coverage, with a few missed areas.', 'تغطية جيدة مع بعض المناطق الفائتة.', '커버리지가 좋지만 놓친 부위가 몇 군데 있습니다.'],
['Not enough coverage — finish the missed areas.', 'التغطية غير كافية — أكملي المناطق الفائتة.¦التغطية غير كافية — أكمل المناطق الفائتة.', '커버리지가 부족합니다 — 놓친 부위를 마저 바르세요.'],
['Select the areas you covered.', 'اختاري المناطق التي غطيتِها.¦اختر المناطق التي غطيتَها.', '바른 부위를 선택하세요.'],
['your forehead', 'الجبهة', '이마'],
['your nose', 'الأنف', '코'],
['your right cheek', 'الخد الأيمن', '오른쪽 볼'],
['your left cheek', 'الخد الأيسر', '왼쪽 볼'],
['your chin', 'الذقن', '턱'],
['Confirmed by colour', 'تم التأكيد باللون', '색으로 확인됨'],
['Confirmed by shine (clear sunscreen)', 'تم التأكيد باللمعان (واقٍ شفاف)', '광택으로 확인됨 (투명 자외선 차단제)'],
['Hand application detected', 'تم رصد الوضع باليد', '손으로 바른 것이 감지됨'],
['Confirmed manually', 'تم التأكيد يدويًا', '수동으로 확인됨'],
['Strong', 'قوية', '강함'],
['Weakening', 'تضعف', '약해지는 중'],
['Reapply now', 'جدّدي الآن¦جدّد الآن', '지금 덧바르기'],
['Bring the phone a little closer (same distance as the first capture)', 'قرّبي الجوال قليلًا (نفس مسافة الالتقاط الأول)¦قرّب الجوال قليلًا (نفس مسافة الالتقاط الأول)', '휴대폰을 조금 더 가까이 하세요 (첫 촬영과 같은 거리)'],
['Move the phone a little farther away (same distance as the first capture)', 'أبعدي الجوال قليلًا (نفس مسافة الالتقاط الأول)¦أبعد الجوال قليلًا (نفس مسافة الالتقاط الأول)', '휴대폰을 조금 더 멀리 하세요 (첫 촬영과 같은 거리)'],
['Straighten your head', 'عدّلي وضع رأسك¦عدّل وضع رأسك', '고개를 똑바로 하세요'],
['Lift your chin slightly', 'ارفعي ذقنك قليلًا¦ارفع ذقنك قليلًا', '턱을 살짝 드세요'],
['Lower your chin slightly', 'اخفضي ذقنك قليلًا¦اخفض ذقنك قليلًا', '턱을 살짝 내리세요'],
['Face the camera directly, like in the first capture', 'واجهي الكاميرا مباشرة كما في الالتقاط الأول¦واجه الكاميرا مباشرة كما في الالتقاط الأول', '첫 촬영 때처럼 카메라를 정면으로 보세요'],
['"Before" capture, no sunscreen', 'التقاط "قبل"، بدون واقي شمس', '"전" 촬영, 자외선 차단제 없음'],
['Apply on', 'ضعيه على¦ضعه على', '바를 부위:'],
['Applied on this area ✓', 'تم الوضع على هذه المنطقة ✓', '이 부위에 발랐어요 ✓'],
['Close camera', 'إغلاق الكاميرا', '카메라 닫기'],
['Check again (after reapplying)', 'افحصي مجددًا (بعد التجديد)¦افحص مجددًا (بعد التجديد)', '다시 체크 (덧바른 후)'],
['Start smart check', 'بدء الفحص الذكي', '스마트 체크 시작'],
['Show protection on my face', 'اعرض الحماية على وجهي', '내 얼굴에 보호 상태 보기'],
['Coverage', 'التغطية', '커버리지'],
['({}/{} points)', '({0}/{1} نقطة)', '({0}/{1} 포인트)'],
['Colour change ΔE', 'تغيّر اللون ΔE', '색 변화 ΔE'],
['lightness L* {}', 'السطوع L* {0}', '밝기 L* {0}'],
['whitening {}', 'التبييض {0}', '백탁 {0}'],
['shine {}', 'اللمعان {0}', '광택 {0}'],
['touched {}×', 'لُمست {0}×', '{0}회 만짐'],
['In {}:', 'بعد {0}:', '{0} 후:'],
['(assumed)', '(مفترض)', '(가정)'],
['at your location', 'في موقعك', '현재 위치'],
['(estimated — turn on location for a real value)', '(تقديري — فعّل الموقع للحصول على قيمة حقيقية)', '(추정치 — 실제 값을 보려면 위치를 켜세요)'],
['Now', 'الآن', '지금'],
['Remind me when protection weakens (in {})', 'ذكّرني عندما تضعف الحماية (بعد {0})', '보호력이 약해지면 알려 주세요 ({0} 후)'],
['Protection on {} has worn off — reapply sunscreen, then check again.', 'انتهت الحماية على {0} — جدّدي واقي الشمس ثم افحصي مجددًا.¦انتهت الحماية على {0} — جدّد واقي الشمس ثم افحص مجددًا.', '{0}의 보호 효과가 사라졌습니다 — 자외선 차단제를 덧바른 뒤 다시 체크하세요.'],
['Measured without face tracking, so accuracy is lower.', 'تم القياس دون تتبع الوجه، لذا الدقة أقل.', '얼굴 추적 없이 측정되어 정확도가 낮습니다.'],
['Camera exposure was locked during the measurement.', 'تم قفل تعريض الكاميرا أثناء القياس.', '측정 중 카메라 노출이 고정되었습니다.'],
['Live protection map', 'خريطة الحماية المباشرة', '실시간 보호 지도'],
['Weakest area: {} ({}%) — {}', 'أضعف منطقة: {0} ({1}%) — {2}', '가장 약한 부위: {0} ({1}%) — {2}'],
['In {}: Weakest area: {} ({}%) — {}', 'بعد {0}: أضعف منطقة: {1} ({2}%) — {3}', '{0} 후: 가장 약한 부위: {1} ({2}%) — {3}'],
['Weakest area:', 'أضعف منطقة:', '가장 약한 부위:'],
['SPF {} (assumed)', 'SPF {0} (مفترض)', 'SPF {0} (가정)'],
['effective now ≈ SPF {}', 'الفعّال الآن ≈ SPF {0}', '현재 실효 ≈ SPF {0}'],
['{} ago', 'قبل {0}', '{0} 전'],
['Right now you are', 'أنت الآن', '지금 있는 곳'],
['☀️ Outdoors', '☀️ في الخارج', '☀️ 실외'],
['🏠 Indoors', '🏠 في الداخل', '🏠 실내'],
['Preview protection in', 'معاينة الحماية بعد', '보호 상태 미리보기:'],
['Percentages are estimates from a mathematical model (UV × SPF × each zone’s exposure × face touching), not a lab measurement.', 'النسب تقديرات من نموذج رياضي (الأشعة × SPF × تعرّض كل منطقة × لمس الوجه)، وليست قياسًا مخبريًا.', '퍼센트는 수학적 모델(자외선 × SPF × 부위별 노출 × 얼굴 만짐)로 추정한 값이며, 실험실 측정값이 아닙니다.'],
['Missed spots on {} — spread more slowly over those areas next time.', 'مواضع فائتة على {0} — وزّعي ببطء أكثر على هذه المناطق في المرة القادمة.¦مواضع فائتة على {0} — وزّع ببطء أكثر على هذه المناطق في المرة القادمة.', '{0}에 놓친 부분이 있습니다 — 다음에는 그 부위를 더 천천히 펴 바르세요.'],
['{} could not be confirmed by colour — a tinted or white-cast sunscreen makes the check more reliable.', 'تعذّر التأكد من {0} باللون — الواقي الملوّن أو الذي يترك أثرًا أبيض يجعل الفحص أدق.', '{0}은(는) 색으로 확인되지 않았습니다 — 톤업이나 백탁이 있는 자외선 차단제를 쓰면 더 정확합니다.'],
['You used less than two finger-lengths, which lowers real protection a lot.', 'استخدمتِ أقل من طول إصبعين، وهذا يقلل الحماية الفعلية كثيرًا.¦استخدمتَ أقل من طول إصبعين، وهذا يقلل الحماية الفعلية كثيرًا.', '손가락 두 마디 길이보다 적게 발라 실제 차단 효과가 크게 줄었습니다.'],
['SPF was not selected, so SPF 30 was assumed.', 'لم يتم اختيار SPF، لذا افترضنا SPF 30.', 'SPF를 선택하지 않아 SPF 30으로 가정했습니다.'],
['SPF 15 is not enough for daily exposure — use at least SPF 30.', 'SPF 15 لا يكفي للتعرض اليومي — استخدمي SPF 30 على الأقل.¦SPF 15 لا يكفي للتعرض اليومي — استخدم SPF 30 على الأقل.', 'SPF 15는 매일 노출에 충분하지 않습니다 — 최소 SPF 30을 사용하세요.'],
['Modelled protection on {} dropped below {}% about {} after applying (outdoors).', 'انخفضت الحماية المقدّرة على {0} إلى أقل من {1}% بعد نحو {2} من الوضع (في الخارج).', '{0}의 추정 보호력이 바른 지 약 {2} 후 {1}% 아래로 떨어졌습니다 (실외).'],
['Measured without face tracking, so this report is less accurate.', 'تم القياس دون تتبع الوجه، لذا هذا التقرير أقل دقة.', '얼굴 추적 없이 측정되어 이 리포트의 정확도가 낮습니다.'],
['less than recommended', 'أقل من الموصى به', '권장량보다 적음'],
['enough', 'كافية', '충분'],
['not given', 'غير محددة', '입력 안 함'],
['amount {}', 'الكمية {0}', '사용량 {0}'],
['(estimated)', '(تقديري)', '(추정)'],
['reapply after ≈ {} outdoors', 'جدّدي بعد ≈ {0} في الخارج¦جدّد بعد ≈ {0} في الخارج', '실외에서 약 {0} 후 덧바르기'],
['Face tracking on', 'تتبع الوجه مفعّل', '얼굴 추적 켜짐'],
['No face tracking', 'بدون تتبع الوجه', '얼굴 추적 없음'],
['exposure locked', 'التعريض مقفل', '노출 고정'],
['exposure compensated', 'التعريض معوَّض', '노출 보정'],
['Average starting protection {}%', 'متوسط الحماية في البداية {0}%', '시작 시 평균 보호력 {0}%'],
['weakest area: {}', 'أضعف منطقة: {0}', '가장 약한 부위: {0}'],
['Area', 'المنطقة', '부위'],
['Start · weak in', 'البداية · تضعف بعد', '시작 · 약해지는 시점'],
['Coverage = share of measured points whose colour changed beyond their own noise (CIELAB ΔE). Protection is a model estimate, not a lab measurement.', 'التغطية = نسبة النقاط المقاسة التي تغيّر لونها أكثر من تذبذبها الطبيعي (CIELAB ΔE). الحماية تقدير من نموذج، وليست قياسًا مخبريًا.', '커버리지 = 측정 포인트 중 자체 노이즈보다 색이 더 크게 변한 비율(CIELAB ΔE). 보호력은 모델 추정치이며 실험실 측정값이 아닙니다.'],
['Saved on this device, protected from automatic clean-up.', 'محفوظ على هذا الجهاز ومحمي من التنظيف التلقائي.', '이 기기에 저장되었으며 자동 정리에서 보호됩니다.'],
['Saved on this device.', 'محفوظ على هذا الجهاز.', '이 기기에 저장되었습니다.'],
['Clearing site data in the browser removes them — keep a backup file to be safe.', 'مسح بيانات الموقع من المتصفح يحذفها — احتفظي بملف نسخة احتياطية للأمان.¦مسح بيانات الموقع من المتصفح يحذفها — احتفظ بملف نسخة احتياطية للأمان.', '브라우저에서 사이트 데이터를 지우면 삭제됩니다 — 안전을 위해 백업 파일을 보관하세요.'],
['Each smart check saves a detailed report here, on this device only.', 'كل فحص ذكي يحفظ تقريرًا مفصلًا هنا، على هذا الجهاز فقط.', '스마트 체크마다 자세한 리포트가 이 기기에만 저장됩니다.'],
['weakest {}', 'الأضعف {0}', '가장 약함 {0}'],
['Show fewer', 'عرض أقل', '간단히 보기'],
['Show all ({})', 'عرض الكل ({0})', '모두 보기 ({0})'],
['Save backup file', 'حفظ ملف نسخة احتياطية', '백업 파일 저장'],
['Sunscreen check reports', 'تقارير فحص واقي الشمس', '자외선 차단제 체크 리포트'],
['Restore from file', 'استعادة من ملف', '파일에서 복원'],
['Sunscreen check report', 'تقرير فحص واقي الشمس', '자외선 차단제 체크 리포트'],
['Download report', 'تنزيل التقرير', '리포트 다운로드'],
['Delete', 'حذف', '삭제'],
['Close', 'إغلاق', '닫기'],
['My skin — sunscreen report {}', 'بشرتي — تقرير واقي الشمس {0}', '마이 스킨 — 자외선 차단제 리포트 {0}'],
['My skin — sunscreen report', 'بشرتي — تقرير واقي الشمس', '마이 스킨 — 자외선 차단제 리포트'],
['My skin · sunscreen check report', 'بشرتي · تقرير فحص واقي الشمس', '마이 스킨 · 자외선 차단제 체크 리포트'],
['Generated by My skin on this device. Guidance only — not a medical assessment.', 'أُنشئ بواسطة بشرتي على هذا الجهاز. للإرشاد فقط — وليس تقييمًا طبيًا.', '이 기기에서 마이 스킨이 생성했습니다. 안내용이며 의학적 평가가 아닙니다.'],
['That file is not a My skin reports backup.', 'هذا الملف ليس نسخة احتياطية لتقارير بشرتي.', '이 파일은 마이 스킨 리포트 백업이 아닙니다.'],
['Light', 'الإضاءة', '조명'],
['Distance', 'المسافة', '거리'],
['Steadiness', 'الثبات', '안정성'],
['Pose', 'الوضعية', '자세'],
['Face tracking', 'تتبع الوجه', '얼굴 추적'],
['Hand tracking', 'تتبع اليد', '손 추적'],
['✓ Exposure locked', '✓ التعريض مقفل', '✓ 노출 고정'],
['• Exposure compensated', '• التعريض معوَّض', '• 노출 보정'],
['Loading the face model (468 points) and hand model (21 points)…', 'جارٍ تحميل نموذج الوجه (468 نقطة) ونموذج اليد (21 نقطة)…', '얼굴 모델(468 포인트)과 손 모델(21 포인트) 로드 중…'],
['Adjusting camera exposure…', 'جارٍ ضبط تعريض الكاميرا…', '카메라 노출 조정 중…'],
['Too dark — face a window or a light source', 'الإضاءة ضعيفة — واجهي نافذة أو مصدر ضوء¦الإضاءة ضعيفة — واجه نافذة أو مصدر ضوء', '너무 어둡습니다 — 창문이나 조명을 바라보세요'],
['Too much light on your face — move out of direct light', 'الضوء قوي على وجهك — ابتعدي عن الضوء المباشر¦الضوء قوي على وجهك — ابتعد عن الضوء المباشر', '얼굴에 빛이 너무 강합니다 — 직사광에서 벗어나세요'],
['Move closer so your face fills the frame', 'اقتربي حتى يملأ وجهك الإطار¦اقترب حتى يملأ وجهك الإطار', '얼굴이 화면을 채우도록 가까이 오세요'],
['Hold still and look at the camera', 'اثبتي وانظري إلى الكاميرا¦اثبت وانظر إلى الكاميرا', '움직이지 말고 카메라를 보세요'],
['"Before" capture: hold still — reading the colour and shine of {} points on your face', 'التقاط "قبل": اثبتي — نقرأ لون ولمعان {0} نقطة على وجهك¦التقاط "قبل": اثبت — نقرأ لون ولمعان {0} نقطة على وجهك', '"전" 촬영: 움직이지 마세요 — 얼굴 {0}개 포인트의 색과 광택을 읽는 중'],
['Reading your skin before sunscreen… {}%', 'نقرأ بشرتك قبل واقي الشمس… {0}%', '자외선 차단제 바르기 전 피부를 읽는 중… {0}%'],
['— or tap "Applied" when you’re done', '— أو اضغطي "تم الوضع" عند الانتهاء¦— أو اضغط "تم الوضع" عند الانتهاء', '— 또는 다 바르면 "발랐어요"를 누르세요'],
['✋ Hand on {} — spread it well, then move your hand away', '✋ اليد على {0} — وزّعيه جيدًا ثم أبعدي يدك¦✋ اليد على {0} — وزّعه جيدًا ثم أبعد يدك', '✋ {0}에 손이 있어요 — 잘 펴 바른 뒤 손을 떼세요'],
['Great — move your hand away from your face to measure', 'رائع — أبعدي يدك عن وجهك للقياس¦رائع — أبعد يدك عن وجهك للقياس', '좋아요 — 측정을 위해 얼굴에서 손을 떼세요'],
['Hold still for a moment…', 'اثبتي لحظة…¦اثبت لحظة…', '잠시 움직이지 마세요…'],
['Comparing colour and shine with the "before" capture…', 'نقارن اللون واللمعان بالتقاط "قبل"…', '"전" 촬영과 색·광택 비교 중…'],
['{} points on {} were missed — go over them', 'فاتتك {0} نقطة على {1} — مرّري عليها مجددًا', '{1}에서 {0}개 포인트를 놓쳤어요 — 다시 발라 주세요'],
['✅ Measured — report saved. Here is your live protection map', '✅ تم القياس — وحُفظ التقرير. هذه خريطة حمايتك المباشرة', '✅ 측정 완료 — 리포트가 저장되었습니다. 실시간 보호 지도입니다'],
['You touched {} — touching wipes off some sunscreen', 'لمستِ {0} — اللمس يزيل بعض واقي الشمس¦لمستَ {0} — اللمس يزيل بعض واقي الشمس', '{0}을(를) 만졌어요 — 만지면 자외선 차단제가 일부 지워집니다'],
['Preview in {} · 🟢 strong 🟡 weakening 🔴 reapply', 'معاينة بعد {0} · 🟢 قوية 🟡 تضعف 🔴 جدّدي¦معاينة بعد {0} · 🟢 قوية 🟡 تضعف 🔴 جدّد', '{0} 후 미리보기 · 🟢 강함 🟡 약해짐 🔴 덧바르기'],
['🟢 strong · 🟡 weakening · 🔴 reapply now · red dots = missed spots', '🟢 قوية · 🟡 تضعف · 🔴 جدّدي الآن · النقاط الحمراء = مواضع فائتة¦🟢 قوية · 🟡 تضعف · 🔴 جدّد الآن · النقاط الحمراء = مواضع فائتة', '🟢 강함 · 🟡 약해짐 · 🔴 지금 덧바르기 · 빨간 점 = 놓친 부분'],
['This deletes all your saved data on this device, including sunscreen reports. Continue?', 'سيؤدي هذا إلى حذف جميع بياناتك المحفوظة على هذا الجهاز، بما فيها تقارير واقي الشمس. هل تريدين المتابعة؟¦سيؤدي هذا إلى حذف جميع بياناتك المحفوظة على هذا الجهاز، بما فيها تقارير واقي الشمس. هل تريد المتابعة؟', '이 기기에 저장된 모든 데이터(자외선 차단제 리포트 포함)가 삭제됩니다. 계속할까요?'],
['Delete this report? This cannot be undone.', 'حذف هذا التقرير؟ لا يمكن التراجع عن ذلك.', '이 리포트를 삭제할까요? 되돌릴 수 없습니다.'],

// monitoring sessions and the skin health record
['Sunscreen monitoring', 'متابعة واقي الشمس', '선크림 모니터링'],
['Sunscreen monitoring session', 'جلسة متابعة واقي الشمس', '선크림 모니터링 세션'],
['Session in progress', 'جلسة جارية', '세션 진행 중'],
['Start a monitoring session', 'ابدئي جلسة متابعة¦ابدأ جلسة متابعة', '모니터링 세션 시작'],
['Session in progress since', 'جلسة جارية منذ', '세션 진행 중 · 시작'],
['Next check in', 'الفحص القادم بعد', '다음 체크까지'],
['Next check in {}', 'الفحص القادم بعد {0}', '다음 체크까지 {0}'],
['Check due now', 'حان وقت الفحص', '지금 체크할 시간입니다'],
['Check due now — tap "Check now".', 'حان وقت الفحص — اضغطي "افحص الآن".¦حان وقت الفحص — اضغط "افحص الآن".', '지금 체크할 시간입니다 — "지금 체크"를 누르세요.'],
['Track how long your sunscreen holds on each part of your face, with a short camera check every few minutes and a daily report.', 'تابعي مدة ثبات واقي الشمس على كل منطقة من وجهك، بفحص سريع بالكاميرا كل بضع دقائق وتقرير يومي.¦تابع مدة ثبات واقي الشمس على كل منطقة من وجهك، بفحص سريع بالكاميرا كل بضع دقائق وتقرير يومي.', '몇 분마다 짧은 카메라 체크와 일일 리포트로, 얼굴 부위별로 선크림이 얼마나 오래 유지되는지 확인하세요.'],
['Open session', 'فتح الجلسة', '세션 열기'],
['Start a session', 'بدء جلسة', '세션 시작'],
['Skin health record', 'السجل الطبي للبشرة', '피부 건강 기록'],
['Open my skin health record', 'فتح السجل الطبي لبشرتي', '내 피부 건강 기록 열기'],
['Hold the phone like in the first capture, in the same light.', 'أمسكي الجوال كما في الالتقاط الأول، وفي نفس الإضاءة.¦أمسك الجوال كما في الالتقاط الأول، وفي نفس الإضاءة.', '첫 촬영 때처럼 같은 조명에서 휴대폰을 들어 주세요.'],
['Fill in the details below, then start — the video is analysed on your device only.', 'عبّئي التفاصيل أدناه ثم ابدئي — يُحلَّل الفيديو على جهازك فقط.¦عبّئ التفاصيل أدناه ثم ابدأ — يُحلَّل الفيديو على جهازك فقط.', '아래 정보를 입력한 뒤 시작하세요 — 영상은 기기에서만 분석됩니다.'],
['Check now', 'افحص الآن', '지금 체크'],
['Session details', 'تفاصيل الجلسة', '세션 정보'],
['Tip: do the smart check on the sunscreen page while applying — the session then knows exactly how strong your film is.', 'نصيحة: سوّي الفحص الذكي في صفحة واقي الشمس أثناء وضعه — عندها تعرف الجلسة قوة طبقة الواقي بالضبط.', '팁: 선크림을 바를 때 선크림 페이지에서 스마트 체크를 하면, 세션이 선크림 막의 강도를 정확히 알 수 있습니다.'],
['Temperature (°C)', 'درجة الحرارة (°م)', '기온 (°C)'],
['Where are you?', 'أين أنتِ؟¦أين أنت؟', '어디에 있나요?'],
['University', 'الجامعة', '대학교'],
['At home', 'المنزل', '집'],
['Work', 'العمل', '직장'],
['Outdoors', 'في الخارج', '야외'],
['Car', 'السيارة', '자동차'],
['Other', 'أخرى', '기타'],
['Name the place', 'اكتبي اسم المكان¦اكتب اسم المكان', '장소 이름'],
['Expected sun exposure / likely sun damage', 'التعرض المتوقع للشمس / الضرر المحتمل', '예상 햇빛 노출 / 예상 피해'],
['Check every', 'الفحص كل', '체크 간격'],
['Face photos', 'صور الوجه', '얼굴 사진'],
['Save a small face photo with each check', 'حفظ صورة صغيرة للوجه مع كل فحص', '체크할 때마다 작은 얼굴 사진 저장'],
['Kept only on this device, inside your skin health record. You can delete the photos at any time.', 'تُحفظ على هذا الجهاز فقط داخل سجلك الطبي، ويمكنك حذفها في أي وقت.', '이 기기의 피부 건강 기록에만 보관되며 언제든 사진을 삭제할 수 있습니다.'],
['Notes and numbers only — no photos', 'الملاحظات والأرقام فقط — بدون صور', '메모와 수치만 — 사진 없음'],
['Only the measurements and written notes are saved.', 'تُحفظ القياسات والملاحظات المكتوبة فقط.', '측정값과 작성된 메모만 저장됩니다.'],
['Start session — I have applied sunscreen', 'ابدئي الجلسة — وضعت واقي الشمس¦ابدأ الجلسة — وضعت واقي الشمس', '세션 시작 — 선크림을 발랐어요'],
['Choose your skin type.', 'اختاري نوع بشرتك.¦اختر نوع بشرتك.', '피부 타입을 선택하세요.'],
['Choose where you are.', 'اختاري مكانك.¦اختر مكانك.', '있는 장소를 선택하세요.'],
['Choose your expected sun exposure.', 'اختاري التعرض المتوقع للشمس.¦اختر التعرض المتوقع للشمس.', '예상 햇빛 노출을 선택하세요.'],
['Choose whether to save face photos.', 'اختاري هل تُحفظ صور الوجه أم لا.¦اختر هل تُحفظ صور الوجه أم لا.', '얼굴 사진 저장 여부를 선택하세요.'],
['Place: {}', 'المكان: {0}', '장소: {0}'],
['Temperature: {}°', 'الحرارة: {0}°', '기온: {0}°'],
['UV at start: {}', 'مؤشر الأشعة عند البدء: {0}', '시작 시 자외선: {0}'],
['Skin type: {}', 'نوع البشرة: {0}', '피부 타입: {0}'],
['Sun exposure: {}', 'التعرض للشمس: {0}', '햇빛 노출: {0}'],
['SPF not given', 'SPF غير محدد', 'SPF 미입력'],
['Checks every {} min', 'فحص كل {0} د', '{0}분마다 체크'],
['Face photos: saved', 'صور الوجه: محفوظة', '얼굴 사진: 저장함'],
['Face photos: not saved', 'صور الوجه: غير محفوظة', '얼굴 사진: 저장 안 함'],
['Reference (fresh sunscreen)', 'المرجع (واقٍ جديد)', '기준 (갓 바른 선크림)'],
['Check {}', 'الفحص {0}', '체크 {0}'],
['{} after application', 'بعد {0} من الوضع', '바른 지 {0} 후'],
['Right side', 'الجانب الأيمن', '오른쪽'],
['Left side', 'الجانب الأيسر', '왼쪽'],
['right side', 'الجانب الأيمن', '오른쪽'],
['left side', 'الجانب الأيسر', '왼쪽'],
['whole face', 'الوجه كامل', '얼굴 전체'],
['I reapplied sunscreen on', 'جدّدت واقي الشمس على', '선크림을 다시 바른 곳'],
['Today’s report', 'تقرير اليوم', '오늘의 리포트'],
['End session', 'إنهاء الجلسة', '세션 종료'],
['Start right after you apply sunscreen. Every few minutes you take a short camera check; My skin compares each area of your face with the moment you applied it, finds which side is fading faster and tells you exactly where to reapply. Everything is written into your skin health record.', 'ابدئي مباشرة بعد وضع واقي الشمس. كل بضع دقائق تسوّين فحصًا قصيرًا بالكاميرا؛ يقارن بشرتي كل منطقة في وجهك بلحظة وضع الواقي، ويكتشف أي جانب يتلاشى أسرع، ويخبرك بالضبط أين تجددين. وكل ذلك يُكتب في سجلك الطبي.¦ابدأ مباشرة بعد وضع واقي الشمس. كل بضع دقائق تسوّي فحصًا قصيرًا بالكاميرا؛ يقارن بشرتي كل منطقة في وجهك بلحظة وضع الواقي، ويكتشف أي جانب يتلاشى أسرع، ويخبرك بالضبط أين تجدد. وكل ذلك يُكتب في سجلك الطبي.', '선크림을 바른 직후에 시작하세요. 몇 분마다 짧은 카메라 체크를 하면, 마이 스킨이 얼굴 부위별로 바른 직후와 비교해 어느 쪽이 더 빨리 옅어지는지 찾아 정확히 어디에 덧바를지 알려 줍니다. 모든 내용은 피부 건강 기록에 저장됩니다.'],
['Checks run while this page is open: you get a reminder when one is due, then a 10-second scan.', 'تعمل الفحوصات ما دامت الصفحة مفتوحة: يصلك تذكير عند موعد الفحص، ثم مسح لمدة 10 ثوانٍ.', '체크는 이 페이지가 열려 있는 동안 작동합니다: 체크 시간이 되면 알림이 오고, 10초 스캔을 하면 됩니다.'],
['Face tracking is needed for monitoring — check your connection and try again.', 'المتابعة تحتاج تتبع الوجه — تحققي من الاتصال وحاولي مرة أخرى.¦المتابعة تحتاج تتبع الوجه — تحقق من الاتصال وحاول مرة أخرى.', '모니터링에는 얼굴 추적이 필요합니다 — 연결을 확인하고 다시 시도하세요.'],
['Hold still and keep your hands away from your face', 'اثبتي وأبعدي يديك عن وجهك¦اثبت وأبعد يديك عن وجهك', '움직이지 말고 얼굴에서 손을 떼세요'],
['The light is different from the first capture — face the same light as before', 'الإضاءة مختلفة عن الالتقاط الأول — واجهي نفس الإضاءة السابقة¦الإضاءة مختلفة عن الالتقاط الأول — واجه نفس الإضاءة السابقة', '첫 촬영과 조명이 다릅니다 — 이전과 같은 조명을 바라보세요'],
['Hold still — measuring…', 'اثبتي — جارٍ القياس…¦اثبت — جارٍ القياس…', '움직이지 마세요 — 측정 중…'],
['Recording your skin with fresh sunscreen… {}%', 'نسجّل بشرتك مع الواقي الجديد… {0}%', '갓 바른 선크림 상태의 피부를 기록하는 중… {0}%'],
['Measuring how well your sunscreen is holding… {}%', 'نقيس مدى ثبات واقي الشمس… {0}%', '선크림이 얼마나 유지되는지 측정하는 중… {0}%'],
['Session started — next check in {} min', 'بدأت الجلسة — الفحص القادم بعد {0} د', '세션 시작 — {0}분 뒤 다음 체크'],
['Check saved — all areas are holding well.', 'تم حفظ الفحص — كل المناطق ثابتة جيدًا.', '체크 저장 완료 — 모든 부위가 잘 유지되고 있습니다.'],
['Take a 10-second check so My skin can see how your sunscreen is holding.', 'سوّي فحصًا لمدة 10 ثوانٍ ليعرف بشرتي مدى ثبات واقي الشمس.', '10초 체크를 하면 마이 스킨이 선크림 유지 상태를 확인할 수 있습니다.'],
['Sunscreen check due', 'حان موعد فحص الواقي', '선크림 체크 시간'],
['Noted — the next check measures the re-covered area fresh.', 'تم التسجيل — الفحص القادم يقيس المنطقة المجدَّدة من جديد.', '기록했습니다 — 다음 체크에서 다시 바른 부위를 새로 측정합니다.'],
['No face photos are saved.', 'لا توجد صور وجه محفوظة.', '저장된 얼굴 사진이 없습니다.'],
['Delete all saved face photos? Notes and numbers stay.', 'حذف جميع صور الوجه المحفوظة؟ تبقى الملاحظات والأرقام.', '저장된 얼굴 사진을 모두 삭제할까요? 메모와 수치는 남습니다.'],
['Face photos deleted.', 'تم حذف صور الوجه.', '얼굴 사진을 삭제했습니다.'],
['End this monitoring session? Its report stays in your skin health record.', 'إنهاء جلسة المتابعة؟ يبقى تقريرها في سجلك الطبي.', '이 모니터링 세션을 종료할까요? 리포트는 피부 건강 기록에 남습니다.'],
['Delete this session? This cannot be undone.', 'حذف هذه الجلسة؟ لا يمكن التراجع عن ذلك.', '이 세션을 삭제할까요? 되돌릴 수 없습니다.'],
['Restored {} sessions', 'تمت استعادة {0} جلسات', '세션 {0}개를 복원했습니다'],
['That file is not a My skin sessions backup.', 'هذا الملف ليس نسخة احتياطية لجلسات بشرتي.', '이 파일은 마이 스킨 세션 백업이 아닙니다.'],

// follow-up notes
['Protection has dropped on the whole face (lowest {}%). Reapply sunscreen on the whole face.', 'انخفضت الحماية على الوجه كامل (أدناها {0}%). جدّدي واقي الشمس على الوجه كامل.¦انخفضت الحماية على الوجه كامل (أدناها {0}%). جدّد واقي الشمس على الوجه كامل.', '얼굴 전체의 보호력이 떨어졌습니다 (최저 {0}%). 얼굴 전체에 선크림을 다시 바르세요.'],
['Reapply on the right side only — the left side will be checked again in the next cycle.', 'جدّدي على الجانب الأيمن فقط — وسنتابع الجانب الأيسر في الدورة القادمة.¦جدّد على الجانب الأيمن فقط — وسنتابع الجانب الأيسر في الدورة القادمة.', '오른쪽에만 다시 바르세요 — 왼쪽은 다음 주기에 다시 확인합니다.'],
['Reapply on the left side only — the right side will be checked again in the next cycle.', 'جدّدي على الجانب الأيسر فقط — وسنتابع الجانب الأيمن في الدورة القادمة.¦جدّد على الجانب الأيسر فقط — وسنتابع الجانب الأيمن في الدورة القادمة.', '왼쪽에만 다시 바르세요 — 오른쪽은 다음 주기에 다시 확인합니다.'],
['Reapply on {} — the film there is down to {}%.', 'جدّدي على {0} — انخفضت طبقة الواقي هناك إلى {1}%.¦جدّد على {0} — انخفضت طبقة الواقي هناك إلى {1}%.', '{0}에 다시 바르세요 — 그 부위의 선크림 막이 {1}%로 줄었습니다.'],
['Session started right after applying sunscreen. Reference recorded on {} points across 5 face areas.', 'بدأت الجلسة مباشرة بعد وضع واقي الشمس. سُجّل المرجع على {0} نقطة في 5 مناطق من الوجه.', '선크림을 바른 직후 세션을 시작했습니다. 얼굴 5개 부위의 {0}개 포인트에서 기준을 기록했습니다.'],
['The strength of the sunscreen film was taken from the smart check done just before.', 'أُخذت قوة طبقة الواقي من الفحص الذكي الذي سبق الجلسة مباشرة.', '선크림 막의 강도는 직전에 한 스마트 체크에서 가져왔습니다.'],
['No smart check was done just before, so a typical sunscreen film strength was used.', 'لم يُجرَ فحص ذكي قبلها مباشرة، لذا استُخدمت قوة طبقة واقٍ نموذجية.', '직전에 스마트 체크를 하지 않아 일반적인 선크림 막 강도를 사용했습니다.'],
['Measured fresh after reapplying on the {}.', 'قيس من جديد بعد التجديد على {0}.', '{0}에 다시 바른 뒤 새로 측정했습니다.'],
['The right side is fading faster than the left ({}% vs {}%, a gap of {} points).', 'الجانب الأيمن يتلاشى أسرع من الأيسر ({0}% مقابل {1}%، بفارق {2} نقطة).', '오른쪽이 왼쪽보다 빨리 옅어지고 있습니다 ({0}% 대 {1}%, {2}포인트 차이).'],
['The left side is fading faster than the right ({}% vs {}%, a gap of {} points).', 'الجانب الأيسر يتلاشى أسرع من الأيمن ({0}% مقابل {1}%، بفارق {2} نقطة).', '왼쪽이 오른쪽보다 빨리 옅어지고 있습니다 ({0}% 대 {1}%, {2}포인트 차이).'],
['All areas are holding well (lowest {}% on {}).', 'كل المناطق ثابتة جيدًا (أدناها {0}% على {1}).', '모든 부위가 잘 유지되고 있습니다 (최저: {1} {0}%).'],
['The right side is slightly behind ({}% vs {}%).', 'الجانب الأيمن متأخر قليلًا ({0}% مقابل {1}%).', '오른쪽이 조금 뒤처집니다 ({0}% 대 {1}%).'],
['The left side is slightly behind ({}% vs {}%).', 'الجانب الأيسر متأخر قليلًا ({0}% مقابل {1}%).', '왼쪽이 조금 뒤처집니다 ({0}% 대 {1}%).'],
['{} lost {} points since the previous check.', 'فقدت {0} {1} نقطة منذ الفحص السابق.', '{0}이(가) 이전 체크 이후 {1}포인트 줄었습니다.'],
['Forehead shine is up {} points since application (oil or sweat), which can thin the film.', 'زاد لمعان الجبهة {0} نقطة منذ وضع الواقي (دهون أو عرق)، وهذا قد يرقّق طبقة الواقي.', '바른 뒤 이마 번들거림이 {0}포인트 늘었습니다 (유분이나 땀). 선크림 막이 얇아질 수 있습니다.'],
['Texture (pore visibility) on {} is {}% higher than at the start of the session.', 'ملمس البشرة (وضوح المسام) على {0} أعلى بنسبة {1}% من بداية الجلسة.', '{0}의 피부결(모공 보임)이 세션 시작 때보다 {1}% 높습니다.'],
['Pores look more visible on the right cheek than on the left (texture {} vs {}).', 'المسام أوضح على الخد الأيمن منها على الأيسر (الملمس {0} مقابل {1}).', '오른쪽 볼의 모공이 왼쪽보다 더 잘 보입니다 (피부결 {0} 대 {1}).'],
['Pores look more visible on the left cheek than on the right (texture {} vs {}).', 'المسام أوضح على الخد الأيسر منها على الأيمن (الملمس {0} مقابل {1}).', '왼쪽 볼의 모공이 오른쪽보다 더 잘 보입니다 (피부결 {0} 대 {1}).'],
['The light was different from the first capture, so this reading is less certain.', 'كانت الإضاءة مختلفة عن الالتقاط الأول، لذا هذه القراءة أقل يقينًا.', '첫 촬영과 조명이 달라 이번 측정은 정확도가 낮습니다.'],
['Session length: {}.', 'مدة الجلسة: {0}.', '세션 길이: {0}.'],
['Checks taken: {}.', 'عدد الفحوصات: {0}.', '체크 횟수: {0}.'],
['Reapplications: {}.', 'مرات التجديد: {0}.', '덧바른 횟수: {0}.'],
['Protection first dropped below 60% after {}.', 'انخفضت الحماية لأول مرة تحت 60% بعد {0}.', '{0} 후 보호력이 처음으로 60% 아래로 떨어졌습니다.'],
['Protection stayed above 60% for the whole session.', 'بقيت الحماية فوق 60% طوال الجلسة.', '세션 내내 보호력이 60% 이상 유지되었습니다.'],
['Average fade: {}% per hour; fastest on {} ({}% per hour).', 'متوسط التلاشي: {0}% في الساعة؛ والأسرع على {1} ({2}% في الساعة).', '평균 감소: 시간당 {0}%. 가장 빠른 부위: {1} (시간당 {2}%).'],
['The right side faded {}× faster than the left.', 'تلاشى الجانب الأيمن أسرع من الأيسر بـ{0} مرة.', '오른쪽이 왼쪽보다 {0}배 빨리 옅어졌습니다.'],
['The left side faded {}× faster than the right.', 'تلاشى الجانب الأيسر أسرع من الأيمن بـ{0} مرة.', '왼쪽이 오른쪽보다 {0}배 빨리 옅어졌습니다.'],
['Both sides faded at a similar rate.', 'تلاشى الجانبان بمعدل متقارب.', '양쪽이 비슷한 속도로 옅어졌습니다.'],
['Forehead shine changed by {} points per hour.', 'تغيّر لمعان الجبهة بمقدار {0} نقطة في الساعة.', '이마 번들거림이 시간당 {0}포인트 변했습니다.'],
['Texture (pore visibility) index at the start: {}.', 'مؤشر الملمس (وضوح المسام) في البداية: {0}.', '시작 시 피부결(모공 보임) 지수: {0}.'],
['Forehead shine rise: {} points per hour (last week {}) — {}.', 'ارتفاع لمعان الجبهة: {0} نقطة في الساعة (الأسبوع الماضي {1}) — {2}.', '이마 번들거림 증가: 시간당 {0}포인트 (지난주 {1}) — {2}.'],
['Average fade: {}% per hour (last week {}) — {}.', 'متوسط التلاشي: {0}% في الساعة (الأسبوع الماضي {1}) — {2}.', '평균 감소: 시간당 {0}% (지난주 {1}) — {2}.'],
['Side difference: {} points (last week {}) — {}.', 'الفرق بين الجانبين: {0} نقطة (الأسبوع الماضي {1}) — {2}.', '좌우 차이: {0}포인트 (지난주 {1}) — {2}.'],
['Texture (pore visibility) index: {} (last week {}) — {}.', 'مؤشر الملمس (وضوح المسام): {0} (الأسبوع الماضي {1}) — {2}.', '피부결(모공 보임) 지수: {0} (지난주 {1}) — {2}.'],
['({} → {})', '({0} ← {1})', '({0} → {1})'],
['better', 'أفضل', '개선'],
['worse', 'أسوأ', '악화'],
['about the same', 'تقريبًا نفسه', '비슷함'],

// reports and the record
['Daily sunscreen follow-up report', 'تقرير المتابعة اليومية لواقي الشمس', '선크림 일일 경과 리포트'],
['Film hold by area', 'ثبات الواقي حسب المنطقة', '부위별 선크림 유지율'],
['Time', 'الوقت', '시간'],
['Right / left', 'أيمن / أيسر', '오른쪽 / 왼쪽'],
['Follow-up notes', 'ملاحظات المتابعة', '경과 메모'],
['Reapplications', 'مرات التجديد', '덧바르기'],
['Summary', 'الملخص', '요약'],
['Compared with last week', 'مقارنة بالأسبوع الماضي', '지난주와 비교'],
['Start', 'البداية', '시작'],
['start', 'البداية', '시작'],
['+{}', '+{0}', '+{0}'],
['in progress', 'جارية', '진행 중'],
['Delete this session', 'حذف هذه الجلسة', '이 세션 삭제'],
['Hold = how much of the colour change made by the fresh sunscreen film is still there, measured on each face-mesh point and compared with the start of the session (CIELAB ΔE, minus each point’s own noise). It is an estimate from the camera, not a lab test or a medical diagnosis.', 'الثبات = مقدار ما بقي من تغيّر اللون الذي أحدثته طبقة الواقي الجديدة، مقاسًا على كل نقطة من شبكة الوجه ومقارنًا ببداية الجلسة (CIELAB ΔE، بعد طرح تذبذب كل نقطة). وهو تقدير من الكاميرا، وليس اختبارًا مخبريًا ولا تشخيصًا طبيًا.', '유지율 = 갓 바른 선크림 막이 만든 색 변화가 얼마나 남아 있는지를 얼굴 메시 포인트마다 측정해 세션 시작과 비교한 값입니다 (CIELAB ΔE, 포인트별 노이즈 제외). 카메라 추정치이며 실험실 검사나 의학적 진단이 아닙니다.'],
['Automatic comparison', 'مقارنة تلقائية', '자동 비교'],
['{} vs {}', '{0} مقابل {1}', '{0} 대 {1}'],
['Day {}', 'اليوم {0}', '{0}일차'],
['Week {}', 'الأسبوع {0}', '{0}주차'],
['Month {}', 'الشهر {0}', '{0}개월차'],
['Year {}', 'السنة {0}', '{0}년차'],
['Comparisons appear once you have sessions in two different periods.', 'تظهر المقارنات عندما يكون لديك جلسات في فترتين مختلفتين.', '서로 다른 두 기간에 세션이 있으면 비교가 표시됩니다.'],
['first period', 'الفترة الأولى', '첫 기간'],
['{} sessions', '{0} جلسات', '세션 {0}개'],
['{} checks', '{0} فحوصات', '체크 {0}회'],
['Average fade {}% per hour', 'متوسط التلاشي {0}% في الساعة', '평균 감소 시간당 {0}%'],
['forehead shine rise {}', 'ارتفاع لمعان الجبهة {0}', '이마 번들거림 증가 {0}'],
['side difference {}', 'الفرق بين الجانبين {0}', '좌우 차이 {0}'],
['texture {}', 'الملمس {0}', '피부결 {0}'],
['Compared with {}:', 'مقارنة بـ{0}:', '{0}와(과) 비교:'],
['Your sunscreen follow-up file', 'ملف متابعة واقي الشمس', '나의 선크림 경과 파일'],
['Every monitoring session is filed here by day, week, month and year, with Gregorian and Hijri dates, and compared automatically with the period before.', 'تُحفظ كل جلسة متابعة هنا حسب اليوم والأسبوع والشهر والسنة، بالتاريخين الميلادي والهجري، وتُقارن تلقائيًا بالفترة السابقة.', '모든 모니터링 세션은 양력과 이슬람력 날짜와 함께 일·주·월·년별로 정리되고, 이전 기간과 자동으로 비교됩니다.'],
['{} face photos saved on this device', '{0} صور وجه محفوظة على هذا الجهاز', '이 기기에 얼굴 사진 {0}장 저장됨'],
['no face photos saved', 'لا توجد صور وجه محفوظة', '저장된 얼굴 사진 없음'],
['Everything stays on this device.', 'كل شيء يبقى على هذا الجهاز.', '모든 데이터는 이 기기에만 남습니다.'],
['Daily', 'يومي', '일별'],
['Weekly', 'أسبوعي', '주별'],
['Monthly', 'شهري', '월별'],
['Yearly', 'سنوي', '연별'],
['Export the record', 'تصدير السجل', '기록 내보내기'],
['Delete all face photos', 'حذف جميع صور الوجه', '얼굴 사진 모두 삭제'],
['No sessions yet. Start a monitoring session right after you apply sunscreen.', 'لا توجد جلسات بعد. ابدئي جلسة متابعة مباشرة بعد وضع واقي الشمس.¦لا توجد جلسات بعد. ابدأ جلسة متابعة مباشرة بعد وضع واقي الشمس.', '아직 세션이 없습니다. 선크림을 바른 직후 모니터링 세션을 시작하세요.'],
['Measure', 'المقياس', '항목'],
['Change', 'التغيّر', '변화'],
['Sessions', 'الجلسات', '세션'],
['Average fade', 'متوسط التلاشي', '평균 감소'],
['% per hour', '% في الساعة', '시간당 %'],
['Time until protection dropped below 60%', 'الوقت حتى انخفضت الحماية تحت 60%', '보호력이 60% 아래로 떨어지기까지 걸린 시간'],
['min', 'د', '분'],
['Side difference (left minus right)', 'الفرق بين الجانبين (الأيسر ناقص الأيمن)', '좌우 차이 (왼쪽 − 오른쪽)'],
['points', 'نقطة', '포인트'],
['Forehead shine rise', 'ارتفاع لمعان الجبهة', '이마 번들거림 증가'],
['points per hour', 'نقطة في الساعة', '시간당 포인트'],
['Texture (pore visibility) index', 'مؤشر الملمس (وضوح المسام)', '피부결(모공 보임) 지수'],
['Reapplications per session', 'مرات التجديد لكل جلسة', '세션당 덧바르기 횟수'],
['Session length', 'مدة الجلسة', '세션 길이'],
['Generated by My skin on this device. Guidance only — not a medical assessment.', 'أُنشئ بواسطة بشرتي على هذا الجهاز. للإرشاد فقط — وليس تقييمًا طبيًا.', '이 기기에서 마이 스킨이 생성했습니다. 안내용이며 의학적 평가가 아닙니다.'],

// AI skin analysis: dark circles and pigmentation
['Checking under-eye dark circles…', 'نفحص الهالات تحت العين…', '눈 밑 다크서클 확인 중…'],
['Looking for pigmentation and dark spots…', 'نبحث عن التصبغات والبقع الداكنة…', '색소침착과 잡티 확인 중…'],
['Checking the photo: pores, dark circles and pigmentation', 'فحص الصورة: المسام والهالات والتصبغات', '사진 확인: 모공, 다크서클, 색소침착'],
['AI skin analysis', 'تحليل البشرة بالذكاء الاصطناعي', 'AI 피부 분석'],
['Take or upload a photo of your face. In one analysis My skin checks your pores, under-eye dark circles and pigmentation, together with your medical profile and skin type, writes you a detailed report and files it in your skin health record.', 'التقطي صورة لوجهك أو ارفعيها. في تحليل واحد يفحص بشرتي المسام والهالات تحت العين والتصبغات، مع ملفك الطبي ونوع بشرتك، ويكتب لك تقريرًا مفصلًا ويحفظه في سجلك الطبي.¦التقط صورة لوجهك أو ارفعها. في تحليل واحد يفحص بشرتي المسام والهالات تحت العين والتصبغات، مع ملفك الطبي ونوع بشرتك، ويكتب لك تقريرًا مفصلًا ويحفظه في سجلك الطبي.', '얼굴 사진을 찍거나 업로드하세요. 마이 스킨이 한 번의 분석으로 모공, 눈 밑 다크서클, 색소침착을 건강 프로필·피부 타입과 함께 확인하고, 자세한 리포트를 작성해 피부 건강 기록에 저장합니다.'],
['Keep the photo with this analysis in my skin health record', 'احفظ الصورة مع هذا التحليل في سجلي الطبي', '이 분석과 함께 사진을 피부 건강 기록에 보관'],
['None seen', 'لا يوجد', '보이지 않음'],
['Mild', 'خفيفة', '약함'],
['Marked', 'واضحة', '뚜렷함'],
['Pigmented (brownish)', 'صبغية (مائلة للبني)', '색소형 (갈색빛)'],
['Vascular (bluish)', 'وعائية (مائلة للأزرق)', '혈관형 (푸른빛)'],
['Shadow from hollowing', 'ظل من تجويف تحت العين', '눈 밑 꺼짐으로 인한 그림자'],
['Mixed', 'مختلطة', '혼합형'],
['Fine', 'دقيقة', '작음'],
['Visible', 'ظاهرة', '보임'],
['Enlarged', 'واسعة', '넓음'],
['Dark circles', 'الهالات', '다크서클'],
['Pigmentation', 'التصبغات', '색소침착'],
['Areas: {}', 'المناطق: {0}', '부위: {0}'],
['Areas', 'المناطق', '부위'],
['Saved to your skin health record.', 'تم الحفظ في سجلك الطبي.', '피부 건강 기록에 저장되었습니다.'],
['Open the record', 'فتح السجل', '기록 열기'],
['Pores: {}', 'المسام: {0}', '모공: {0}'],
['Dark circles: {}', 'الهالات: {0}', '다크서클: {0}'],
['Pigmentation: {}', 'التصبغات: {0}', '색소침착: {0}'],
['Delete this analysis', 'حذف هذا التحليل', '이 분석 삭제'],
['Delete this analysis? This cannot be undone.', 'حذف هذا التحليل؟ لا يمكن التراجع عن ذلك.', '이 분석을 삭제할까요? 되돌릴 수 없습니다.'],
['Pores (AI analysis)', 'المسام (تحليل الذكاء الاصطناعي)', '모공 (AI 분석)'],
['Dark circles (AI analysis)', 'الهالات (تحليل الذكاء الاصطناعي)', '다크서클 (AI 분석)'],
['Pigmentation (AI analysis)', 'التصبغات (تحليل الذكاء الاصطناعي)', '색소침착 (AI 분석)'],
['0 fine – 2 enlarged', '0 دقيقة – 2 واسعة', '0 작음 – 2 넓음'],
['0 none – 3 marked', '0 لا يوجد – 3 واضحة', '0 없음 – 3 뚜렷함'],
['AI skin analyses', 'تحاليل البشرة بالذكاء الاصطناعي', 'AI 피부 분석'],
['{} analyses', '{0} تحاليل', '분석 {0}회'],
['Comparisons appear once you have records in two different periods.', 'تظهر المقارنات عندما يكون لديك سجلات في فترتين مختلفتين.', '서로 다른 두 기간에 기록이 있으면 비교가 표시됩니다.'],
['Every monitoring session and AI skin analysis (pores, dark circles, pigmentation) is filed here by day, week, month and year, with Gregorian and Hijri dates, and compared automatically with the period before.', 'تُحفظ هنا كل جلسة متابعة وكل تحليل للبشرة بالذكاء الاصطناعي (المسام، الهالات، التصبغات) حسب اليوم والأسبوع والشهر والسنة، بالتاريخين الميلادي والهجري، وتُقارن تلقائيًا بالفترة السابقة.', '모든 모니터링 세션과 AI 피부 분석(모공, 다크서클, 색소침착)이 양력과 이슬람력 날짜와 함께 일·주·월·년별로 정리되고, 이전 기간과 자동으로 비교됩니다.'],
['Nothing recorded yet. Start a monitoring session right after you apply sunscreen, or take an AI skin analysis.', 'لا يوجد شيء مسجّل بعد. ابدئي جلسة متابعة بعد وضع واقي الشمس مباشرة، أو سوّي تحليلًا للبشرة بالذكاء الاصطناعي.¦لا يوجد شيء مسجّل بعد. ابدأ جلسة متابعة بعد وضع واقي الشمس مباشرة، أو سوّ تحليلًا للبشرة بالذكاء الاصطناعي.', '아직 기록이 없습니다. 선크림을 바른 직후 모니터링 세션을 시작하거나 AI 피부 분석을 해 보세요.'],
['Restored {} records', 'تمت استعادة {0} سجلات', '기록 {0}개를 복원했습니다'],

// live mirror application, automatic context and absorption notes
['Live mirror', 'المرآة المباشرة', '라이브 미러'],
['The camera works as a live mirror: it reads your bare skin first, then each area is yellow until you cover it with sunscreen and turns green.', 'تعمل الكاميرا كمرآة مباشرة: تقرأ بشرتك قبل الواقي أولًا، ثم تكون كل منطقة صفراء حتى تغطيها بالواقي فتتحول إلى خضراء.', '카메라가 라이브 미러처럼 작동합니다: 먼저 맨 피부를 읽은 뒤, 각 부위는 선크림으로 덮을 때까지 노란색이고 덮으면 초록색으로 바뀝니다.'],
['Your sunscreen', 'واقي الشمس الذي تستخدمينه¦واقي الشمس الذي تستخدمه', '사용하는 선크림'],
['Sunscreen name, e.g. the brand and product', 'اسم الواقي، مثلًا الماركة واسم المنتج', '선크림 이름 (예: 브랜드와 제품명)'],
['Start — apply sunscreen in front of the camera', 'ابدئي — ضعي الواقي أمام الكاميرا¦ابدأ — ضع الواقي أمام الكاميرا', '시작 — 카메라 앞에서 선크림 바르기'],
['Don’t apply sunscreen yet: the camera reads your bare skin first, then guides you area by area.', 'لا تضعي الواقي بعد: تقرأ الكاميرا بشرتك قبله أولًا، ثم ترشدك منطقة منطقة.¦لا تضع الواقي بعد: تقرأ الكاميرا بشرتك قبله أولًا، ثم ترشدك منطقة منطقة.', '아직 선크림을 바르지 마세요: 카메라가 먼저 맨 피부를 읽은 뒤 부위별로 안내합니다.'],
['Write the name of your sunscreen.', 'اكتبي اسم واقي الشمس.¦اكتب اسم واقي الشمس.', '선크림 이름을 입력하세요.'],
['Detected automatically', 'تم التحديد تلقائيًا', '자동으로 감지됨'],
['Turn on location so My skin can read where you are and the weather, and set the checks by itself.', 'فعّلي الموقع ليعرف بشرتي مكانك والطقس ويضبط مواعيد الفحص بنفسه.¦فعّل الموقع ليعرف بشرتي مكانك والطقس ويضبط مواعيد الفحص بنفسه.', '위치를 켜면 마이 스킨이 현재 위치와 날씨를 읽고 체크 간격을 스스로 정합니다.'],
['Outdoors in the sun', 'في الخارج تحت الشمس', '야외 햇빛 아래'],
['Indoors or in the shade', 'في مكان مغلق أو في الظل', '실내 또는 그늘'],
['Checks every {} min — set automatically from your location, UV and temperature.', 'فحص كل {0} دقيقة — يُضبط تلقائيًا حسب موقعك ومؤشر الأشعة والحرارة.', '{0}분마다 체크 — 위치, 자외선, 기온에 따라 자동으로 설정됩니다.'],
['UV {} ({})', 'مؤشر الأشعة {0} ({1})', '자외선 {0} ({1})'],
['Place:', 'المكان:', '장소:'],
['Indoor place', 'مكان مغلق', '실내 장소'],
['Sunscreen: {}', 'الواقي: {0}', '선크림: {0}'],
['Checks every {} min (automatic)', 'فحص كل {0} د (تلقائي)', '{0}분마다 체크 (자동)'],
['Apply your sunscreen in front of the camera: each area of your face is yellow until it is covered and turns green. After that My skin reminds you to come back for a short check, measures where the sunscreen has been absorbed and where it is still on the skin, and writes it all into your skin health record.', 'ضعي واقي الشمس أمام الكاميرا: كل منطقة في وجهك صفراء حتى تُغطّى فتتحول إلى خضراء. بعدها يذكّرك بشرتي بالرجوع لفحص قصير، ويقيس أين امتُص الواقي وأين ما زال على البشرة، ويكتب كل ذلك في سجلك الطبي.¦ضع واقي الشمس أمام الكاميرا: كل منطقة في وجهك صفراء حتى تُغطّى فتتحول إلى خضراء. بعدها يذكّرك بشرتي بالرجوع لفحص قصير، ويقيس أين امتُص الواقي وأين ما زال على البشرة، ويكتب كل ذلك في سجلك الطبي.', '카메라 앞에서 선크림을 바르세요: 얼굴의 각 부위는 덮일 때까지 노란색이고 덮이면 초록색이 됩니다. 그 후 마이 스킨이 짧은 체크를 하라고 알려 주고, 선크림이 어디에 흡수됐고 어디에 아직 남아 있는지 측정해 피부 건강 기록에 모두 기록합니다.'],
['Your location, the place type, temperature and UV are read automatically and set how often you are checked. Checks run while this page is open.', 'يُقرأ موقعك ونوع المكان والحرارة ومؤشر الأشعة تلقائيًا لتحديد مواعيد الفحص. تعمل الفحوصات ما دامت الصفحة مفتوحة.', '위치, 장소 유형, 기온, 자외선을 자동으로 읽어 체크 간격을 정합니다. 체크는 이 페이지가 열려 있는 동안 작동합니다.'],
['not measured', 'لم تُقَس', '측정 안 됨'],
['still on the skin', 'ما زال على البشرة', '아직 피부 위에 남아 있음'],
['partly absorbed', 'امتُص جزئيًا', '일부 흡수됨'],
['fully absorbed', 'امتُص بالكامل', '완전히 흡수됨'],
['{}: {} — {}% of the sunscreen film is still visible.', '{0}: {1} — ما زال {2}% من طبقة الواقي ظاهرًا.', '{0}: {1} — 선크림 막이 아직 {2}% 보입니다.'],
['Sunscreen was applied in front of the camera: every area turned from yellow to green once it was covered.', 'وُضع الواقي أمام الكاميرا: تحولت كل منطقة من الأصفر إلى الأخضر عند تغطيتها.', '카메라 앞에서 선크림을 발랐습니다: 각 부위는 덮이는 순간 노란색에서 초록색으로 바뀌었습니다.'],
['{}: covered — {}% of the measured points changed colour.', '{0}: مغطاة — تغيّر لون {1}% من النقاط المقاسة.', '{0}: 덮임 — 측정 포인트의 {1}%에서 색이 변했습니다.'],
['{}: covered — {}.', '{0}: مغطاة — {1}.', '{0}: 덮임 — {1}.'],
['The strength of the sunscreen film was measured point by point against your bare skin.', 'قيست قوة طبقة الواقي نقطة نقطة مقارنةً ببشرتك قبل الواقي.', '선크림 막의 강도는 맨 피부와 비교해 포인트마다 측정했습니다.'],
['Next check scheduled in {} min.', 'الفحص القادم بعد {0} دقيقة.', '다음 체크는 {0}분 뒤입니다.'],
['✅ All areas are green — hold still for a moment', '✅ كل المناطق خضراء — اثبتي لحظة¦✅ كل المناطق خضراء — اثبت لحظة', '✅ 모든 부위가 초록색입니다 — 잠시 움직이지 마세요'],
['🟢 All areas covered — this is your reference. Close the camera until the next check.', '🟢 كل المناطق مغطاة — هذا هو المرجع. أغلقي الكاميرا حتى الفحص القادم.¦🟢 كل المناطق مغطاة — هذا هو المرجع. أغلق الكاميرا حتى الفحص القادم.', '🟢 모든 부위를 덮었습니다 — 이것이 기준입니다. 다음 체크까지 카메라를 닫으세요.'],
['Close camera', 'إغلاق الكاميرا', '카메라 닫기'],
];

const DICT = {ar:new Map(), ko:new Map()};
const PATTERNS = {ar:[], ko:[]};
const norm = s => s.replace(/\s+/g, ' ').trim();
const reEsc = s => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
for(const [en, ar, ko] of D){
  const key = norm(en);
  if(key.includes('{}')){
    const re = new RegExp('^' + key.split('{}').map(reEsc).join('(.+?)') + '$');
    const lit = key.replace(/\{\}/g, '').length;
    PATTERNS.ar.push({re, v:ar, lit}); PATTERNS.ko.push({re, v:ko, lit});
  } else { DICT.ar.set(key, ar); DICT.ko.set(key, ko); }
}
PATTERNS.ar.sort((a, b) => b.lit - a.lit); PATTERNS.ko.sort((a, b) => b.lit - a.lit);

const KEY = 'bshrty:lang';
function initialLang(){
  try{ const s = localStorage.getItem(KEY); if(LANGS[s]) return s; }catch(e){}
  const n = (navigator.language || 'en').slice(0, 2);
  return LANGS[n] ? n : 'en';
}
let lang = initialLang();
// `state` is the app's global (top-level let in the main script)
const isMale = () => { try{ return typeof state !== 'undefined' && !!state && state.gender === 'male'; }catch(e){ return false; } };
const pick = v => { if(v.indexOf('¦') < 0) return v; const [f, m] = v.split('¦'); return isMale() ? m : f; };

// translate one string; returns null when nothing is known for it
function lookup(s, depth){
  if(lang === 'en' || !s) return null;
  const d = DICT[lang];
  if(d.has(s)) return pick(d.get(s));
  if(depth > 3) return null;
  if(/^[\d\s.,:%×+\-−–≈/()]+$/.test(s)) return null;
  const cands = [];
  for(const p of PATTERNS[lang]){
    const m = s.match(p.re);
    if(!m) continue;
    const caps = m.slice(1).map(c => ({c, t: lookup(c.trim(), depth + 1)}));
    // "open" = some English is still left in a filled-in part (untranslated, or only partly translated)
    const open = caps.some(x => /[A-Za-z]{3,}/.test(x.t ?? x.c));
    // a short pattern ("{} skin") must not swallow a whole sentence it can't translate
    if(p.lit < 10 && open) continue;
    const r = pick(p.v).replace(/\{(\d)\}/g, (_, i) => caps[+i].t ?? caps[+i].c);
    if(!open) return r;
    cands.push(r);              // keep it, but let a sentence split compete
    break;
  }
  // split into pieces (separators, sentences) and keep the split that leaves the least English
  const parts = (list, sep) => { let hit = false; const out = list.map(x => { const t = lookup(x.trim(), depth + 1); if(t != null){ hit = true; return t; } return x.trim(); }); return hit ? out.join(sep) : null; };
  const left = r => (r.match(/[A-Za-z]{3,}/g) || []).length;
  const sentences = s.split(/(?<=[.!?])\s+(?=[A-Z"“])/);   // several sentences in one node
  if(sentences.length > 1) cands.unshift(parts(sentences, ' '));
  for(const sep of [' · ', ' — ']){
    const i = s.indexOf(sep);
    if(i < 0) continue;
    cands.push(parts(s.split(sep), sep));
    cands.push(parts([s.slice(0, i), s.slice(i + sep.length)], sep));
  }
  const best = cands.filter(r => r != null).sort((a, b) => left(a) - left(b))[0];
  if(best != null) return best;
  let m = s.match(/^(\d+)\.\s+(.+)$/);              // "1. Medical profile"
  if(m){ const t = lookup(m[2], depth + 1); if(t != null) return m[1] + '. ' + t; }
  m = s.match(/^(.*?)([:.!?…]+)$/);                 // trailing punctuation
  if(m && m[1]){ const t = lookup(m[1], depth + 1); if(t != null) return t + m[2]; }
  m = s.match(/^([^\p{L}\p{N}]+?)\s*(\p{L}.*)$/u);    // leading symbols: "✓ Nose", "· shine", ": text"
  if(m){ const t = lookup(m[2], depth + 1); if(t != null) return m[1] + ' ' + t; }
  m = s.match(/^(.+?)\s*(\([^()]*\))$/);            // trailing note in brackets: "Nose (4/40)"
  if(m){ const t = lookup(m[1], depth + 1); if(t != null) return t + ' ' + m[2]; }
  if(s.includes(', ')){ const r = parts(s.split(', '), lang === 'ar' ? '، ' : ', '); if(r != null) return r; }
  return null;
}
function tr(s){
  if(lang === 'en' || s == null) return s;
  const str = String(s), n = norm(str);
  if(!n) return str;
  const t = lookup(n, 0);
  if(t == null){ if(window.I18N_DEBUG) missing.add(n); return str; }
  const lead = /^\s/.test(str) ? ' ' : '', trail = /\s$/.test(str) ? ' ' : '';
  return lead + t + trail;
}
const missing = new Set();

// DOM pass: text nodes and a few attributes, remembering the English source
const SRC = new WeakMap();      // text node -> English
const OUT = new WeakMap();      // text node -> last value we wrote
const ATTRS = ['placeholder', 'aria-label', 'title'];
const SKIP = el => el.closest && el.closest('script,style,textarea,[data-noi18n]');
function doText(node){
  const cur = node.nodeValue;
  if(OUT.get(node) === cur) return;              // our own write
  SRC.set(node, cur);
  if(lang === 'en'){ OUT.delete(node); return; }
  const t = tr(cur);
  if(t !== cur){ OUT.set(node, t); node.nodeValue = t; }
}
function doEl(el){
  for(const a of ATTRS){
    if(!el.hasAttribute(a)) continue;
    const k = 'data-i18n-' + a, cur = el.getAttribute(a);
    let src = el.getAttribute(k);
    if(src == null || el.getAttribute('data-i18n-o-' + a) !== cur){ src = cur; el.setAttribute(k, src); }
    const t = lang === 'en' ? src : tr(src);
    if(t !== cur) el.setAttribute(a, t);
    el.setAttribute('data-i18n-o-' + a, t);
  }
}
function walk(root){
  if(root.nodeType === 3){ if(root.parentElement && !SKIP(root.parentElement)) doText(root); return; }
  if(root.nodeType !== 1 || SKIP(root)) return;
  doEl(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.nodeType === 1 && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.tagName)) || (n.nodeType === 1 && n.hasAttribute('data-noi18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  let n; while((n = w.nextNode())){ if(n.nodeType === 3) doText(n); else doEl(n); }
}
// put every text node back to English, then translate again (used when switching language)
function retranslate(){
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while((n = w.nextNode())){ const s = SRC.get(n); if(s != null && OUT.get(n) === n.nodeValue){ OUT.delete(n); n.nodeValue = s; } }
  document.querySelectorAll('[data-i18n-placeholder],[data-i18n-aria-label],[data-i18n-title]').forEach(el => {
    for(const a of ATTRS){ const s = el.getAttribute('data-i18n-' + a); if(s != null){ el.setAttribute(a, s); el.removeAttribute('data-i18n-o-' + a); } }
  });
  walk(document.body);
}
const mo = new MutationObserver(list => {
  for(const m of list){
    if(m.type === 'characterData') { if(m.target.parentElement && !SKIP(m.target.parentElement)) doText(m.target); }
    else if(m.type === 'attributes') { if(!m.attributeName.startsWith('data-i18n')) doEl(m.target); }
    else m.addedNodes.forEach(walk);
  }
});

function applyDoc(){
  const L = LANGS[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = L.dir;
  if(!applyDoc.title) applyDoc.title = document.title;
  document.title = lang === 'en' ? applyDoc.title : tr(applyDoc.title);
}
function setLang(l){
  if(!LANGS[l] || l === lang) return;
  lang = l;
  try{ localStorage.setItem(KEY, l); }catch(e){}
  applyDoc();
  retranslate();
  document.dispatchEvent(new CustomEvent('langchange', {detail:l}));
}

// native dialogs
const _confirm = window.confirm.bind(window), _alert = window.alert.bind(window);
window.confirm = m => _confirm(tr(m));
window.alert = m => _alert(tr(m));

function start(){
  applyDoc();
  walk(document.body);
  mo.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS});
}
if(document.body) start(); else document.addEventListener('DOMContentLoaded', start);

// translate a whole HTML document string (used for downloaded reports)
function translateHtml(html){
  if(lang === 'en') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const w = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_TEXT);
  let n; while((n = w.nextNode())){ if(!n.parentElement || /^(STYLE|SCRIPT)$/.test(n.parentElement.tagName)) continue; n.nodeValue = tr(n.nodeValue); }
  return '<!doctype html>' + doc.documentElement.outerHTML;
}

window.I18N = {
  LANGS, tr, setLang, missing, translateHtml,
  get lang(){ return lang; },
  get locale(){ return LANGS[lang].locale; },
  get aiLanguage(){ return {en:'English', ar:'Arabic', ko:'Korean'}[lang]; }
};
})();
