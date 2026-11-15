import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Label',
    render: () => (
      <div className="gap-field grid">
        <Label htmlFor="label-demo" required>
          Company name
        </Label>
        <Input id="label-demo" />
      </div>
    ),
  },
];
