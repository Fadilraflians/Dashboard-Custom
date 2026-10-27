"use client";

import type {
  FieldFilterConfig,
  FilterConfig,
  SlicedPageConfig,
  TableCellValue,
} from "./portalTypes";
import type { ComponentProps } from "react";
import { useState } from "react";
import Icon from "../PusatInformasi/Icon";
import styles from "./SlicedDataPage.module.css";

function Link(props: ComponentProps<"a">) {
  return <a {...props} />;
}

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className={styles.breadcrumb}>
      <Icon name="home" size={15} />
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={index === items.length - 1 ? styles.activeCrumb : ""}>
          {index > 0 && <span className={styles.slash}>/</span>}
          {item}
        </span>
      ))}
    </div>
  );
}

function FilterPanel({ config }: { config: SlicedPageConfig }) {
  const filters: FieldFilterConfig[] =
    config.filters ||
    [
      { label: "Tahun", placeholder: "2026", type: "select" },
      { label: "Tanggal", placeholder: "26 Jan 2026 - 28 Sep 2026", type: "date" },
      { label: "Provinsi", placeholder: "Jawa Barat", type: "select" },
      { label: "Kab/Kota", placeholder: "Kota Depok", type: "select" },
      { label: "Puskesmas", placeholder: "Puskesmas Cipayung", type: "select" },
    ];
  const rows: FilterConfig[][] = config.filterRows || [
    filters.map((filter) => ({ ...filter, span: 4 })),
  ];
  const actionsInline = rows.some((row) => row.some((item) => item.kind === "actions"));
  const filterActions = config.filterActions || [
    { label: "Reset", icon: "refresh", variant: "secondary" as const },
    { label: "Terapkan", icon: "check", variant: "primary" as const },
  ];

  function renderFilterActions() {
    return filterActions.map((action) => (
      <button
        key={action.label}
        className={action.variant === "primary" ? styles.primaryBtn : styles.secondaryBtn}
      >
        <Icon name={action.icon} size={16} /> {action.label}
      </button>
    ));
  }

  return (
    <section className={styles.filterPanel}>
      <div className={styles.panelTitleRow}>
        <h2>
          <Icon name="filter" size={18} /> {config.filterTitle || "Filter Data"}
        </h2>
        {config.filterHeaderAction && (
          <button className={styles.headerAction} type="button">
            <Icon name="refresh" size={14} /> {config.filterHeaderAction}
          </button>
        )}
      </div>
      <div className={styles.filterStack}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.filterGrid}>
            {row.map((filter) => {
              const span = filter.span || 4;
              if (filter.kind === "actions") {
                return (
                  <div
                    key={`actions-${rowIndex}`}
                    className={`${styles.filterActions} ${styles.inlineActions}`}
                    style={{ gridColumn: `span ${span}` }}
                  >
                    {renderFilterActions()}
                  </div>
                );
              }
              return (
                <label
                  key={filter.label}
                  className={styles.field}
                  style={{ gridColumn: `span ${span}` }}
                >
                  <span>{filter.label}</span>
                  {filter.type === "select" ? (
                    <select defaultValue="">
                      <option value="">{filter.placeholder}</option>
                    </select>
                  ) : (
                    <input
                      readOnly={filter.type === "date"}
                      value={filter.type === "date" ? filter.placeholder : undefined}
                      placeholder={filter.placeholder}
                    />
                  )}
                </label>
              );
            })}
          </div>
        ))}
      </div>
      {!actionsInline && (
        <div className={styles.filterActions}>
          {renderFilterActions()}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ value }: { value: TableCellValue }) {
  const lower = String(value).toLowerCase();
  const tone = lower.includes("error") || lower.includes("wrong") || lower.includes("tidak sesuai")
    ? styles.danger
    : lower.includes("anomali") || lower.includes("review") || lower.includes("perlu")
    ? styles.warning
    : lower.includes("proses") || lower.includes("process")
    ? styles.info
    : styles.success;

  return (
    <span className={`${styles.status} ${tone}`}>
      <span /> {value}
    </span>
  );
}

