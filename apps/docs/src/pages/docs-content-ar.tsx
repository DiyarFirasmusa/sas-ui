import { CodeBlock } from '../code-block';
import type { DocSlug } from '../use-hash-route';
import { Code, H2, P, Ul } from './docs-content';
import type { DocPage } from './docs-content';

/** Arabic versions of the prose docs pages; a missing slug falls back to English. */
export const DOCS_AR: Partial<Record<DocSlug, DocPage>> = {
  introduction: {
    title: 'مقدمة',
    description: 'مكتبة مكوّنات React تملك شيفرتها، للوحات تحكم تبدأ من اليمين إلى اليسار.',
    body: (
      <>
        <P>
          SAS UI ليست حزمة تثبّتها وتستورد منها. إنها مجموعة من المكوّنات والبلوكات والـ design tokens
          تنسخها إلى مشروعك كشيفرة TypeScript عادية ثم تملكها: تقرأ كل سطر، وتغيّر ما تحتاجه، وتحتفظ
          بنسختك الخاصة. الفكرة هي نفسها في shadcn/ui، أما الجمهور المستهدف فهو لوحات تحكم الأنظمة
          الإدارية بالعربية والإنجليزية.
        </P>
        <H2 id="principles">المبادئ</H2>
        <Ul>
          <li>
            <strong>شيفرة مفتوحة.</strong> لا اعتماد وقت تشغيل على SAS UI. الأمر{' '}
            <Code>sas-ui diff</Code> يبيّن كيف ابتعدت نسختك عن السجل (registry).
          </li>
          <li>
            <strong>عناصر أساسية متاحة.</strong> يأتي السلوك من Base UI، وكل مكوّن يُشحن مع اختبار
            Testing Library وaxe.
          </li>
          <li>
            <strong>RTL أولاً.</strong> خصائص CSS المنطقية فقط (يفرضها اختبار)، وأيقونات تنعكس، وحقول
            إدخال تتبع لغة الكتابة، وأرقام لاتينية افتراضياً، والتقويم الهجري، وتوحيد النص العربي في
            البحث.
          </li>
          <li>
            <strong>السمة كبيانات.</strong> نحو 78 token للألوان، وأربع سمات جاهزة، مع فحص WCAG AA في
            الوضعين الفاتح والداكن.
          </li>
          <li>
            <strong>أوسع من الأساسيات.</strong> جدول بيانات مع virtualisation، ومنشئ مرشّحات، ومنتقي
            شجرة، وشريط حالة، ومنتقيات تاريخ، ومخططات، ومحرر نص منسّق، وهيكل تطبيق، و16 بلوك صفحة.
          </li>
        </Ul>
        <H2 id="what-is-inside">ماذا بالداخل</H2>
        <Ul>
          <li>
            <a className="text-primary-text hover:underline" href="#/components">
              المكوّنات
            </a>{' '}
            — نماذج، ونوافذ منبثقة، وتنقل، وبيانات، وتغذية راجعة.
          </li>
          <li>
            <a className="text-primary-text hover:underline" href="#/blocks">
              البلوكات
            </a>{' '}
            — صفحات كاملة: تسجيل الدخول، والهياكل، ولوحة التحكم، والقائمة، والتفاصيل، والمعالج،
            والإعدادات.
          </li>
          <li>
            <a className="text-primary-text hover:underline" href="#/charts">
              المخططات
            </a>{' '}
            — بطاقات Recharts تُقرأ من اليمين إلى اليسار.
          </li>
          <li>
            <a className="text-primary-text hover:underline" href="#/themes">
              السمات
            </a>{' '}
            — سمات جاهزة تبدّلها أثناء التشغيل أو تثبّتها عبر CLI.
          </li>
        </Ul>
      </>
    ),
  },
  installation: {
    title: 'التثبيت',
    description: 'جهّز مشروع Vite وReact 19 وTailwind v4 بأمرين.',
    body: (
      <>
        <H2 id="requirements">المتطلبات</H2>
        <Ul>
          <li>
            React 19 وTypeScript وVite 7 فما فوق وTailwind CSS v4 (بنمط CSS-first،{' '}
            <Code>@import &apos;tailwindcss&apos;</Code>).
          </li>
          <li>Node 20.19 أو أحدث.</li>
        </Ul>
        <H2 id="init">التهيئة</H2>
        <P>
          شغّل <Code>init</Code> داخل مشروعك. يجد ملف الأنماط الرئيسي لـ Tailwind، ويكتب CSS الخاص
          بالـ tokens وملف <Code>sas-ui.json</Code>، ويضبط الاختصار <Code>@/</Code> في tsconfig
          وVite، ويضيف الدالة <Code>cn()</Code>.
        </P>
        <CodeBlock code={'npx sas-ui init --preset wine-lapis --all-presets'} />
        <H2 id="add">إضافة المكوّنات</H2>
        <CodeBlock
          code={
            'npx sas-ui add button input select dialog data-table\nnpx sas-ui add dashboard-01 list-page-01'
          }
        />
        <P>
          تُحلّ الاعتماديات بين المكوّنات تلقائياً وبترتيب التثبيت، وتُثبَّت حزم npm التي تحتاجها عبر مدير
          الحزم لديك.
        </P>
        <H2 id="html">ضبط اللغة والسمة</H2>
        <CodeBlock code={'<html lang="ar" dir="rtl" data-preset="wine-lapis" class="dark">'} />
        <P>
          تختار <Code>data-preset</Code> لوحة الألوان (في وضع all-presets)، ويختار الصنف{' '}
          <Code>dark</Code> الوضع. يقرأ Base UI الاتجاه من مزوّده الخاص: غلّف تطبيقك بـ{' '}
          <Code>LocaleProvider</Code> (أو بمزوّد السمة) لتنعكس النوافذ المنبثقة وأسهم لوحة المفاتيح
          بشكل صحيح.
        </P>
        <H2 id="manual">التثبيت اليدوي</H2>
        <P>
          في صفحة كل مكوّن تبويب «يدوي» يعرض ملفاته. انسخها، وأبقِ الاختصارات{' '}
          <Code>@/components/ui</Code> و<Code>@/lib</Code> و<Code>@/hooks</Code> (أو غيّر عبارات
          الاستيراد)، وثبّت الحزم المذكورة.
        </P>
      </>
    ),
  },
  theming: {
    title: 'السمات',
    description: 'عقد للـ tokens، وأربع سمات جاهزة، وتبديل أثناء التشغيل.',
    body: (
      <>
        <P>
          السمة بيانات: خريطة فاتحة وأخرى داكنة من نحو 78 token. يحوّلها المولّد إلى متغيرات CSS وإلى
          ربط <Code>@theme inline</Code> في Tailwind، فتقرأ أصناف مثل <Code>bg-surface</Code> و
          <Code>text-text-muted</Code> و<Code>border-stroke</Code> متغيرات حيّة — ولا يحتاج التبديل
          إلى إعادة بناء.
        </P>
        <H2 id="presets">السمات الجاهزة</H2>
        <Ul>
          <li>
            <Code>neutral</Code> — رماديات زنك، وهي الافتراضية.
          </li>
          <li>
            <Code>wine-lapis</Code> — خمري وكحلي لازوردي مع ذهبي.
          </li>
          <li>
            <Code>inventory</Code> — خمري دافئ على فحمي.
          </li>
          <li>
            <Code>hr</Code> — برقوقي مع ذهبي وشريط جانبي برقوقي غامق.
          </li>
        </Ul>
        <P>
          شاهدها جنباً إلى جنب في صفحة{' '}
          <a className="text-primary-text hover:underline" href="#/themes">
            السمات
          </a>
          ، وكل token في صفحة{' '}
          <a className="text-primary-text hover:underline" href="#/tokens">
            الـ Tokens
          </a>
          .
        </P>
        <H2 id="switching">التبديل</H2>
        <CodeBlock
          code={`import { applyPreset, applyMode, applyDirection } from '@sas-ui/tokens/apply-preset';

applyPreset('inventory');   // <html data-preset="inventory">
applyMode('dark');          // <html class="dark">
applyDirection('rtl', 'ar'); // <html dir="rtl" lang="ar">`}
        />
        <H2 id="cli">عبر CLI</H2>
        <CodeBlock code={'npx sas-ui theme list\nnpx sas-ui theme set hr'} />
        <H2 id="contrast">التباين</H2>
        <P>
          كل سمة مشحونة تُختبر: كل النصوص على الخلفية والأسطح بنسبة 4.5:1، والنص على الألوان المعبّأة
          والمظلّلة، ونص الوسم على حاويته، وأزواج الشريط الجانبي، وحلقة التركيز بنسبة 3:1 — في
          الوضعين الفاتح والداكن.
        </P>
      </>
    ),
  },
  cli: {
    title: 'CLI',
    description: 'الأوامر init وadd وdiff وlist وtheme.',
    body: (
      <>
        <H2 id="init">init</H2>
        <CodeBlock
          code={
            'sas-ui init [--preset <name>] [--all-presets] [--css <file>] [--src-dir src] [--alias @]\n          [--force] [--no-install] [--no-alias-setup]'
          }
        />
        <H2 id="add">add</H2>
        <CodeBlock
          code={'sas-ui add <item...> [--all] [--overwrite] [--tests] [--dry-run] [--no-install]'}
        />
        <P>
          ينسخ كل عنصر وما يعتمد عليه. لا يُستبدل أي ملف عدّلته دون <Code>--overwrite</Code>. وينسخ
          الخيار <Code>--tests</Code> اختبارات Vitest وأدوات الاختبار أيضاً.
        </P>
        <H2 id="diff">diff</H2>
        <CodeBlock code={'sas-ui diff [item...] [--verbose]'} />
        <P>
          يقارن نسختك بالسجل (بعد إعادة كتابة عبارات الاستيراد وفق اختصاراتك، فلا يظهر إلا ما عدّلته
          فعلاً) ويخرج بالرمز 1 عند وجود اختلاف.
        </P>
        <H2 id="upstream">upstream</H2>
        <CodeBlock
          code={'sas-ui upstream <item...> --to <library>/packages/registry/src [--dry-run]'}
        />
        <P>
          يعيد مكوّناً حسّنته في مشروعك إلى نسخة من المكتبة، مع تحويل اختصاراتك إلى اختصارات السجل،
          ليمكن مراجعة التحسين واعتماده هناك.
        </P>
        <H2 id="list">list</H2>
        <CodeBlock code={'sas-ui list [--category <name>] [--installed] [--json]'} />
        <H2 id="theme">theme</H2>
        <CodeBlock code={'sas-ui theme list\nsas-ui theme set <preset> [--all-presets]'} />
        <H2 id="registry">موقع السجل</H2>
        <P>
          يُستخدم افتراضياً السجل المرفق مع CLI (دون اتصال وبنتائج قابلة للتكرار). وجّهه إلى مكان آخر
          عبر <Code>--registry &lt;dir|url&gt;</Code> أو المتغير <Code>SAS_UI_REGISTRY</Code>.
        </P>
      </>
    ),
  },
  rtl: {
    title: 'RTL والعربية',
    description: 'ماذا يعني «من اليمين إلى اليسار أولاً» عملياً.',
    body: (
      <>
        <H2 id="layout">التخطيط المنطقي</H2>
        <P>
          تستخدم المكوّنات الأصناف المنطقية فقط — <Code>ps-*</Code> و<Code>me-*</Code> و
          <Code>start-*</Code> و<Code>text-start</Code> و<Code>border-s</Code>. ويفشل اختبار في
          السجل عند وجود <Code>ml-</Code> أو <Code>pr-</Code> أو <Code>left-</Code> وأمثالها، فلا
          يمكن أن يصل خطأ في الاتجاه إلى النسخة النهائية.
        </P>
        <H2 id="direction">الاتجاه وBase UI</H2>
        <P>
          يقرأ Base UI الاتجاه من مزوّده الخاص لا من <Code>&lt;html dir&gt;</Code>. ويضبطه{' '}
          <Code>LocaleProvider</Code> لكل المكوّنات، فتنعكس مقابض شريط التمرير وأسهم القوائم الفرعية
          والتنقل بلوحة المفاتيح.
        </P>
        <H2 id="text">النصوص والأرقام</H2>
        <Ul>
          <li>
            تتبع حقول النص الحر لغة الكتابة؛ أما البريد الإلكتروني والرموز وأرقام الهاتف فتبقى من
            اليسار إلى اليمين.
          </li>
          <li>
            الأرقام لاتينية افتراضياً؛ مرّر <Code>numerals=&quot;locale&quot;</Code> للأرقام الهندية.
          </li>
          <li>
            تجعل <Code>arabic-normalize</Code> البحث يتجاهل التشكيل وصور الألف والياء وأنماط الأرقام.
          </li>
        </Ul>
        <H2 id="calendars">التقاويم</H2>
        <P>
          يدعم التقويم ومنتقيات التاريخ الميلادي والهجري (أم القرى والمدني) وتقويماً ثانوياً صغيراً تحت
          كل يوم. وتبقى القيم نصوص ISO ميلادية، فلا تتغير النماذج ولا الخلفيات.
        </P>
        <H2 id="tables">الجداول والمخططات</H2>
        <P>
          يقع العمود الأول عند البداية، وتُحاذى الأعمدة الرقمية إلى النهاية بأرقام جدولية، وتربط شبكة
          البيانات الأسهم بالاتجاه المنطقي، وتنعكس محاور المخططات.
        </P>
      </>
    ),
  },
  migration: {
    title: 'الترحيل',
    description: 'نقل لوحة تحكم قائمة إلى SAS UI.',
    body: (
      <>
        <P>
          تتشارك لوحات SAS الثلاث أسماء الـ tokens وواجهات العناصر الأساسية مع هذه المكتبة، لذا يكون
          معظم العمل حذف ملف محلي وتشغيل <Code>sas-ui add</Code> وتصحيح عبارات الاستيراد.
        </P>
        <H2 id="steps">الخطوات</H2>
        <Ul>
          <li>
            شغّل <Code>sas-ui init --preset …</Code>، ثم احذف ملف <Code>tokens-colors.css</Code>{' '}
            الخاص بالتطبيق وكتلة <Code>@theme</Code> فيه بعد أن ينجح البناء.
          </li>
          <li>
            استبدل ملفات <Code>src/components/ui/*</Code> ملفاً ملفاً بالأمر <Code>sas-ui add</Code>.
          </li>
          <li>
            أبقِ مهايئات حقول react-hook-form، واستخدم <Code>form-fields</Code> للحصول على أسماء
            الخصائص نفسها.
          </li>
          <li>
            استبدل الجداول والمرشّحات بـ <Code>data-table</Code> و<Code>filter-bar</Code> و
            <Code>filter-builder</Code>.
          </li>
          <li>
            شغّل <Code>sas-ui diff</Code> واختباراتك الخاصة بعد كل خطوة.
          </li>
        </Ul>
        <P>
          التعيين الكامل لكل مكوّن قائم موجود في <Code>docs/MIGRATION.md</Code> داخل المستودع.
        </P>
      </>
    ),
  },
};
