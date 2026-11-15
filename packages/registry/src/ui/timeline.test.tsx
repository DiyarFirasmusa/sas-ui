import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckIcon } from '@/components/ui/icons';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example() {
  return (
    <Timeline aria-label="History">
      <TimelineItem
        title="Submitted"
        time="Mon 9:00"
        dateTime="2026-01-05T09:00"
        description="By Layla"
      />
      <TimelineItem title="Approved" tone="success" icon={<CheckIcon />} statusLabel="Done" />
      <TimelineItem title="Paid" tone="primary" />
    </Timeline>
  );
}

describe('Timeline', () => {
  it('is an ordered list of events', () => {
    render(<Example />);
    const list = screen.getByRole('list', { name: 'History' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders title, description and a machine-readable time', () => {
    render(<Example />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('By Layla')).toBeInTheDocument();
    expect(screen.getByText('Mon 9:00')).toHaveAttribute('datetime', '2026-01-05T09:00');
  });

  it('colours the marker by tone and speaks the status', () => {
    const { container } = render(<Example />);
    const markers = container.querySelectorAll('[data-slot="timeline-marker"]');
    expect(markers[1]).toHaveClass('bg-tag-green-container', 'text-tag-green');
    expect(markers[0]).toHaveClass('bg-surface-dim');
    expect(screen.getByText('Approved').textContent).toBe('Done: Approved');
  });

  it('hides the connector after the last event', () => {
    const { container } = render(<Example />);
    const items = container.querySelectorAll('[data-slot="timeline-item"]');
    const connector = (item: Element) => item.querySelector('.bg-stroke');
    expect(connector(items[2] as Element)).toHaveClass('group-last/item:hidden');
  });

  it('shows the empty content when there are no events', () => {
    render(<Timeline empty={<p>No activity yet</p>}>{[]}</Timeline>);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lays the rail out with flexbox so it mirrors in RTL', () => {
    const { container } = renderWithLocale(
      <Timeline>
        <TimelineItem title="تم الإرسال" time="٩:٠٠" />
      </Timeline>,
      { locale: 'ar' },
    );
    expect(container.querySelector('[data-slot="timeline-item"]')).toHaveClass('flex');
    expect(screen.getByText('تم الإرسال')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    await expectNoA11yViolations(container);
  });
});
