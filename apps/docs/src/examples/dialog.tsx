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
  {
    title: 'Sizes',
    description:
      'size is opt-in: sm 420, md 640, lg 900, xl 1100 px (always capped to the viewport).',
    render: () => (
      <>
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Dialog key={size}>
            <DialogTrigger render={<Button variant="outline" />}>{`Size ${size}`}</DialogTrigger>
            <DialogContent size={size} closeLabel="Dismiss">
              <DialogHeader>
                <DialogTitle>{`Size ${size}`}</DialogTitle>
                <DialogDescription>Width follows the size step.</DialogDescription>
              </DialogHeader>
              <DialogBody>Content</DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </>
    ),
  },
  {
    title: 'Without a close button',
    description:
      'reserveClose={false} gives the header its full width when showCloseButton is off.',
    render: () => (
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>No corner button</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader reserveClose={false}>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Choose one of the actions below.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button />}>Done</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  },
];
