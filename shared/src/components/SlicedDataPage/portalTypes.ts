export type FieldFilterConfig = {
  kind?: string;
  label: string;
  placeholder: string;
  type: string;
  span?: number;
};

export type FilterConfig = {
  kind?: string;
  label?: string;
  placeholder?: string;
  type?: string;
  span?: number;
};

export type TableCellValue = string | number;

export type DetailField = {
  label: string;
  value: string;
};

export type TableAction = {
  label: string;
  icon: string;
  variant?: "primary" | "secondary";
  href?: string;
};

export type SlicedPageConfig = {
  title: string;
  breadcrumb?: string[];
  description?: string;
  headerActions?: TableAction[];
  filterTitle?: string;
  filterHeaderAction?: string;
  filterActions?: TableAction[];
  filters?: FieldFilterConfig[];
  filterRows?: FilterConfig[][];
  tableTitle: string;
  tableMeta?: string;
  tableNote?: string;
  emptyMessage?: string;
  tableActions?: TableAction[];
  detailFields?: DetailField[];
  addLabel?: string;
  createHref?: string;
  editHref?: string;
  viewHref?: string;
  deleteConfirmMessage?: string;
  deleteSuccessMessage?: string;
  columns: string[];
  rows?: TableCellValue[][];
  type?: string;
  hideTable?: boolean;
};
