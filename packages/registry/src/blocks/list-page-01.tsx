import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_QUERY,
  LICENCE_STATUSES,
  LICENCE_TYPES,
  queryLicences,
  sampleLicences,
  type Licence,
  type LicenceStatus,
  type ListPage01Query,
} from '@/components/blocks/list-page-01-data';
import { messages, statusLabelKey, typeLabelKey } from '@/components/blocks/list-page-01-messages';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataBadge, type DataBadgeStatus } from '@/components/ui/data-badge';
import { DataTable, type DataTableState } from '@/components/ui/data-table';
import { actionsColumn, type RowAction } from '@/components/ui/data-table-row-actions';
import { FilterBar } from '@/components/ui/filter-bar';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  PlusIcon,
} from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { formatDate, parseISODate } from '@/lib/date-utils';
import { countActiveFilters, type FilterDefinition } from '@/lib/filter-state';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

const STATUS_TONES: Record<LicenceStatus, DataBadgeStatus['tone']> = {
  active: 'green',
  pending: 'yellow',
  suspended: 'orange',
  expired: 'red',
};

/** One KPI tile above the table. */
interface ListPage01Stat {
  id: string;
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

type ListPage01Labels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface ListPage01Props extends Omit<React.ComponentProps<'div'>, 'children' | 'onSuspend'> {
  /**
   * The current page exactly as the server returned it. Leave it out to
   * browse the built-in sample set, filtered, sorted and paged in the browser.
   */
  rows?: Licence[];
  /** Server total across all pages; defaults to `rows.length`. */
  total?: number;
  status?: 'loading' | 'error' | 'success';
  /** A later page, sort or filter is loading: the old rows stay under a progress bar. */
  refetching?: boolean;
  errorMessage?: ReactNode;
  onRetry?: () => void;
  /** Controlled filters, search, page, size and sort. Mirror it to the URL with `queryToSearchParams`. */
  query?: ListPage01Query;
  defaultQuery?: ListPage01Query;
  onQueryChange?: (query: ListPage01Query) => void;
  /** Each action shows only when its handler is given. */
  onCreate?: () => void;
  onView?: (licence: Licence) => void;
  onRenew?: (licence: Licence) => void;
  onExport?: (licences: Licence[]) => void;
  /** Runs after the user confirms; a rejection keeps the dialog open with the error. */
  onSuspend?: (licences: Licence[]) => void | Promise<void>;
  /**
   * KPI tiles under the header. Leave it out to show counts of the built-in
   * sample set (and none for server rows); pass `[]` to hide them.
   */
  stats?: readonly ListPage01Stat[];
  labels?: ListPage01Labels;
}

/**
 * Resource list page in the dashboards' layout: header with a primary action,
 * a row of KPI tiles, and one panel holding search and filters with chips over
 * a server-driven table with sorting, paging, row selection and a
 * bulk bar. Rows become cards below the sm breakpoint. State is a plain
 * `query` object, controlled or kept inside.
 */
function ListPage01({
  rows,
  total,
  status = 'success',
  refetching = false,
  errorMessage,
  onRetry,
  query: queryProp,
  defaultQuery = DEFAULT_QUERY,
  onQueryChange,
  onCreate,
  onView,
  onRenew,
  onExport,
  onSuspend,
  stats: statsProp,
  labels: overrides,
  className,
  ...props
}: ListPage01Props) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const [innerQuery, setInnerQuery] = useState(defaultQuery);
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [suspending, setSuspending] = useState<Licence[] | null>(null);
  const query = queryProp ?? innerQuery;

  function updateQuery(next: ListPage01Query) {
    if (queryProp === undefined) {
      setInnerQuery(next);
    }
    onQueryChange?.(next);
  }

