import { describe, expect, it, vi } from 'vitest';
import { applyServerErrors, type ServerFieldError } from '@/lib/form-errors';

type Call = [string, ServerFieldError, { shouldFocus: boolean } | undefined];

function recorder() {
  const calls: Call[] = [];
  const setError = vi.fn(
    (name: string, error: ServerFieldError, options?: { shouldFocus: boolean }) => {
      calls.push([name, error, options]);
    },
  );
  const messages = () => Object.fromEntries(calls.map(([name, error]) => [name, error.message]));
  return { setError, calls, messages };
}

describe('applyServerErrors: field maps', () => {
  it('maps a list of messages per field', () => {
    const { setError, messages } = recorder();
    const result = applyServerErrors(setError, { email: ['Already taken'], name: ['Required'] });
    expect(messages()).toEqual({ email: 'Already taken', name: 'Required' });
    expect(result).toEqual({ formMessage: null, fields: ['email', 'name'] });
  });

  it('accepts a plain string per field', () => {
    const { setError, messages } = recorder();
    applyServerErrors(setError, { email: 'Already taken' });
    expect(messages()).toEqual({ email: 'Already taken' });
  });

  it('joins several messages for one field', () => {
    const { setError, messages } = recorder();
    applyServerErrors(setError, { password: ['Too short.', 'Needs a digit.', 'Too short.'] });
    expect(messages()).toEqual({ password: 'Too short. Needs a digit.' });
  });

  it('flattens nested objects and lists to dotted paths', () => {
    const { setError, messages } = recorder();
    applyServerErrors(setError, {
      address: { city: ['Unknown city'] },
      items: [{ name: ['Required'] }, {}, { qty: ['Must be positive'] }],
    });
    expect(messages()).toEqual({
      'address.city': 'Unknown city',
      'items.0.name': 'Required',
      'items.2.qty': 'Must be positive',
    });
  });

  it('keeps Arabic messages intact', () => {
    const { setError, messages } = recorder();
    applyServerErrors(setError, { email: ['هذا البريد مستخدم بالفعل'] });
    expect(messages()).toEqual({ email: 'هذا البريد مستخدم بالفعل' });
  });

  it('ignores empty and non-text values', () => {
    const { setError, calls } = recorder();
    const result = applyServerErrors(setError, { email: [], age: 12, ok: null, name: '  ' });
    expect(calls).toEqual([]);
    expect(result).toEqual({ formMessage: null, fields: [] });
  });
});

describe('applyServerErrors: errors list', () => {
  it('maps { errors: [{ field, message }] }', () => {
    const { setError, messages } = recorder();
    const result = applyServerErrors(setError, {
      errors: [
        { field: 'email', message: 'Already taken' },
        { field: 'name', message: 'Required' },
        { field: 'name', message: 'Too short' },
      ],
    });
    expect(messages()).toEqual({ email: 'Already taken', name: 'Required Too short' });
    expect(result.fields).toEqual(['email', 'name']);
  });

  it('understands path arrays, messages arrays and other text keys', () => {
    const { setError, messages } = recorder();
    applyServerErrors(setError, {
      errors: [
        { path: ['address', 'city'], msg: 'Unknown' },
        { name: 'phone', messages: ['Bad format', 'Too long'] },
      ],
    });
    expect(messages()).toEqual({ 'address.city': 'Unknown', phone: 'Bad format Too long' });
  });

  it('treats entries without a field as form-level', () => {
    const { setError, messages } = recorder();
    const result = applyServerErrors(setError, {
      errors: [{ message: 'Account locked' }, 'Try later', { field: 'email', message: 'Taken' }],
    });
    expect(result.formMessage).toBe('Account locked Try later');
    expect(messages()).toEqual({ email: 'Taken', 'root.server': 'Account locked Try later' });
  });

  it('maps a Laravel-style envelope and still returns its message', () => {
    const { setError, messages } = recorder();
    const result = applyServerErrors(setError, {
      message: 'The given data was invalid.',
      errors: { email: ['Taken'] },
    });
    expect(messages()).toEqual({
      email: 'Taken',
      'root.server': 'The given data was invalid.',
    });
    expect(result).toEqual({ formMessage: 'The given data was invalid.', fields: ['email'] });
  });

  it('accepts a bare array of errors', () => {
    const { setError, messages } = recorder();
    applyServerErrors(setError, [{ field: 'email', message: 'Taken' }]);
    expect(messages()).toEqual({ email: 'Taken' });
  });
});

