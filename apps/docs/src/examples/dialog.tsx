import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Form dialog',
    render: () => (
      <Dialog>
        <DialogTrigger render={<Button />}>Invite a colleague</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a colleague</DialogTitle>
            <DialogDescription>They will receive an email with a sign-in link.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Email">
              <Input type="email" placeholder="name@company.com" />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  },
];
