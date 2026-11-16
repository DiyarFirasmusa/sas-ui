import { Button } from '@/components/ui/button';
import { notify, Toaster } from '@/components/ui/toast';
import type { Example } from '../example-types';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const examples: Example[] = [
  {
    title: 'Notify helpers',
    description:
      'Mount <Toaster /> once at the app root; call notify anywhere. The docs app already mounts one.',
    render: () => (
      <div className="gap-field flex flex-wrap">
        <Toaster />
        <Button variant="outline" onClick={() => notify.success('Saved')}>
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            notify.error('Could not save', {
              description: 'Check your connection.',
            })
          }
        >
          Error
        </Button>
        <Button variant="outline" onClick={() => notify.warning('Quota almost used')}>
          Warning
        </Button>
        <Button variant="outline" onClick={() => notify.info('New version available')}>
          Info
        </Button>
      </div>
    ),
  },
  {
    title: 'Promise',
    description:
      'Loading, then success or error; the promise is returned so callers can still await it.',
    render: () => (
      <div className="gap-field flex flex-wrap">
        <Toaster />
        <Button
          onClick={() => {
            void notify.promise(wait(1200), {
              loading: 'Saving…',
              success: 'Saved',
              error: 'Could not save',
            });
          }}
        >
          Save
        </Button>
        <Button
          variant="destructive-soft"
          onClick={() => {
            const failing = wait(1200).then(() => Promise.reject(new Error('Server unavailable')));
            failing.catch(() => {});
            void notify.promise(failing, {
              loading: 'Saving…',
              success: 'Saved',
              error: (error) => (error instanceof Error ? error.message : 'Could not save'),
            });
          }}
        >
          Save (fails)
        </Button>
      </div>
    ),
  },
  {
    title: 'Placement',
    description:
      'The default bottom-end corner mirrors in RTL: bottom-left under the Arabic locale.',
    render: () => (
      <div className="gap-field flex flex-wrap">
        <Toaster position="top-center" />
        <Button variant="outline" onClick={() => notify.info('Top centre')}>
          Top centre
        </Button>
      </div>
    ),
  },
  {
    title: 'Physical corner',
    description:
      'A physical position such as bottom-right stays on that corner in both directions, unlike the logical end/start values.',
    render: () => (
      <div className="gap-field flex flex-wrap">
        <Toaster position="bottom-right" />
        <Button variant="outline" onClick={() => notify.info('Always bottom right')}>
          Bottom right
        </Button>
      </div>
    ),
  },
];
