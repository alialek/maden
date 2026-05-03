import type { CSSProperties } from 'react';

type TableCellApi<TElement> = {
  table: {
    getColSpan: (element: TElement) => number;
    getRowSpan: (element: TElement) => number;
  };
};

export const getTableCellStyle = (
  element: { background?: unknown },
  width: unknown
): CSSProperties & Record<'--cellBackground', unknown> => ({
    '--cellBackground': element.background,
    maxWidth: width ? (width as CSSProperties['maxWidth']) : '100%',
    minWidth: width ? (width as CSSProperties['minWidth']) : 'max-content',
  });

export const getTableCellAttributes = <TAttributes extends object>(
  attributes: TAttributes,
  element: Parameters<TableCellApi<any>['table']['getColSpan']>[0],
  api: TableCellApi<typeof element>
) => ({
  ...attributes,
  colSpan: api.table.getColSpan(element),
  rowSpan: api.table.getRowSpan(element),
});