function renderCell(value: TableCellValue, index: number, config: SlicedPageConfig) {
  const columnName = config.columns[index]?.toLowerCase() || "";
  const isStatus = columnName.includes("status");
  const isMasterRole = config.title === "Master Role";
  const isMasterTooltip = config.title === "Master Tooltip";
  const isMasterPuskesmas = config.title === "Master Puskesmas";

  if (isMasterRole && columnName.includes("nama role")) {
    const initials = String(value)
      .split(/[\s/]+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <span className={styles.roleNameCell}>
        <span className={styles.roleInitial}>{initials}</span>
        <strong>{value}</strong>
      </span>
    );
  }

  if (isMasterRole && columnName.includes("jumlah user")) {
    return (
      <span className={styles.userCountPill}>
        <Icon name="settings" size={13} /> {value}
      </span>
    );
  }

  if (isMasterRole && columnName.includes("keterangan")) {
    return <span className={styles.descriptionCell}>{value}</span>;
  }

  if (isMasterTooltip && columnName.includes("keterangan")) {
    return <span className={styles.descriptionCell}>{value}</span>;
  }

  if (isMasterPuskesmas && columnName.includes("location")) {
    return (
      <span className={styles.locationCell}>
        <Icon name="pin" size={13} /> {value}
      </span>
    );
  }

  if (isMasterPuskesmas && columnName.includes("nama puskesmas")) {
    return <strong className={styles.puskesmasName}>{value}</strong>;
  }

  if (isStatus && config.type !== "master") return <StatusBadge value={value} />;
  if (String(value).startsWith("Rp")) return <span className={styles.money}>{value}</span>;
  if (index === 2 && config.type === "master") return <span className={styles.codePill}>{value}</span>;
  if (String(value).match(/^(Aktif|Normal|Berhasil|Realisasi|Proses|Review|Anomali|Perlu Review)$/)) {
    return <StatusBadge value={value} />;
  }
  return value;
}

