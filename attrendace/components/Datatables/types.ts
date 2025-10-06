export interface ColumnDef<TData> {
  accessor: keyof TData;
  header: string;
  cellRenderer?: (item: TData) => React.ReactNode;
}