  const filters = useMemo<FilterDefinition[]>(
    () => [
      {
        key: 'status',
        type: 'multi-select',
        label: labels.status,
        options: LICENCE_STATUSES.map((value) => ({
          value,
          label: labels[statusLabelKey(value)],
        })),
      },
      {
        key: 'type',
        type: 'select',
        label: labels.type,
        options: LICENCE_TYPES.map((value) => ({
          value,
          label: labels[typeLabelKey(value)],
        })),
      },
      { key: 'expires', type: 'date-range', label: labels.expires },
    ],
    [labels],
  );

  const statusMap = useMemo<Record<string, DataBadgeStatus>>(
    () =>
      Object.fromEntries(
        LICENCE_STATUSES.map((value) => [
          value,
          { tone: STATUS_TONES[value], label: labels[statusLabelKey(value)] },
        ]),
      ),
    [labels],
  );

  const local = rows === undefined ? queryLicences(sampleLicences, query, locale) : null;
  const pageRows = rows ?? local?.rows ?? [];
  const totalRows = total ?? local?.total ?? pageRows.length;
  const filtered = countActiveFilters(filters, query.filters) > 0 || hasSearch(query);

  const stats = useMemo<readonly ListPage01Stat[]>(() => {
    if (statsProp !== undefined) {
      return statsProp;
    }
    if (rows !== undefined) {
      return [];
    }
    const count = (value: LicenceStatus) =>
      sampleLicences.filter((licence) => licence.status === value).length;
    return [
      {
        id: 'total',
        label: labels.statTotal,
        value: formatCount(sampleLicences.length),
        icon: <FileIcon />,
        tone: 'primary',
      },
      {
        id: 'active',
        label: labels.statusActive,
        value: formatCount(count('active')),
        icon: <CheckCircleIcon />,
        tone: 'success',
      },
      {
        id: 'pending',
        label: labels.statusPending,
        value: formatCount(count('pending')),
        icon: <ClockIcon />,
        tone: 'warning',
      },
      {
        id: 'expired',
        label: labels.statusExpired,
        value: formatCount(count('expired')),
        icon: <AlertTriangleIcon />,
        tone: 'danger',
      },
    ];
  }, [labels, rows, statsProp]);

  const columns = useMemo<ColumnDef<Licence>[]>(() => {
    const date = (value: string) => {
      const parsed = parseISODate(value);
      return parsed ? formatDate(parsed, { locale, dateStyle: 'medium' }) : value;
    };
    function rowActions(licence: Licence): RowAction[] {
      const actions: RowAction[] = [];
      if (onView) {
        actions.push({
          id: 'view',
          label: labels.view,
          icon: <EyeIcon />,
          onSelect: () => onView(licence),
        });
      }
      if (onRenew && licence.status !== 'pending') {
        actions.push({
          id: 'renew',
          label: labels.renew,
          icon: <ClockIcon />,
          onSelect: () => onRenew(licence),
        });
      }
      if (onSuspend && licence.status === 'active') {
        actions.push({
          id: 'suspend',
          label: labels.suspend,
          destructive: true,
          onSelect: () => setSuspending([licence]),
        });
      }
      return actions;
    }
    return [
      {
        accessorKey: 'reference',
        header: labels.reference,
        cell: ({ row }) =>
          onView ? (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              dir="ltr"
              onClick={() => onView(row.original)}
            >
              {row.original.reference}
            </Button>
          ) : (
            <span dir="ltr">{row.original.reference}</span>
          ),
      },
      {
        id: 'holder',
        accessorFn: (licence) => licence.holder[locale],
        header: labels.holder,
        meta: { cardRole: 'title' },
        cell: ({ row }) => <span dir="auto">{row.original.holder[locale]}</span>,
      },
      {
        accessorKey: 'type',
        header: labels.type,
        enableSorting: false,
        cell: ({ row }) => labels[typeLabelKey(row.original.type)],
      },
      {
        accessorKey: 'status',
        header: labels.status,
        enableSorting: false,
        cell: ({ row }) => <DataBadge value={row.original.status} statusMap={statusMap} />,
      },
      {
        accessorKey: 'expiresAt',
        header: labels.expires,
        cell: ({ row }) => date(row.original.expiresAt),
      },
      {
        accessorKey: 'fee',
        header: labels.fee,
        meta: { numeric: true, label: `${labels.fee} (${labels.feeUnit})` },
        cell: ({ row }) => (
          <span className="tabular-nums" dir="ltr">
            {formatCount(row.original.fee)} {labels.feeUnit}
          </span>
        ),
      },
      actionsColumn<Licence>(rowActions, {
        getLabel: (licence) => fillTemplate(labels.actionsFor, { reference: licence.reference }),
      }),
    ];
  }, [labels, locale, onRenew, onSuspend, onView, statusMap]);

