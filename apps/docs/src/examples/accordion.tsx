import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Single',
    description: 'One panel open at a time.',
    render: () => (
      <Accordion defaultValue={['shipping']} className="w-full max-w-md">
        <AccordionItem value="shipping">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Orders ship within two working days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>Returns</AccordionTrigger>
          <AccordionContent>Return unused items within thirty days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="warranty" disabled>
          <AccordionTrigger>Warranty (unavailable)</AccordionTrigger>
          <AccordionContent>One year.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    title: 'Multiple',
    render: () => (
      <Accordion multiple defaultValue={['a', 'b']} className="w-full max-w-md">
        <AccordionItem value="a">
          <AccordionTrigger>Account</AccordionTrigger>
          <AccordionContent>Manage your profile and sign-in.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Notifications</AccordionTrigger>
          <AccordionContent>Choose what reaches your inbox.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="c">
          <AccordionTrigger>Privacy</AccordionTrigger>
          <AccordionContent>Control who can see your activity.</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    title: 'Sidebar groups',
    render: () => (
      <Accordion
        variant="sidebar"
        multiple
        defaultValue={['reports']}
        className="bg-sidebar p-field w-60 rounded-lg"
      >
        <AccordionItem value="reports">
          <AccordionTrigger>Reports</AccordionTrigger>
          <AccordionContent>
            <ul className="text-b1 flex flex-col gap-1">
              <li>Monthly</li>
              <li>Quarterly</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="admin">
          <AccordionTrigger>Administration</AccordionTrigger>
          <AccordionContent>
            <ul className="text-b1 flex flex-col gap-1">
              <li>Users</li>
              <li>Roles</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    title: 'Arabic (RTL)',
    render: () => (
      <div dir="rtl" className="w-full max-w-md">
        <Accordion defaultValue={['a']}>
          <AccordionItem value="a">
            <AccordionTrigger>الشحن</AccordionTrigger>
            <AccordionContent>يتم شحن الطلبات خلال يومي عمل.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>الإرجاع</AccordionTrigger>
            <AccordionContent>يمكن إرجاع المنتجات خلال ثلاثين يوماً.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
];
