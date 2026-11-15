import type { Messages } from '@/lib/locale';

export type FileUploadLabelKey =
  | 'dropMultiple'
  | 'dropSingle'
  | 'dropActive'
  | 'hintMaxSize'
  | 'hintMaxFiles'
  | 'filesList'
  | 'rejectedList'
  | 'remove'
  | 'dismiss'
  | 'uploading'
  | 'done'
  | 'failed'
  | 'progress'
  | 'errorInvalidType'
  | 'errorTooLarge'
  | 'errorTooSmall'
  | 'errorTooMany'
  | 'errorDuplicate';

export const fileUploadMessages: Messages<FileUploadLabelKey> = {
  en: {
    dropMultiple: 'Drop files here, or click to browse',
    dropSingle: 'Drop a file here, or click to browse',
    dropActive: 'Release to add',
    hintMaxSize: 'Up to {size} per file',
    hintMaxFiles: 'Up to {count} files',
    filesList: 'Selected files',
    rejectedList: 'Files that were not added',
    remove: 'Remove {name}',
    dismiss: 'Dismiss {name}',
    uploading: 'Uploading',
    done: 'Uploaded',
    failed: 'Upload failed',
    progress: 'Upload progress for {name}',
    errorInvalidType: 'This file type is not allowed',
    errorTooLarge: 'The file is larger than {size}',
    errorTooSmall: 'The file is smaller than {size}',
    errorTooMany: 'No more files can be added (limit {count})',
    errorDuplicate: 'This file was already added',
  },
  ar: {
    dropMultiple: 'أفلت الملفات هنا، أو انقر للاستعراض',
    dropSingle: 'أفلت الملف هنا، أو انقر للاستعراض',
    dropActive: 'أفلت لإضافة الملفات',
    hintMaxSize: 'حتى {size} لكل ملف',
    hintMaxFiles: 'حتى {count} ملفات',
    filesList: 'الملفات المختارة',
    rejectedList: 'الملفات التي لم تُضف',
    remove: 'إزالة {name}',
    dismiss: 'إخفاء {name}',
    uploading: 'جارٍ الرفع',
    done: 'تم الرفع',
    failed: 'فشل الرفع',
    progress: 'تقدم رفع {name}',
    errorInvalidType: 'نوع هذا الملف غير مسموح',
    errorTooLarge: 'حجم الملف أكبر من {size}',
    errorTooSmall: 'حجم الملف أصغر من {size}',
    errorTooMany: 'لا يمكن إضافة المزيد من الملفات (الحد {count})',
    errorDuplicate: 'تمت إضافة هذا الملف مسبقاً',
  },
};