describe('applyServerErrors: form-level messages', () => {
  it.each([
    [{ message: 'Server exploded' }, 'Server exploded'],
    [{ detail: 'Not allowed' }, 'Not allowed'],
    [{ error: 'Bad request' }, 'Bad request'],
    [{ error: { code: 'E1', message: 'Quota exceeded' } }, 'Quota exceeded'],
    [{ non_field_errors: ['Passwords differ'] }, 'Passwords differ'],
    [{ nonFieldErrors: 'Passwords differ' }, 'Passwords differ'],
    [{ __all__: ['Duplicate record'] }, 'Duplicate record'],
    ['Something failed', 'Something failed'],
  ])('reads %j as a form message', (payload, expected) => {
    const { setError, calls } = recorder();
    const result = applyServerErrors(setError, payload);
    expect(result).toEqual({ formMessage: expected, fields: [] });
    expect(calls).toEqual([['root.server', { type: 'server', message: expected }, undefined]]);
  });

  it('skips response metadata such as status codes', () => {
    const { setError, messages } = recorder();
    const result = applyServerErrors(setError, { status: 'error', statusCode: 422, email: ['Taken'] });
    expect(messages()).toEqual({ email: 'Taken' });
    expect(result.formMessage).toBeNull();
  });

  it('treats an array under message as a field error', () => {
    const { setError, messages } = recorder();
    applyServerErrors(setError, { message: ['Too long'] });
    expect(messages()).toEqual({ message: 'Too long' });
  });

  it('treats a declared field named like a message key as a field', () => {
    const { setError, messages } = recorder();
    const result = applyServerErrors(setError, { message: 'Too long' }, { fieldNames: ['message'] });
    expect(messages()).toEqual({ message: 'Too long' });
    expect(result.formMessage).toBeNull();
  });

  it('uses the fallback only when nothing else was reported', () => {
    const a = recorder();
    expect(applyServerErrors(a.setError, null, { fallbackMessage: 'Try again' })).toEqual({
      formMessage: 'Try again',
      fields: [],
    });
    expect(a.calls).toHaveLength(1);

    const b = recorder();
    const withField = applyServerErrors(b.setError, { email: ['Taken'] }, { fallbackMessage: 'Try again' });
    expect(withField.formMessage).toBeNull();

    const c = recorder();
    expect(applyServerErrors(c.setError, {})).toEqual({ formMessage: null, fields: [] });
    expect(c.calls).toEqual([]);
  });

  it.each([undefined, 42, true, []])('does not fail on the payload %j', (payload) => {
    const { setError, calls } = recorder();
    expect(applyServerErrors(setError, payload)).toEqual({ formMessage: null, fields: [] });
    expect(calls).toEqual([]);
  });
});

describe('applyServerErrors: options', () => {
  it('moves entries for unknown fields into the form message', () => {
    const { setError, messages } = recorder();
    const result = applyServerErrors(
      setError,
      { email: ['Taken'], coupon: ['Expired'] },
      { fieldNames: ['email', 'name'] },
    );
    expect(messages()).toEqual({ email: 'Taken', 'root.server': 'Expired' });
    expect(result).toEqual({ formMessage: 'Expired', fields: ['email'] });
  });

  it('renames backend fields', () => {
    const { setError, messages } = recorder();
    applyServerErrors(
      setError,
      { email_address: ['Taken'] },
      { fieldMap: { email_address: 'email' }, fieldNames: ['email'] },
    );
    expect(messages()).toEqual({ email: 'Taken' });
  });

  it('focuses only the first field, unless focus is off', () => {
    const on = recorder();
    applyServerErrors(on.setError, { a: ['x'], b: ['y'] });
    expect(on.calls.map(([, , options]) => options)).toEqual([{ shouldFocus: true }, { shouldFocus: false }]);

    const off = recorder();
    applyServerErrors(off.setError, { a: ['x'] }, { focus: false });
    expect(off.calls[0]?.[2]).toEqual({ shouldFocus: false });
  });

  it('uses the given error type', () => {
    const { setError, calls } = recorder();
    applyServerErrors(setError, { a: ['x'], message: 'y' }, { type: 'api' });
    expect(calls.map(([, error]) => error.type)).toEqual(['api', 'api']);
  });

  it('sets the form message after the fields', () => {
    const { setError, calls } = recorder();
    applyServerErrors(setError, { message: 'Failed', email: ['Taken'] });
    expect(calls.map(([name]) => name)).toEqual(['email', 'root.server']);
  });
});