  const state: DataTableState =
    status === 'loading'
      ? { status: 'loading' }
      : status === 'error'
        ? { status: 'error', message: errorMessage ?? labels.loadError, onRetry }
        : { status: 'success', refetching };

  return (
    <div className={cn('bg-background p-4 md:p-page min-h-svh', className)} {...props}>
      <div className="gap-card flex w-full flex-col">
        <PageHeader
          title={labels.title}
          subtitle={labels.description}
          actions={
            onCreate ? (
              <Button onClick={onCreate}>
                <PlusIcon />
                {labels.create}
              </Button>
            ) : null
          }
        />
        {stats.length > 0 ? (
          <section aria-label={labels.summary}>
            <StatGrid>
              {stats.map((stat) => (
                <StatCard
                  key={stat.id}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  tone={stat.tone}
                />
              ))}
            </StatGrid>
          </section>
        ) : null}
        <DataTable
          toolbar={
            <FilterBar
              filters={filters}
              value={query.filters}
              searchPlaceholder={labels.searchPlaceholder}
              onChange={(next) => {
                setSelection({});
                updateQuery({ ...query, filters: next, page: 1 });
              }}
            />
          }
          caption={labels.caption}
          columns={columns}
          data={pageRows}
          getRowId={(licence) => licence.id}
          getRowLabel={(licence) => licence.reference}
          state={state}
          mobile="cards"
          selectable
          rowSelection={selection}
          onRowSelectionChange={setSelection}
          sorting={query.sorting}
          onSortingChange={(sorting) => updateQuery({ ...query, sorting, page: 1 })}
          pagination={{
            page: query.page,
            pageSize: query.pageSize,
            total: totalRows,
            onPageChange: (page) => updateQuery({ ...query, page }),
            onPageSizeChange: (pageSize) => updateQuery({ ...query, pageSize, page: 1 }),
          }}
          empty={
            filtered
              ? {
                  title: labels.noResultsTitle,
                  description: labels.noResultsDescription,
                }
              : {
                  title: labels.emptyTitle,
                  description: labels.emptyDescription,
                  action: onCreate ? <Button onClick={onCreate}>{labels.create}</Button> : null,
                }
          }
          bulkActions={(selected) => (
            <>
              {onExport ? (
                <Button size="sm" variant="outline" onClick={() => onExport(selected)}>
                  <DownloadIcon />
                  {labels.exportSelected}
                </Button>
              ) : null}
              {onSuspend ? (
                <Button
                  size="sm"
                  variant="destructive-soft"
                  onClick={() => setSuspending(selected)}
                >
                  {labels.suspendSelected}
                </Button>
              ) : null}
            </>
          )}
        />
      </div>
      <ConfirmDialog
        open={suspending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSuspending(null);
          }
        }}
        destructive
        title={labels.confirmTitle}
        description={fillTemplate(labels.confirmDescription, {
          count: formatCount(suspending?.length ?? 0),
        })}
        confirmLabel={labels.confirmAction}
        onConfirm={async () => {
          await onSuspend?.(suspending ?? []);
          setSelection({});
        }}
      />
    </div>
  );
}

function hasSearch(query: ListPage01Query): boolean {
  const text = query.filters.q;
  return typeof text === 'string' && text.trim() !== '';
}

export { ListPage01 };
export type { ListPage01Labels, ListPage01Props, ListPage01Stat };
