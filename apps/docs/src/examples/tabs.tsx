import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Underline',
    description:
      'The pill is the default (the dashboards’ tab track); `underline` is the quieter alternative.',
    render: () => (
      <Tabs defaultValue="overview" variant="underline" className="w-full max-w-md">
        <TabsList aria-label="Project sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="text-b1">
          Overview content.
        </TabsContent>
        <TabsContent value="activity" className="text-b1">
          Activity content.
        </TabsContent>
        <TabsContent value="files" className="text-b1">
          Files content.
        </TabsContent>
      </Tabs>
    ),
  },
  {
    title: 'Pill (default)',
    render: () => (
      <Tabs defaultValue="month">
        <TabsList aria-label="Range">
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
          <TabsTrigger value="all" disabled>
            All time
          </TabsTrigger>
        </TabsList>
        <TabsContent value="week" className="text-b1">
          Last 7 days.
        </TabsContent>
        <TabsContent value="month" className="text-b1">
          Last 30 days.
        </TabsContent>
        <TabsContent value="year" className="text-b1">
          Last 12 months.
        </TabsContent>
      </Tabs>
    ),
  },
  {
    title: 'Many tabs scroll sideways on narrow screens',
    render: () => (
      <Tabs defaultValue="t1" className="w-72">
        <TabsList aria-label="Departments">
          {Array.from({ length: 8 }, (_, index) => (
            <TabsTrigger key={index} value={`t${index + 1}`}>
              Department {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="t1" className="text-b1">
          First department.
        </TabsContent>
      </Tabs>
    ),
  },
  {
    title: 'Arabic labels',
    render: () => (
      <div dir="rtl">
        <Tabs defaultValue="a">
          <TabsList aria-label="الأقسام">
            <TabsTrigger value="a">نظرة عامة</TabsTrigger>
            <TabsTrigger value="b">النشاط</TabsTrigger>
            <TabsTrigger value="c">الملفات</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="text-b1">
            محتوى النظرة العامة.
          </TabsContent>
          <TabsContent value="b" className="text-b1">
            محتوى النشاط.
          </TabsContent>
          <TabsContent value="c" className="text-b1">
            محتوى الملفات.
          </TabsContent>
        </Tabs>
      </div>
    ),
  },
];
