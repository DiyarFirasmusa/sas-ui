/** What react-hook-form's `setError` stores for one field. */
export interface ServerFieldError {
  type: string;
  message: string;
}

/**
 * The part of react-hook-form's `setError` this module needs, so it works
 * with `form.setError` directly and stays free of the library at runtime.
 */
export type SetServerError<TName extends string> = (
  name: TName | 'root.server',
  error: ServerFieldError,
  options?: { shouldFocus: boolean },
) => void;

export interface ApplyServerErrorsOptions<TName extends string> {
  /**
   * The form's field names. Entries for any other name are not set on a field;
   * their messages join the form-level message instead. Without this list
   * every name in the payload is passed to `setError` as it is.
   */
  fieldNames?: readonly TName[];
  /** Renames backend fields to form fields, e.g. `{ email_address: 'email' }`. */
  fieldMap?: Readonly<Record<string, TName>>;
  /** Form-level message used when the payload yielded no message at all. */
  fallbackMessage?: string;
  /** Focus the first field that received an error. Default true. */
  focus?: boolean;
  /** The `type` stored on each error. Default `'server'`. */
  type?: string;
}

export interface ApplyServerErrorsResult {
  /** Message that belongs to the whole form, or `null`. Also stored at `root.server`. */
  formMessage: string | null;
  /** The field names an error was set on, in payload order. */
  fields: string[];
}

/** Keys whose string value is a message about the whole request. */
const MESSAGE_KEYS = new Set(['message', 'detail', 'error']);
/** Keys that always hold form-level messages (Django REST, Laravel-style forms). */
const FORM_KEYS = new Set(['non_field_errors', 'nonFieldErrors', '__all__', '_form', '_errors']);
/** Response metadata that is not an error message when it is a plain string or number. */
const METADATA_KEYS = new Set([
  'status',
  'statusCode',
  'code',
  'success',
  'type',
  'title',
  'instance',
  'traceId',
  'timestamp',
]);
const FIELD_KEYS = ['field', 'path', 'name', 'param'];
const TEXT_KEYS = ['message', 'msg', 'error', 'detail'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function joinPath(parent: string, key: string | number): string {
  return parent === '' ? String(key) : `${parent}.${key}`;
}

interface Collected {
  fields: Map<string, string[]>;
  form: string[];
}

function addMessage(collected: Collected, path: string, message: string): void {
  const text = message.trim();
  if (text === '') {
    return;
  }
  if (path === '') {
    collected.form.push(text);
    return;
  }
  const existing = collected.fields.get(path);
  if (existing) {
    existing.push(text);
  } else {
    collected.fields.set(path, [text]);
  }
}

/**
 * Walks a field-error value: a string, a list of strings, or nested objects
 * and lists (Django REST nested serializers: `{ items: [{ name: ['Required'] }] }`
 * becomes the path `items.0.name`).
 */
function collect(collected: Collected, path: string, value: unknown): void {
  if (typeof value === 'string') {
    addMessage(collected, path, value);
  } else if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collect(collected, typeof entry === 'string' ? path : joinPath(path, index), entry);
    });
  } else if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      collect(collected, joinPath(path, key), nested);
    }
  }
}

function pathOf(item: Record<string, unknown>): string {
  for (const key of FIELD_KEYS) {
    const candidate = item[key];
    if (typeof candidate === 'string') {
      return candidate;
    }
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.map(String).join('.');
    }
  }
  return '';
}

/** One `{ field, message }` entry of an `errors` list. */
function collectItem(collected: Collected, item: unknown): void {
  if (typeof item === 'string') {
    addMessage(collected, '', item);
    return;
  }
  if (!isRecord(item)) {
    return;
  }
  const path = pathOf(item);
  const messages = item.messages;
  if (Array.isArray(messages)) {
    collect(collected, path, messages);
  }
  for (const key of TEXT_KEYS) {
    const text = item[key];
    if (typeof text === 'string') {
      addMessage(collected, path, text);
      return;
    }
  }
}

