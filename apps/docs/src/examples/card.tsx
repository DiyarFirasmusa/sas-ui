import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Default',
    render: () => (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Invoice 1042</CardTitle>
          <CardDescription>Issued on 12 March</CardDescription>
          <CardAction>
            <Button size="sm" variant="outline">Edit</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-b1 text-text-secondary">Consulting services for the second quarter.</p>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="ghost">Dismiss</Button>
          <Button>Pay now</Button>
        </CardFooter>
      </Card>
    ),
  },
  {
    title: 'Arabic',
    render: () => (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>الفاتورة 1042</CardTitle>
          <CardDescription>صدرت في 12 مارس</CardDescription>
          <CardAction>
            <Button size="sm" variant="outline">تعديل</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-b1 text-text-secondary">خدمات استشارية للربع الثاني.</p>
        </CardContent>
      </Card>
    ),
  },
];