function DataTable({ config }: { config: SlicedPageConfig }) {
  const [rows, setRows] = useState<TableCellValue[][]>(config.rows || []);
  const [deleteNotice, setDeleteNotice] = useState("");
  const hasActions = config.columns.includes("Action");
  const displayColumns = config.columns
    .map((column, index) => ({ column, index }))
    .sort((left, right) => {
      if (left.column === "Action") return 1;
      if (right.column === "Action") return -1;
      return 0;
    });
  const tableActions = config.tableActions || [
    { label: "Export Excel", icon: "download" },
  ];

  function renderTableAction(action: (typeof tableActions)[number]) {
    const className = action.variant === "primary" ? styles.primaryBtn : styles.exportBtn;
    const content = (
      <>
        <Icon name={action.icon} size={16} /> {action.label}
      </>
    );

    return action.href ? (
      <Link key={action.label} href={action.href} className={className}>
        {content}
      </Link>
    ) : (
      <button key={action.label} className={className} type="button">
        {content}
      </button>
    );
  }

  function buildActionHref(baseHref?: string, row?: TableCellValue[]) {
    if (!baseHref) return "";
    const id = row?.[0];
    return id ? `${baseHref}?id=${encodeURIComponent(String(id))}` : baseHref;
  }

  function handleDelete(rowIndex: number) {
    const confirmed = window.confirm(
      config.deleteConfirmMessage || "Apakah Anda yakin ingin menghapus data ini?",
    );
    if (!confirmed) return;
    setRows((current) => current.filter((_, index) => index !== rowIndex));
    setDeleteNotice(config.deleteSuccessMessage || "Data berhasil dihapus.");
  }

  function renderActionCell(row: TableCellValue[], rowIndex: number) {
    return (
      <td key="Action">
        <div className={styles.actions}>
          {config.type === "upload" ? (
            <button className={styles.viewBtn} aria-label="Download">
              <Icon name="download" size={15} />
            </button>
          ) : (
            <>
              {config.editHref ? (
                <Link
                  href={buildActionHref(config.editHref, row)}
                  className={styles.editBtn}
                  aria-label="Edit"
                >
                  <Icon name="edit" size={15} />
                </Link>
              ) : (
                <button className={styles.editBtn} aria-label="Edit">
                  <Icon name="edit" size={15} />
                </button>
              )}
              {config.viewHref ? (
                <Link
                  href={buildActionHref(config.viewHref, row)}
                  className={styles.viewBtn}
                  aria-label="Detail"
                >
                  <Icon name="eye" size={15} />
                </Link>
              ) : (
                <button className={styles.viewBtn} aria-label="Detail">
                  <Icon name="eye" size={15} />
                </button>
              )}
            </>
          )}
          <button
            className={styles.deleteBtn}
            type="button"
            aria-label="Hapus"
            onClick={() => handleDelete(rowIndex)}
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </td>
    );
  }

  return (
    <section className={styles.tablePanel}>
      <div className={styles.tableHeader}>
        <div>
          <h2>{config.tableTitle}</h2>
          <p>{config.tableMeta || "Menampilkan 1-10 dari 38 data"}</p>
        </div>
        {hasActions ? (
          config.tableActions ? (
            <div className={styles.tableActions}>
              {tableActions.map((action) => renderTableAction(action))}
            </div>
          ) : (
            config.createHref ? (
              <Link href={config.createHref} className={styles.primaryBtn}>
                <Icon name="plus" size={17} /> {config.addLabel || "Tambah Data"}
              </Link>
            ) : (
            <button className={styles.primaryBtn} type="button">
              <Icon name="plus" size={17} /> {config.addLabel || "Tambah Data"}
            </button>
            )
          )
        ) : (
          <div className={styles.tableActions}>
            {tableActions.map((action) => renderTableAction(action))}
          </div>
        )}
      </div>
      {config.detailFields && (
        <div className={styles.detailGrid}>
          {config.detailFields.map((field) => (
            <div key={field.label} className={styles.detailItem}>
              <span>{field.label}</span>
              <strong>{field.value || "-"}</strong>
            </div>
          ))}
        </div>
      )}
      {config.tableNote && (
        <div className={styles.tableNote}>
          <Icon name="info" size={16} /> {config.tableNote}
        </div>
      )}
      {deleteNotice && (
        <div className={styles.deleteNotice}>
          <Icon name="check" size={16} /> {deleteNotice}
        </div>
      )}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {displayColumns.map(({ column }) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={`${config.title}-${rowIndex}`}>
                  {displayColumns.map(({ column, index }) => {
                    if (column === "Action") {
                      return renderActionCell(row, rowIndex);
                    }
                    return <td key={`${column}-${index}`}>{renderCell(row[index], index, config)}</td>;
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={displayColumns.length} className={styles.emptyCell}>
                  {config.emptyMessage || "Data tidak ditemukan"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <span>Menampilkan <strong>1-10</strong> dari <strong>38</strong> data</span>
        <div>
          <button>Sebelumnya</button>
          <button className={styles.currentPage}>1</button>
          <button>2</button>
          <button>3</button>
          <button>4</button>
          <button>Selanjutnya</button>
        </div>
      </div>
    </section>
  );
}

export default function SlicedDataPage({ config }: { config: SlicedPageConfig }) {
  const isMasterRole = config.title === "Master Role";
  const hasHeaderActions = Boolean(config.headerActions?.length);

  return (
    <div className={styles.page}>
      <Breadcrumb items={config.breadcrumb || ["Home", config.title]} />
      <header className={`${styles.header} ${isMasterRole || hasHeaderActions ? styles.headerWithSummary : ""}`}>
        <div>
          <h1>
            {config.title}
            <span>TA 2026 Aktif</span>
          </h1>
          <p>{config.description}</p>
        </div>
        {isMasterRole && (
          <div className={styles.roleSummaryCard}>
            <span>
              <Icon name="settings" size={20} />
            </span>
            <div>
              <small>Total Definisi Role</small>
              <strong>6 Peran</strong>
            </div>
          </div>
        )}
        {hasHeaderActions && (
          <div className={styles.headerActions}>
            {config.headerActions?.map((action) => (
              <button
                key={action.label}
                className={action.variant === "primary" ? styles.primaryBtn : styles.exportBtn}
                type="button"
              >
                <Icon name={action.icon} size={15} /> {action.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <FilterPanel config={config} />
      {!config.hideTable && <DataTable key={config.title} config={config} />}
    </div>
  );
}