function collectList(collected: Collected, list: unknown): void {
  if (Array.isArray(list)) {
    list.forEach((item) => collectItem(collected, item));
  } else if (isRecord(list)) {
    // Laravel: `{ message, errors: { email: ['Taken'] } }`.
    collect(collected, '', list);
  } else if (typeof list === 'string') {
    addMessage(collected, '', list);
  }
}

function collectPayload(payload: unknown, declared: ReadonlySet<string>): Collected {
  const collected: Collected = { fields: new Map(), form: [] };
  if (typeof payload === 'string') {
    addMessage(collected, '', payload);
    return collected;
  }
  if (Array.isArray(payload)) {
    collectList(collected, payload);
    return collected;
  }
  if (!isRecord(payload)) {
    return collected;
  }

  const { errors, ...rest } = payload;
  if (errors !== undefined) {
    collectList(collected, errors);
  }
  for (const [key, value] of Object.entries(rest)) {
    if (FORM_KEYS.has(key)) {
      collect(collected, '', value);
      continue;
    }
    if (!declared.has(key)) {
      const plain = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
      if (MESSAGE_KEYS.has(key) && typeof value === 'string') {
        addMessage(collected, '', value);
        continue;
      }
      if (MESSAGE_KEYS.has(key) && isRecord(value) && typeof value.message === 'string') {
        // `{ error: { code, message } }`
        addMessage(collected, '', value.message);
        continue;
      }
      if (METADATA_KEYS.has(key) && plain) {
        continue;
      }
    }
    collect(collected, key, value);
  }
  return collected;
}

function unique(messages: readonly string[]): string[] {
  return [...new Set(messages)];
}

/**
 * Puts a backend validation response onto react-hook-form fields. Understands:
 * - `{ email: ['Taken'], name: 'Required' }` (field to string or list of strings,
 *   including nested objects and `a.b` dotted names)
 * - `{ errors: [{ field: 'email', message: 'Taken' }] }` and
 *   `{ errors: { email: ['Taken'] } }`
 * - form-level text: `{ message }`, `{ detail }`, `{ error }`, `non_field_errors`,
 *   and `errors` entries without a field
 *
 * Several messages for one field are joined with a space. The form-level text
 * is returned and also stored at `root.server` (react-hook-form clears it on
 * the next submit). Nothing is invented: with no message in the payload and no
 * `fallbackMessage`, `formMessage` is `null`.
 */
export function applyServerErrors<TName extends string>(
  setError: SetServerError<TName>,
  payload: unknown,
  options: ApplyServerErrorsOptions<TName> = {},
): ApplyServerErrorsResult {
  const { fieldNames, fieldMap = {}, fallbackMessage, focus = true, type = 'server' } = options;
  const known = fieldNames ? new Set<string>(fieldNames) : null;
  const declared = new Set<string>([...(fieldNames ?? []), ...Object.keys(fieldMap)]);

  // Without `fieldNames` any name is passed through; react-hook-form accepts
  // names it does not know, so the predicate only has to separate the two cases.
  function isFieldName(name: string): name is TName {
    return known === null || known.has(name);
  }

  const collected = collectPayload(payload, declared);
  const form = [...collected.form];
  const applied: string[] = [];

  for (const [path, messages] of collected.fields) {
    const name = fieldMap[path] ?? path;
    if (!isFieldName(name)) {
      form.push(...messages);
      continue;
    }
    setError(name, { type, message: unique(messages).join(' ') }, { shouldFocus: focus && applied.length === 0 });
    applied.push(name);
  }

  const text = unique(form).join(' ');
  const formMessage = text !== '' ? text : applied.length === 0 && fallbackMessage ? fallbackMessage : null;
  if (formMessage !== null) {
    setError('root.server', { type, message: formMessage });
  }
  return { formMessage, fields: applied };
}
