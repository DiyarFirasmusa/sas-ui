import type { Locale } from '@/lib/locale';
import type { DocSlug } from '../use-hash-route';

/**
 * Every string of the docs site chrome, in both languages. `en` defines the
 * keys; `ar` is typed against them, so a missing (or extra) Arabic key is a
 * compile error. Placeholders look like `{count}` and are filled by `t(key, { count })`.
 *
 * Proper nouns, CLI commands, file names, token and preset names stay English
 * on purpose and are not in here.
 */
const en = {
  'meta.title': 'SAS UI — components',

  'nav.docs': 'Docs',
  'nav.components': 'Components',
  'nav.blocks': 'Blocks',
  'nav.charts': 'Charts',
  'nav.themes': 'Themes',
  'nav.tokens': 'Tokens',
  'nav.allComponents': 'All components',

  'header.main': 'Main',
  'header.menu': 'Menu',
  'header.search': 'Search documentation',
  'header.searchPlaceholder': 'Search documentation…',
  'header.preset': 'Preset',
  'header.toLight': 'Switch to light mode',
  'header.toDark': 'Switch to dark mode',

  'sidebar.label': 'Documentation',
  'sidebar.getStarted': 'Get started',
  'sidebar.browse': 'Browse',
  'sidebar.helpers': 'Helpers',
  'onThisPage.title': 'On this page',

  'doc.introduction': 'Introduction',
  'doc.installation': 'Installation',
  'doc.theming': 'Theming',
  'doc.cli': 'CLI',
  'doc.rtl': 'RTL & Arabic',
  'doc.migration': 'Migration',
  'docs.pager': 'Pager',

  'category.foundation': 'Foundation',
  'category.form': 'Forms',
  'category.overlay': 'Overlays',
  'category.navigation': 'Navigation',
  'category.data': 'Data',
  'category.feedback': 'Feedback',
  'category.display': 'Display',
  'category.layout': 'Layout',
  'category.helpers': 'Helpers',

  'search.title': 'Search documentation',
  'search.placeholder': 'Search components, blocks and docs…',
  'search.pages': 'Pages',
  'search.docs': 'Docs',
  'search.components': 'Components',
  'search.blocks': 'Blocks',

  'common.loading': 'Loading…',
  'code.copy': 'Copy code',
  'code.copied': 'Copied',
  'code.copyCommand': 'Copy command {command}',
  'example.crashed': 'This example crashed: {message}',
  'example.preview': 'Preview',
  'example.code': 'Code',

  'home.badge': '{count} blocks and Hijri calendar are in →',
  'home.title': 'The component library for Arabic-first dashboards',
  'home.subtitle':
    'Accessible, themeable, right-to-left components and whole pages. Open source — copy it into your app and own the code.',
  'home.getStarted': 'Get started',
  'home.browseBlocks': 'Browse blocks',
  'home.badgeComponents': '{count} components',
  'home.badgeBlocks': '{count} blocks',
  'home.badgePresets': '4 presets',
  'home.previewTitle': 'Dashboard block preview',
  'home.featuresLabel': 'Features',
  'home.feature.rtl.title': 'Right-to-left first',
  'home.feature.rtl.text':
    'Logical CSS only, mirrored icons, Arabic labels, Latin digits, Hijri calendar and Arabic search.',
  'home.feature.open.title': 'Open code',
  'home.feature.open.text':
    'Components are copied into your project. Read them, change them, diff them against the registry.',
  'home.feature.themes.title': 'Themes as data',
  'home.feature.themes.text':
    'Four presets, about 78 tokens each, WCAG AA checked in light and dark, switchable at runtime.',
  'home.feature.erp.title': 'Built for ERP',
  'home.feature.erp.text':
    'Virtualised data table, filter builder, status bar, tree picker, wizards and approvals.',
  'home.feature.a11y.title': 'Accessible',
  'home.feature.a11y.text':
    'Base UI primitives; every component has a Testing Library and axe test.',
  'home.feature.cli.title': 'One CLI',
  'home.feature.cli.text':
    'init, add, diff, list and theme — with dependency resolution and your own aliases.',

  'components.title': 'Components',
  'components.intro':
    '{count} components, each readable source you copy into your project with {command}. Built on Base UI, tested with axe, right-to-left first.',

  'component.notFound': 'No component called “{name}”.',
  'component.extraDeps': 'extra dependencies',
  'component.previous': 'Previous: {title}',
  'component.next': 'Next: {title}',
  'component.installation': 'Installation',
  'component.manual': 'Manual',
  'component.examples': 'Examples',
  'component.loadingExamples': 'Loading examples…',
  'component.source': 'Source',
  'component.helperNote':
    'This is a helper, not a visual component. It is copied automatically when a component needs it.',
  'component.manualOne':
    'Copy this file into your project and fix the imports to match your aliases. The CLI does both for you, including the files this one depends on.',
  'component.manualMany':
    'Copy these files into your project and fix the imports to match your aliases. The CLI does both for you, including the files this one depends on.',

  'blocks.title': 'Building blocks for dashboards',
  'blocks.subtitle':
    'Whole pages composed from the library — sign-in, shells, dashboards, lists, details, forms. Right-to-left first, copy them in and edit.',
  'blocks.getStarted': 'Get started',
  'blocks.viewComponents': 'View components',
  'blocks.categoriesLabel': 'Block categories',
  'blocks.cat.featured': 'Featured',
  'blocks.cat.dashboard': 'Dashboard',
  'blocks.cat.pages': 'Pages',
  'blocks.cat.layout': 'Layouts',
  'blocks.cat.auth': 'Sign in',
  'blocks.cat.errors': 'Errors',

  'block.notFound': 'No block called “{name}”.',
  'block.badge': 'block',
  'block.previewTitle': '{title} preview',
  'block.width.desktop': 'Desktop',
  'block.width.tablet': 'Tablet',
  'block.width.mobile': 'Mobile',
  'block.widthLabel': 'Preview width',
  'block.variantLabel': 'Preview variant',
  'block.open': 'Open',

  'charts.title': 'Charts that read right-to-left',
  'charts.subtitle':
    'Recharts cards with token colours, Latin digits, accessible summaries and mirrored axes for Arabic. Copy and paste into your app.',
  'charts.typesLabel': 'Chart types',
  'charts.area': 'Area',
  'charts.bar': 'Bar',
  'charts.line': 'Line',
  'charts.pie': 'Pie / Donut',

  'themes.title': 'Pick a theme',
  'themes.subtitle':
    'Each preset is a full token set — surfaces, text, brand, status, tags, sidebar and charts — contrast-checked to WCAG AA in light and dark. Switch at runtime or install one with the CLI.',
  'themes.browseTokens': 'Browse every token',
  'themes.applied': 'Applied to this site',
  'themes.tryIt': 'Try it here',
  'themes.sampleRevenue': 'Revenue',
  'themes.sampleSave': 'Save',
  'themes.sampleCancel': 'Cancel',
  'themes.sampleActive': 'Active',
  'preset.neutral': 'Zinc greys with an ink primary — the default for new projects.',
  'preset.wine-lapis':
    'Burgundy wine and lapis navy with a gold accent — the erp-tourism-react palette.',
  'preset.hr': 'Plum with a gold accent and a deep plum sidebar — the erp-hr-frontend palette.',
  'preset.inventory': 'Warm burgundy on neutral charcoal — the erp-Inventory-frontend palette.',

  'tokens.title': 'Tokens & presets',
  'tokens.showing':
    'Showing {preset} in {mode}. Every value below is a CSS variable; components never contain colours.',
  'tokens.modeLight': 'light',
  'tokens.modeDark': 'dark',
  'tokens.allPass': 'WCAG AA: all pairs pass (light + dark)',
  'tokens.failures': '{count} contrast failures',
  'tokens.radius': 'radius {radius}',
  'tokens.typeRamp': 'Type ramp',
  'tokens.radii': 'Radii & elevation',
  'tokens.contrast': 'Contrast ({mode})',
  'tokens.colText': 'Text',
  'tokens.colOn': 'On',
  'tokens.colRatio': 'Ratio',
  'tokens.colNeeds': 'Needs',
};

