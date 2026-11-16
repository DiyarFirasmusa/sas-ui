import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUES,
  GOVERNORATES,
  createSchema,
  demoSubmit,
  messages,
  serverPayload,
} from '@/components/blocks/form-page-01-model';

const schema = createSchema(messages.en);
const valid = {
  ...EMPTY_VALUES,
  fullName: 'Layla Hassan',
  nationalId: '123456789012',
  email: 'layla@example.com',
  phone: '+964 770 123 4567',
  governorate: 'baghdad',
  addressLine: 'Karrada',
  birthDate: '1992-04-12',
  startDate: '2025-01-01',
};

function messagesOf(values: unknown): string[] {
  const result = schema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('form-page-01 model', () => {
  it('accepts a complete record and an open-ended contract', () => {
    expect(messagesOf(valid)).toEqual([]);
  });

  it('accepts phone spacing variants but only +964 mobile numbers', () => {
    expect(messagesOf({ ...valid, phone: '+9647701234567' })).toEqual([]);
    expect(messagesOf({ ...valid, phone: '+964 170 123 4567' })).toEqual([
      messages.en.phoneInvalid,
    ]);
    expect(messagesOf({ ...valid, phone: '07701234567' })).toEqual([messages.en.phoneInvalid]);
  });

  it('rejects an end date before the start date, on the end date', () => {
    const result = schema.safeParse({ ...valid, endDate: '2024-12-31' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['endDate']);
    expect(result.error?.issues[0]?.message).toBe(messages.en.endBeforeStart);
    expect(messagesOf({ ...valid, endDate: '2025-01-01' })).toEqual([]);
  });

  it('limits notes and requires a 12-digit national ID', () => {
    expect(messagesOf({ ...valid, notes: 'x'.repeat(501) })).toEqual([messages.en.notesTooLong]);
    expect(messagesOf({ ...valid, nationalId: '12345' })).toEqual([messages.en.idInvalid]);
  });

  it('has the same keys and options in both languages', () => {
    expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort());
    expect(GOVERNORATES.ar.map((option) => option.value)).toEqual(
      GOVERNORATES.en.map((option) => option.value),
    );
  });

  it('turns a rejection into the payload applyServerErrors reads', () => {
    expect(serverPayload(new Error('Boom'))).toBe('Boom');
    expect(serverPayload({ errors: [] })).toEqual({ errors: [] });
  });

  it('the demo server rejects only the known email, in the UI language', async () => {
    await expect(demoSubmit(valid, 'en')).resolves.toBeUndefined();
    await expect(demoSubmit({ ...valid, email: 'Taken@Example.com' }, 'ar')).rejects.toEqual({
      errors: { email: ['هذا البريد الإلكتروني مسجّل لموظف آخر.'] },
    });
  });
});
