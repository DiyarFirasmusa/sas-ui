import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RowActions, actionsColumn, type RowAction } from '@/components/ui/data-table-row-actions';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function actions(overrides: Partial<Record<string, Partial<RowAction>>> = {}): RowAction[] {
  return [
    {
      id: 'delete',
      label: 'Delete',
      destructive: true,
      onSelect: () => {},
      ...overrides.delete,
    },
    { id: 'edit', label: 'Edit', onSelect: () => {}, ...overrides.edit },
    { id: 'copy', label: 'Duplicate', onSelect: () => {}, ...overrides.copy },
  ];
}

describe('RowActions', () => {
  it('opens a menu named for the row and runs the chosen action', async () => {
    const onEdit = vi.fn();
    render(
      <RowActions label="Actions for Ali" actions={actions({ edit: { onSelect: onEdit } })} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Ali' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('lists destructive actions last, after a separator', async () => {
    render(<RowActions actions={actions()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const items = (await screen.findAllByRole('menuitem')).map((item) => item.textContent);
    expect(items).toEqual(['Edit', 'Duplicate', 'Delete']);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('marks disabled actions', async () => {
    const onEdit = vi.fn();
    render(<RowActions actions={actions({ edit: { disabled: true, onSelect: onEdit } })} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const edit = await screen.findByRole('menuitem', { name: 'Edit' });
    expect(edit).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(edit);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('renders nothing without actions', () => {
    const { container } = render(<RowActions actions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens from the keyboard and closes with Escape', async () => {
    render(<RowActions actions={actions()} />);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
  });

  it('is named in Arabic by default', () => {
    renderWithLocale(<RowActions actions={actions()} />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: 'الإجراءات' })).toBeInTheDocument();
  });

  it('has no axe violations closed and open', async () => {
    const { container } = render(<RowActions actions={actions()} />);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await screen.findByRole('menu');
    await expectNoA11yViolations();
  });
});

describe('actionsColumn', () => {
  interface Person {
    name: string;
  }

  it('builds an unsortable, unhideable end-aligned column', () => {
    const column = actionsColumn<Person>(() => actions());
    expect(column.id).toBe('actions');
    expect(column.enableSorting).toBe(false);
    expect(column.enableHiding).toBe(false);
    expect(column.meta).toMatchObject({ align: 'end', cardRole: 'actions' });
  });

  it('pins to the end when asked', () => {
    expect(actionsColumn<Person>(() => [], { sticky: true }).meta).toMatchObject({ sticky: 'end' });
  });
});

describe('RowActions look', () => {
  it('draws the borderless 32px "…" trigger that tints while open', () => {
    renderWithLocale(<RowActions actions={actions()} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveClass('size-control-sm', 'rounded-control', 'border-transparent');
    expect(trigger.className).toContain('data-[popup-open]:bg-hover-row');
  });
});