export type MessageKey = keyof typeof en;

const ar: Record<MessageKey, string> = {
  'meta.title': 'SAS UI — المكوّنات',

  'nav.docs': 'التوثيق',
  'nav.components': 'المكوّنات',
  'nav.blocks': 'القوالب',
  'nav.charts': 'المخططات',
  'nav.themes': 'السمات',
  'nav.tokens': 'الرموز التصميمية',
  'nav.allComponents': 'كل المكوّنات',

  'header.main': 'الرئيسية',
  'header.menu': 'القائمة',
  'header.search': 'البحث في التوثيق',
  'header.searchPlaceholder': 'ابحث في التوثيق…',
  'header.preset': 'السمة الجاهزة',
  'header.toLight': 'التبديل إلى الوضع الفاتح',
  'header.toDark': 'التبديل إلى الوضع الداكن',

  'sidebar.label': 'التوثيق',
  'sidebar.getStarted': 'البدء',
  'sidebar.browse': 'استعراض',
  'sidebar.helpers': 'الأدوات المساندة',
  'onThisPage.title': 'في هذه الصفحة',

  'doc.introduction': 'مقدّمة',
  'doc.installation': 'التثبيت',
  'doc.theming': 'السمات والتخصيص',
  'doc.cli': 'أداة سطر الأوامر (CLI)',
  'doc.rtl': 'دعم RTL والعربية',
  'doc.migration': 'الترحيل',
  'docs.pager': 'التنقّل بين الصفحات',

  'category.foundation': 'الأساسيات',
  'category.form': 'النماذج',
  'category.overlay': 'النوافذ والطبقات المنبثقة',
  'category.navigation': 'التنقّل',
  'category.data': 'البيانات',
  'category.feedback': 'التنبيهات والملاحظات',
  'category.display': 'العرض',
  'category.layout': 'التخطيط',
  'category.helpers': 'الأدوات المساندة',

  'search.title': 'البحث في التوثيق',
  'search.placeholder': 'ابحث في المكوّنات والقوالب والتوثيق…',
  'search.pages': 'الصفحات',
  'search.docs': 'التوثيق',
  'search.components': 'المكوّنات',
  'search.blocks': 'القوالب',

  'common.loading': 'جارٍ التحميل…',
  'code.copy': 'نسخ الكود',
  'code.copied': 'تم النسخ',
  'code.copyCommand': 'نسخ الأمر {command}',
  'example.crashed': 'تعطّل هذا المثال: {message}',
  'example.preview': 'معاينة',
  'example.code': 'الكود',

  'home.badge': 'أصبح متاحًا الآن: {count} قالبًا جاهزًا والتقويم الهجري ←',
  'home.title': 'مكتبة المكوّنات للوحات التحكم المصمَّمة للعربية أولاً',
  'home.subtitle':
    'مكوّنات وصفحات كاملة، سهلة الوصول وقابلة للتخصيص بالسمات وتدعم الاتجاه من اليمين إلى اليسار. مفتوحة المصدر — انسخها إلى تطبيقك وامتلك الكود.',
  'home.getStarted': 'ابدأ الآن',
  'home.browseBlocks': 'استعرض القوالب',
  'home.badgeComponents': '{count} مكوّنًا',
  'home.badgeBlocks': '{count} قالبًا',
  'home.badgePresets': '4 سمات جاهزة',
  'home.previewTitle': 'معاينة قالب لوحة التحكم',
  'home.featuresLabel': 'المزايا',
  'home.feature.rtl.title': 'من اليمين إلى اليسار أولاً',
  'home.feature.rtl.text':
    'خصائص CSS المنطقية فقط، وأيقونات تنعكس تلقائيًا، وتسميات عربية، وأرقام لاتينية، والتقويم الهجري، وبحث يفهم العربية.',
  'home.feature.open.title': 'كود مفتوح',
  'home.feature.open.text':
    'تُنسخ المكوّنات إلى مشروعك. اقرأها وعدّلها وقارنها بالسجل (registry) في أي وقت.',
  'home.feature.themes.title': 'السمات كبيانات',
  'home.feature.themes.text':
    'أربع سمات جاهزة، في كل منها نحو 78 رمزًا تصميميًا، مفحوصة وفق WCAG AA في الوضعين الفاتح والداكن، وقابلة للتبديل أثناء التشغيل.',
  'home.feature.erp.title': 'مصمَّمة لأنظمة ERP',
  'home.feature.erp.text':
    'جدول بيانات افتراضي (Virtualised)، وبنّاء المرشّحات، وشريط الحالة، ومنتقي الشجرة، ومعالجات الخطوات ودورات الموافقة.',
  'home.feature.a11y.title': 'سهلة الوصول',
  'home.feature.a11y.text':
    'مبنية على عناصر Base UI الأساسية؛ ولكل مكوّن اختبار Testing Library واختبار axe.',
  'home.feature.cli.title': 'أداة واحدة بسطر الأوامر',
  'home.feature.cli.text':
    'الأوامر init وadd وdiff وlist وtheme — مع حلّ التبعيات ودعم مساراتك المخصّصة (aliases).',

  'components.title': 'المكوّنات',
  'components.intro':
    '{count} مكوّنًا، كل منها كود مقروء تنسخه إلى مشروعك بالأمر {command}. مبنية على Base UI، ومفحوصة بأداة axe، وتبدأ من اليمين إلى اليسار.',

  'component.notFound': 'لا يوجد مكوّن باسم «{name}».',
  'component.extraDeps': 'تبعيات إضافية',
  'component.previous': 'السابق: {title}',
  'component.next': 'التالي: {title}',
  'component.installation': 'التثبيت',
  'component.manual': 'يدوي',
  'component.examples': 'الأمثلة',
  'component.loadingExamples': 'جارٍ تحميل الأمثلة…',
  'component.source': 'المصدر',
  'component.helperNote': 'هذا عنصر مساعد وليس مكوّنًا مرئيًا، ويُنسخ تلقائيًا عند حاجة أي مكوّن إليه.',
  'component.manualOne':
    'انسخ هذا الملف إلى مشروعك وعدّل مسارات الاستيراد لتطابق الـ aliases عندك. تتولى أداة CLI الأمرين نيابةً عنك، بما في ذلك الملفات التي يعتمد عليها هذا الملف.',
  'component.manualMany':
    'انسخ هذه الملفات إلى مشروعك وعدّل مسارات الاستيراد لتطابق الـ aliases عندك. تتولى أداة CLI الأمرين نيابةً عنك، بما في ذلك الملفات التي تعتمد عليها هذه الملفات.',

  'blocks.title': 'القوالب الجاهزة (Blocks) لبناء لوحات التحكم',
  'blocks.subtitle':
    'صفحات كاملة مركّبة من مكوّنات المكتبة — تسجيل الدخول، والهياكل، ولوحات التحكم، والقوائم، وصفحات التفاصيل، والنماذج. تبدأ من اليمين إلى اليسار؛ انسخها وعدّلها.',
  'blocks.getStarted': 'ابدأ الآن',
  'blocks.viewComponents': 'استعرض المكوّنات',
  'blocks.categoriesLabel': 'تصنيفات القوالب',
  'blocks.cat.featured': 'المميّزة',
  'blocks.cat.dashboard': 'لوحات التحكم',
  'blocks.cat.pages': 'الصفحات',
  'blocks.cat.layout': 'الهياكل',
  'blocks.cat.auth': 'تسجيل الدخول',
  'blocks.cat.errors': 'الأخطاء',

  'block.notFound': 'لا يوجد قالب باسم «{name}».',
  'block.badge': 'قالب جاهز',
  'block.previewTitle': 'معاينة {title}',
  'block.width.desktop': 'سطح المكتب',
  'block.width.tablet': 'جهاز لوحي',
  'block.width.mobile': 'جوّال',
  'block.widthLabel': 'عرض المعاينة',
  'block.variantLabel': 'نسخة المعاينة',
  'block.open': 'فتح',

  'charts.title': 'مخططات بيانية تُقرأ من اليمين إلى اليسار',
  'charts.subtitle':
    'بطاقات Recharts بألوان الرموز التصميمية وأرقام لاتينية وملخّصات تُقرأ بقارئات الشاشة ومحاور معكوسة للعربية. انسخها والصقها في تطبيقك.',
  'charts.typesLabel': 'أنواع المخططات',
  'charts.area': 'مساحي',
  'charts.bar': 'أعمدة',
  'charts.line': 'خطي',
  'charts.pie': 'دائري / حلقي',

  'themes.title': 'اختر سمة',
  'themes.subtitle':
    'كل سمة جاهزة هي مجموعة رموز تصميمية كاملة — الأسطح والنصوص والهوية والحالات والوسوم والشريط الجانبي والمخططات — مفحوصة التباين وفق WCAG AA في الوضعين الفاتح والداكن. بدّل بينها أثناء التشغيل أو ثبّت واحدة بأداة CLI.',
  'themes.browseTokens': 'استعرض كل الرموز',
  'themes.applied': 'مُطبَّقة على هذا الموقع',
  'themes.tryIt': 'جرّبها هنا',
  'themes.sampleRevenue': 'الإيرادات',
  'themes.sampleSave': 'حفظ',
  'themes.sampleCancel': 'إلغاء',
  'themes.sampleActive': 'نشط',
  'preset.neutral': 'رمادي Zinc مع لون أساسي بلون الحبر — الافتراضي للمشاريع الجديدة.',
  'preset.wine-lapis':
    'أحمر النبيذ وأزرق اللازورد الداكن مع لمسة ذهبية — لوحة ألوان مشروع erp-tourism-react.',
  'preset.hr':
    'أرجواني داكن (Plum) مع لمسة ذهبية وشريط جانبي أرجواني غامق — لوحة ألوان erp-hr-frontend.',
  'preset.inventory': 'أحمر عنّابي دافئ على رمادي فحمي محايد — لوحة ألوان erp-Inventory-frontend.',

  'tokens.title': 'الرموز التصميمية (Tokens) والسمات',
  'tokens.showing':
    'يعرض {preset} في {mode}. كل قيمة أدناه هي متغيّر CSS؛ ولا تحتوي المكوّنات على ألوان مكتوبة فيها.',
  'tokens.modeLight': 'الوضع الفاتح',
  'tokens.modeDark': 'الوضع الداكن',
  'tokens.allPass': 'WCAG AA: كل الأزواج تجتاز الفحص (فاتح + داكن)',
  'tokens.failures': '{count} حالات إخفاق في التباين',
  'tokens.radius': 'نصف القطر {radius}',
  'tokens.typeRamp': 'سلّم الخطوط',
  'tokens.radii': 'الزوايا والارتفاع (الظلال)',
  'tokens.contrast': 'التباين ({mode})',
  'tokens.colText': 'النص',
  'tokens.colOn': 'على',
  'tokens.colRatio': 'النسبة',
  'tokens.colNeeds': 'المطلوب',
};

export type Messages = Record<Locale, Record<MessageKey, string>>;

export const messages: Messages = { en, ar };

/** The sidebar / search / pager title of each prose docs page. */
export const DOC_TITLE_KEYS: Record<DocSlug, MessageKey> = {
  introduction: 'doc.introduction',
  installation: 'doc.installation',
  theming: 'doc.theming',
  cli: 'doc.cli',
  rtl: 'doc.rtl',
  migration: 'doc.migration',
};

export function isMessageKey(key: string): key is MessageKey {
  return key in en;
}
