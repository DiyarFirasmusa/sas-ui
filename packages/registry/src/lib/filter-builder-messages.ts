import type { FilterOperator } from '@/lib/filter-builder';
import type { FilterRuleError } from '@/lib/filter-builder-validate';
import type { Messages } from '@/lib/locale';

export type FilterBuilderLabelKey =
  | 'title'
  | 'group'
  | 'rule'
  | 'combinator'
  | 'and'
  | 'or'
  | 'addRule'
  | 'addGroup'
  | 'removeRule'
  | 'removeGroup'
  | 'field'
  | 'operator'
  | 'value'
  | 'from'
  | 'to'
  | 'days'
  | 'choose'
  | 'chooseField'
  | 'empty'
  | 'apply'
  | 'reset'
  | 'invalidSummary'
  | `operator_${FilterOperator}`
  | `error_${FilterRuleError}`;

/** Labels of the advanced filter editor. `{n}` in `invalidSummary` is the number of rules to fix. */
export const filterBuilderMessages: Messages<FilterBuilderLabelKey> = {
  en: {
    title: 'Advanced filters',
    group: 'Group',
    rule: 'Rule',
    combinator: 'Match rules with',
    and: 'And',
    or: 'Or',
    addRule: 'Add rule',
    addGroup: 'Add group',
    removeRule: 'Remove rule',
    removeGroup: 'Remove group',
    field: 'Field',
    operator: 'Condition',
    value: 'Value',
    from: 'From',
    to: 'To',
    days: 'days',
    choose: 'Choose…',
    chooseField: 'Choose a field',
    empty: 'No conditions yet. Add a rule to narrow the results.',
    apply: 'Apply',
    reset: 'Reset',
    invalidSummary: 'Rules needing attention: {n}. Complete or correct them before applying.',
    operator_contains: 'contains',
    operator_not_contains: 'does not contain',
    operator_equals: 'equals',
    operator_starts_with: 'starts with',
    operator_is_empty: 'is empty',
    operator_eq: 'equals',
    operator_neq: 'does not equal',
    operator_gt: 'is greater than',
    operator_gte: 'is at least',
    operator_lt: 'is less than',
    operator_lte: 'is at most',
    operator_between: 'is between',
    operator_on: 'is on',
    operator_before: 'is before',
    operator_after: 'is after',
    operator_in_last: 'is within the last',
    operator_is: 'is',
    operator_is_not: 'is not',
    operator_is_any_of: 'is any of',
    operator_is_true: 'is true',
    operator_is_false: 'is false',
    error_unknown_field: 'This field is no longer available',
    error_invalid_operator: 'Choose a condition that fits this field',
    error_required: 'Enter a value',
    error_invalid_number: 'Enter a valid number',
    error_invalid_date: 'Enter a valid date',
    error_invalid_range: 'The start must not be after the end',
    error_invalid_days: 'Enter a whole number of days',
    error_invalid_option: 'Choose from the available options',
  },
  ar: {
    title: 'تصفية متقدمة',
    group: 'مجموعة',
    rule: 'شرط',
    combinator: 'ربط الشروط بـ',
    and: 'و',
    or: 'أو',
    addRule: 'إضافة شرط',
    addGroup: 'إضافة مجموعة',
    removeRule: 'حذف الشرط',
    removeGroup: 'حذف المجموعة',
    field: 'الحقل',
    operator: 'الحالة',
    value: 'القيمة',
    from: 'من',
    to: 'إلى',
    days: 'يوماً',
    choose: 'اختر…',
    chooseField: 'اختر حقلاً',
    empty: 'لا توجد شروط بعد. أضف شرطاً لتضييق النتائج.',
    apply: 'تطبيق',
    reset: 'إعادة ضبط',
    invalidSummary: 'عدد الشروط التي تحتاج إلى مراجعة: {n}. أكملها أو صحّحها قبل التطبيق.',
    operator_contains: 'يحتوي على',
    operator_not_contains: 'لا يحتوي على',
    operator_equals: 'يساوي',
    operator_starts_with: 'يبدأ بـ',
    operator_is_empty: 'فارغ',
    operator_eq: 'يساوي',
    operator_neq: 'لا يساوي',
    operator_gt: 'أكبر من',
    operator_gte: 'أكبر من أو يساوي',
    operator_lt: 'أصغر من',
    operator_lte: 'أصغر من أو يساوي',
    operator_between: 'بين',
    operator_on: 'في تاريخ',
    operator_before: 'قبل',
    operator_after: 'بعد',
    operator_in_last: 'خلال آخر',
    operator_is: 'هو',
    operator_is_not: 'ليس',
    operator_is_any_of: 'أحد',
    operator_is_true: 'نعم',
    operator_is_false: 'لا',
    error_unknown_field: 'هذا الحقل لم يعد متاحاً',
    error_invalid_operator: 'اختر حالة تناسب هذا الحقل',
    error_required: 'أدخل قيمة',
    error_invalid_number: 'أدخل رقماً صحيحاً',
    error_invalid_date: 'أدخل تاريخاً صحيحاً',
    error_invalid_range: 'يجب ألا تكون البداية بعد النهاية',
    error_invalid_days: 'أدخل عدداً صحيحاً من الأيام',
    error_invalid_option: 'اختر من الخيارات المتاحة',
  },
};

/** The label of an operator, for the condition select. */
export function operatorLabel(
  labels: Record<FilterBuilderLabelKey, string>,
  operator: FilterOperator,
): string {
  const key: FilterBuilderLabelKey = `operator_${operator}`;
  return labels[key];
}

/** The message for a validation problem. */
export function errorLabel(
  labels: Record<FilterBuilderLabelKey, string>,
  error: FilterRuleError,
): string {
  const key: FilterBuilderLabelKey = `error_${error}`;
  return labels[key];
}
