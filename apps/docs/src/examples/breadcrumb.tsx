import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbTrail,
} from '@/components/ui/breadcrumb';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Trail',
    description: 'Pass the whole path; the last entry is the current page.',
    render: () => (
      <BreadcrumbTrail
        items={[
          { label: 'Home', href: '#' },
          { label: 'Projects', href: '#' },
          { label: 'Website redesign' },
        ]}
      />
    ),
  },
  {
    title: 'Long trail collapses its middle',
    description: 'The hidden pages open from the ellipsis button.',
    render: () => (
      <BreadcrumbTrail
        items={[
          { label: 'Home', href: '#' },
          { label: 'Projects', href: '#' },
          { label: 'Archive', href: '#' },
          { label: '2025', href: '#' },
          { label: 'Q3', href: '#' },
          { label: 'Quarterly report' },
        ]}
      />
    ),
  },
  {
    title: 'Primitives',
    description: 'Compose by hand for custom links or separators.',
    render: () => (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Security</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
  },
  {
    title: 'Arabic (RTL)',
    description: 'Separators mirror and the landmark is named in Arabic.',
    render: () => (
      <div dir="rtl">
        <BreadcrumbTrail
          items={[
            { label: 'الرئيسية', href: '#' },
            { label: 'المشاريع', href: '#' },
            { label: 'الأرشيف', href: '#' },
            { label: '٢٠٢٥', href: '#' },
            { label: 'تقرير ربع سنوي' },
          ]}
        />
      </div>
    ),
  },
];
