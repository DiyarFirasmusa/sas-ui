import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUES,
  FIELD_NAMES,
  GOVERNORATES,
  LANGUAGES,
  ORG_TYPES,
  PLANS,
  STEP_FIELDS,
  createSchema,
  firstStepWith,
  labelOf,
  messages,
  serverPayload,
} from '@/components/blocks/wizard-01-model';

const schema = createSchema(messages.en);
const valid = {
  ...EMPTY_VALUES,
  fullName: 'Layla Hassan',
  email: 'layla@example.com',
  phone: '+964 770 123 4567',
  orgName: 'Tigris',
  orgType: 'ngo',
  governorate: 'erbil',
  terms: true,
};

describe('wizard-01 model', () => {
  it('accepts a complete set of answers', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('requires the terms, with the localized message', () => {
    const result = schema.safeParse({ ...valid, terms: false });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([messages.en.termsRequired]);
  });

  it('gives every schema field to exactly one step', () => {
    expect([...FIELD_NAMES].sort()).toEqual(Object.keys(EMPTY_VALUES).sort());
    expect(new Set(FIELD_NAMES).size).toBe(FIELD_NAMES.length);
    expect(STEP_FIELDS).toHaveLength(4);
  });

  it('finds the first step owning any of the fields', () => {
    expect(firstStepWith(['phone'])).toBe(0);
    expect(firstStepWith(['terms', 'orgName'])).toBe(1);
    expect(firstStepWith(['unknown'])).toBe(-1);
  });

  it('labels stored values and falls back to the raw value', () => {
    expect(labelOf(ORG_TYPES.ar, 'public')).toBe('جهة حكومية');
    expect(labelOf(ORG_TYPES.en, 'other')).toBe('other');
  });

  it('has the same keys and option values in both languages', () => {
    expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort());
    for (const options of [ORG_TYPES, PLANS, LANGUAGES, GOVERNORATES]) {
      expect(options.ar.map((option) => option.value)).toEqual(
        options.en.map((option) => option.value),
      );
    }
  });

  it('reads a rejection as the payload applyServerErrors expects', () => {
    expect(serverPayload(new Error('Boom'))).toBe('Boom');
    expect(serverPayload({ errors: {} })).toEqual({ errors: {} });
  });
});
