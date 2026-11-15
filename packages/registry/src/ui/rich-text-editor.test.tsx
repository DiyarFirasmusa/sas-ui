import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { RichTextEditor, type RichTextEditorProps } from '@/components/ui/rich-text-editor';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Harness({
  initial = '',
  onChange,
  ...props
}: { initial?: string; onChange?: (html: string) => void } & Omit<RichTextEditorProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <RichTextEditor
        aria-label="Letter body"
        {...props}
        value={value}
        onChange={(html) => {
          setValue(html);
          onChange?.(html);
        }}
      />
      <button type="button" onClick={() => setValue('<p>Suggested text</p>')}>
        replace
      </button>
      <output data-testid="value">{value}</output>
    </>
  );
}

describe('RichTextEditor', () => {
  beforeAll(() => {
    // jsdom has no layout: ProseMirror hit-tests clicks and measures ranges.
    document.elementFromPoint = () => null;
    document.createRange = () => {
      const range = new Range();
      range.getBoundingClientRect = () => new DOMRect();
      range.getClientRects = () => {
        const rects = { item: () => null, length: 0, [Symbol.iterator]: [][Symbol.iterator] };
        return rects;
      };
      return range;
    };
  });

  it('renders a named multiline textbox and the formatting toolbar', async () => {
    render(<Harness initial="<p>Hello</p>" />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    expect(body).toHaveTextContent('Hello');
    expect(body).toHaveAttribute('aria-multiline', 'true');
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
    for (const name of [
      'Bold',
      'Italic',
      'Underline',
      'Heading',
      'Bulleted list',
      'Numbered list',
      'Align to start',
      'Center',
      'Align to end',
      'Link',
      'Undo',
      'Redo',
    ]) {
      expect(within(toolbar).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('applies formatting from the toolbar and reports it as HTML', async () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>Hello</p>" onChange={onChange} />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    await userEvent.click(body);
    await userEvent.keyboard('{Control>}a{/Control}');
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(bold);
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('<strong>Hello</strong>'));
    });
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles block formats: heading, lists and alignment with logical values', async () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>Hello</p>" onChange={onChange} />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    await userEvent.click(body);
    await userEvent.keyboard('{Control>}a{/Control}');

    await userEvent.click(screen.getByRole('button', { name: 'Align to end' }));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('text-align: end'));
    });
    await userEvent.click(screen.getByRole('button', { name: 'Align to end' }));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(expect.not.stringContaining('text-align'));
    });

    await userEvent.click(screen.getByRole('button', { name: 'Bulleted list' }));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('<ul>'));
    });
    await userEvent.click(screen.getByRole('button', { name: 'Bulleted list' }));

    await userEvent.click(screen.getByRole('button', { name: 'Heading' }));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('<h2>'));
    });
  });

  it('shows the list tool as pressed while the caret is inside a list', async () => {
    render(<Harness initial="<ul><li><p>Item</p></li></ul>" />);
    const item = (await screen.findByRole('textbox', { name: 'Letter body' })).querySelector('li p');
    expect(item).not.toBeNull();
    if (item) {
      await userEvent.click(item);
    }
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Bulleted list' })).toHaveAttribute('aria-pressed', 'true');
    });
    expect(screen.getByRole('button', { name: 'Numbered list' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('undoes and redoes', async () => {
    render(<Harness initial="<p>Hello</p>" />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(body);
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }));
    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('<em>Hello</em>');
    });
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => {
      expect(screen.getByTestId('value')).not.toHaveTextContent('<em>');
    });
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('<em>Hello</em>');
    });
  });

  it('moves between toolbar buttons with the arrow keys', async () => {
    render(<Harness initial="<p>Hello</p>" />);
    await screen.findByRole('textbox', { name: 'Letter body' });
    screen.getByRole('button', { name: 'Bold' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('adds and removes a link through the inline link bar', async () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>Hello</p>" onChange={onChange} />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    await userEvent.click(body);
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.click(screen.getByRole('button', { name: 'Link' }));

    const address = screen.getByRole('textbox', { name: 'Link address' });
    await userEvent.type(address, 'javascript:alert(1)');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid web, email or phone link');
    expect(address).toBeInvalid();

    await userEvent.clear(address);
    await userEvent.type(address, 'example.com');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('href="https://example.com"'));
    });
    expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Link' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove link' }));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(expect.not.stringContaining('<a '));
    });
  });

  it('cancels the link bar with Escape', async () => {
    render(<Harness initial="<p>Hello</p>" />);
    await screen.findByRole('textbox', { name: 'Letter body' });
    await userEvent.click(screen.getByRole('button', { name: 'Link' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();
  });

  it('replaces the document when the value changes from outside', async () => {
    render(<Harness />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    await userEvent.click(screen.getByRole('button', { name: 'replace' }));
    await waitFor(() => {
      expect(body).toHaveTextContent('Suggested text');
    });
  });

  it('reports an emptied document as an empty string', async () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>x</p>" onChange={onChange} />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    await userEvent.click(body);
    await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith('');
    });
  });

  it('works uncontrolled with defaultValue', async () => {
    render(<RichTextEditor aria-label="Notes" defaultValue="<p>Draft</p>" />);
    expect(await screen.findByRole('textbox', { name: 'Notes' })).toHaveTextContent('Draft');
  });

  it('is read-only: no toolbar and not editable', async () => {
    render(<Harness initial="<p>Locked</p>" readOnly />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    expect(body).toHaveAttribute('contenteditable', 'false');
    expect(body).toHaveAttribute('aria-readonly', 'true');
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('is not editable when disabled', async () => {
    render(<Harness initial="<p>Locked</p>" disabled />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    expect(body).toHaveAttribute('contenteditable', 'false');
    expect(body).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks the textbox invalid', async () => {
    render(<Harness invalid />);
    expect(await screen.findByRole('textbox', { name: 'Letter body' })).toBeInvalid();
  });

  it('shows a placeholder while empty and hides it once there is content', async () => {
    render(<Harness placeholder="Write the letter…" />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    expect(screen.getByText('Write the letter…')).toBeInTheDocument();
    expect(body).toHaveAttribute('aria-placeholder', 'Write the letter…');
    await userEvent.click(screen.getByRole('button', { name: 'replace' }));
    await waitFor(() => {
      expect(screen.queryByText('Write the letter…')).not.toBeInTheDocument();
    });
  });

  it('shows a character count, with a limit', async () => {
    render(<Harness initial="<p>مرحبا</p>" showCount maxLength={4} />);
    const body = await screen.findByRole('textbox', { name: 'Letter body' });
    const count = screen.getByText('5 / 4');
    expect(count.parentElement).toHaveAttribute('data-over-limit');
    expect(body).toHaveAccessibleDescription('5 / 4 characters');
  });

  it('limits the toolbar to the requested tools', async () => {
    render(<Harness tools={['bold', 'undo']} />);
    await screen.findByRole('textbox', { name: 'Letter body' });
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Italic' })).not.toBeInTheDocument();
  });

  it('submits through a hidden input in a plain form', async () => {
    const { container } = render(
      <form>
        <RichTextEditor aria-label="Body" name="body" defaultValue="<p>Hi</p>" />
      </form>,
    );
    await screen.findByRole('textbox', { name: 'Body' });
    await waitFor(() => {
      expect(container.querySelector<HTMLInputElement>('input[name=body]')?.value).toBe('<p>Hi</p>');
    });
  });

  it('takes its name, description and invalid state from an enclosing Field', async () => {
    render(
      <Field label="Letter" description="Keep it short" error="Required">
        <RichTextEditor />
      </Field>,
    );
    const body = await screen.findByRole('textbox', { name: 'Letter' });
    expect(body).toBeInvalid();
    expect(body).toHaveAccessibleDescription('Keep it short Required');
  });

  it('uses Arabic labels and the UI direction while empty', async () => {
    renderWithLocale(<RichTextEditor />, { locale: 'ar' });
    const body = await screen.findByRole('textbox', { name: 'محرر النص المنسق' });
    expect(screen.getByRole('toolbar', { name: 'التنسيق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'غامق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'محاذاة إلى البداية' })).toBeInTheDocument();
    expect(body.parentElement).toHaveAttribute('dir', 'rtl');
  });

  it('lets typed content decide its direction', async () => {
    renderWithLocale(<RichTextEditor defaultValue="<p>مرحبا</p>" aria-label="x" />, { locale: 'en' });
    const body = await screen.findByRole('textbox', { name: 'x' });
    expect(body.parentElement).toHaveAttribute('dir', 'auto');
  });

  it('orders the toolbar buttons start to end in both directions', async () => {
    renderWithLocale(<RichTextEditor aria-label="x" />, { locale: 'ar' });
    await screen.findByRole('textbox', { name: 'x' });
    const buttons = within(screen.getByRole('toolbar')).getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName('غامق');
    expect(buttons.at(-1)).toHaveAccessibleName('إعادة');
  });

  it('has no axe violations', async () => {
    render(<Harness initial="<p>Hello</p>" showCount />);
    await screen.findByRole('textbox', { name: 'Letter body' });
    await expectNoA11yViolations();
  });

  it('has no axe violations inside a Field with the link bar open', async () => {
    render(
      <Field label="Letter" description="Hint" error="Required">
        <RichTextEditor />
      </Field>,
    );
    await screen.findByRole('textbox', { name: 'Letter' });
    await userEvent.click(screen.getByRole('button', { name: 'Link' }));
    await expectNoA11yViolations();
  });
});
