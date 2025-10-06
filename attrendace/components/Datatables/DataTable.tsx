/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useRef, useEffect, ReactNode } from "react";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Column {
  header: string;
  accessor: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  pdfExport?: boolean;
  visible?: boolean;
  type?: "string" | "number" | "date" | "currency";
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  pageSize?: number;
  pageSizeOptions?: number[];
  searchable?: boolean;
  pagination?: boolean;
  exportable?: boolean;
  className?: string;
  compact?: boolean;
  title?: string;
  dateFilterField?: string;
  // New props for server-side filtering
  onDateRangeChange?: (start: Date | null, end: Date | null) => Promise<any[]> | void;
  onFilterChange?: (filters: any) => Promise<any[]> | void;
  isLoading?: boolean;
  totalCount?: number;
  // Custom filter from parent
  customFilter?: ReactNode;
  showDefaultFilters?: boolean;
}

export default function DataTable({
  data,
  columns,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  searchable = true,
  pagination = true,
  exportable = true,
  className = "",
  compact = false,
  title = "Data Export",
  // dateFilterField = "createdAt",
  onDateRangeChange,
  onFilterChange,
  isLoading = false,
  totalCount,
  customFilter = null,
  showDefaultFilters = true,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {}
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  // Initialize visible columns
  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    columns.forEach((col) => {
      initialVisibility[col.accessor] = col.visible !== false;
    });
    setVisibleColumns(initialVisibility);
  }, [columns]);

  // Handle date filter changes
  const handleDateRangeChange = async (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
    
    if (onDateRangeChange) {
      // If onDateRangeChange is provided, it should handle the API call
      await onDateRangeChange(start, end);
    }
  };

  // Filter data based on search term (client-side if no onFilterChange provided)
  const filteredData = useMemo(() => {
    if (!onFilterChange && !searchTerm) return data;
    
    if (!onFilterChange) {
      // Client-side search if no server-side filtering provided
      return data.filter((row) =>
        columns.some((column) => {
          const value = row[column.accessor];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
    
    return data;
  }, [data, searchTerm, columns, onFilterChange]);

  // Sort data (client-side)
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Get visible columns
  const visibleColumnsList = useMemo(() => {
    return columns.filter((col) => visibleColumns[col.accessor]);
  }, [columns, visibleColumns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil((totalCount || filteredData.length) / pageSize);

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    
    // If onFilterChange is provided, call it with search term
    if (onFilterChange) {
      onFilterChange({ search: e.target.value, startDate, endDate });
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const toggleColumnVisibility = (accessor: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [accessor]: !prev[accessor],
    }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add date range if filtered
    if (startDate || endDate) {
      doc.setFontSize(10);
      const dateRangeText = `Date Range: ${startDate ? startDate.toLocaleDateString() : "Any"} - ${endDate ? endDate.toLocaleDateString() : "Any"}`;
      doc.text(dateRangeText, 14, 25);
    }

    // Prepare data for export
    const exportColumns = visibleColumnsList.filter((col) => col.pdfExport !== false);
    const headers = exportColumns.map((col) => col.header);
    const data = sortedData.map((row) =>
      exportColumns.map((col) => {
        const value = row[col.accessor];
        return col.render ? String(col.render(value, row)) : String(value);
      })
    );

    // Add table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: startDate || endDate ? 30 : 20,
      styles: {
        fontSize: compact ? 8 : 10,
        cellPadding: compact ? 2 : 4,
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    doc.save(
      `${title.replace(/ /g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  const exportToCSV = () => {
    const exportColumns = visibleColumnsList.filter((col) => col.pdfExport !== false);
    const headers = exportColumns.map((col) => col.header);
    const rows = sortedData.map((row) =>
      exportColumns.map((col) => {
        const value = row[col.accessor];
        const formattedValue = col.render ? String(col.render(value, row)) : String(value);
        // Escape quotes and wrap in quotes if contains comma
        return formattedValue.includes(",") ? `"${formattedValue.replace(/"/g, '""')}"` : formattedValue;
      })
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/ /g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compact styling classes
  const tableClass = compact ? "text-xs" : "text-sm";
  const cellPadding = compact ? "px-3 py-2" : "px-6 py-4";
  const headerPadding = compact ? "px-3 py-2" : "px-6 py-3";

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Table Controls */}
      <div className="p-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow">
          {/* Custom Filter from Parent */}
          {customFilter && (
            <div className="flex-grow">
              {customFilter}
            </div>
          )}
          
          {/* Default Filters (optional) */}
          {showDefaultFilters && (
            <>
              {searchable && (
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon
                      className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-gray-400`}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      compact ? "text-xs" : "text-sm"
                    }`}
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              )}

              {/* Date Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                    compact ? "text-xs" : "text-sm"
                  } font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer`}
                >
                  <CalendarIcon className={`${compact ? "h-4 w-4" : "h-5 w-5"} mr-2`} />
                  Date Filter
                </button>
                
                {showDateFilter && (
                  <div className="absolute top-full left-0 mt-1 p-4 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-80">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => handleDateRangeChange(date, endDate)}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          className="block w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => handleDateRangeChange(startDate, date)}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          className="block w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        onClick={() => handleDateRangeChange(null, null)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Clear Dates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Column Selector */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                compact ? "text-xs" : "text-sm"
              } font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer`}
            >
              <EyeIcon className={`${compact ? "h-4 w-4" : "h-5 w-5"} mr-2`} />
              Columns
            </button>
            
            {showColumnSelector && (
              <div className="absolute top-full left-0 mt-1 p-4 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-60">
                <div className="space-y-2">
                  {columns.map((column) => (
                    <label key={column.accessor} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visibleColumns[column.accessor]}
                        onChange={() => toggleColumnVisibility(column.accessor)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                      />
                      {column.header}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {exportable && (
            <>
              <button
                onClick={exportToPDF}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  compact ? "text-xs" : "text-sm"
                } font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer`}
              >
                <DocumentArrowDownIcon
                  className={`${compact ? "h-4 w-4" : "h-5 w-5"} mr-2`}
                />
                PDF
              </button>
              <button
                onClick={exportToCSV}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  compact ? "text-xs" : "text-sm"
                } font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer`}
              >
                <DocumentArrowDownIcon
                  className={`${compact ? "h-4 w-4" : "h-5 w-5"} mr-2`}
                />
                CSV
              </button>
            </>
          )}

          {pagination && (
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className={`block pl-2 pr-8 py-2 border border-gray-300 rounded-md shadow-sm ${
                compact ? "text-xs" : "text-sm"
              } font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading data...</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className={`min-w-full divide-y divide-gray-200 ${tableClass}`}
          >
            <thead className="bg-gray-50">
              <tr>
                {visibleColumnsList.map((column) => (
                  <th
                    key={column.accessor}
                    scope="col"
                    className={`${headerPadding} text-left font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                    onClick={() =>
                      column.sortable && requestSort(column.accessor)
                    }
                  >
                    <div className="flex items-center">
                      {column.header}
                      {column.sortable && (
                        <span className="ml-1">
                          {sortConfig?.key === column.accessor ? (
                            sortConfig.direction === "ascending" ? (
                              <ChevronUpIcon
                                className={`${compact ? "h-3 w-3" : "h-4 w-4"}`}
                              />
                            ) : (
                              <ChevronDownIcon
                                className={`${compact ? "h-3 w-3" : "h-4 w-4"}`}
                              />
                            )
                          ) : (
                            <ChevronUpDownIcon
                              className={`${
                                compact ? "h-3 w-3" : "h-4 w-4"
                              } opacity-50`}
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <tr
                    key={
                      row.id ||
                      `${row[columns[0].accessor]}-${row[columns[1].accessor]}`
                    }
                    className="hover:bg-gray-50"
                  >
                    {visibleColumnsList.map((column) => (
                      <td
                        key={`${column.accessor}-${
                          row.id || row[columns[0].accessor]
                        }`}
                        className={`${cellPadding} whitespace-nowrap`}
                      >
                        {column.render
                          ? column.render(row[column.accessor], row)
                          : String(row[column.accessor])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={visibleColumnsList.length}
                    className={`${cellPadding} text-center text-gray-500`}
                  >
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div
          className={`${
            compact ? "px-3 py-2" : "px-6 py-3"
          } flex items-center justify-between border-t border-gray-200`}
        >
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className={`relative inline-flex items-center px-3 py-1 border border-gray-300 ${
                compact ? "text-xs" : "text-sm"
              } font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className={`ml-3 relative inline-flex items-center px-3 py-1 border border-gray-300 ${
                compact ? "text-xs" : "text-sm"
              } font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className={`text-gray-700 ${compact ? "text-xs" : "text-sm"}`}>
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalCount || filteredData.length)}
                </span>{" "}
                of <span className="font-medium">{totalCount || filteredData.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1 || isLoading}
                  className={`relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 ${
                    compact ? "text-xs" : "text-sm"
                  } font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="sr-only">First</span>
                  <ChevronDoubleLeftIcon
                    className={`${compact ? "h-3 w-3" : "h-4 w-4"}`}
                  />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className={`relative inline-flex items-center px-2 py-1 border border-gray-300 ${
                    compact ? "text-xs" : "text-sm"
                  } font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="sr-only">Previous</span>
                  <ArrowLeftIcon
                    className={`${compact ? "h-3 w-3" : "h-4 w-4"}`}
                  />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      disabled={isLoading}
                      className={`relative inline-flex items-center px-3 py-1 border ${
                        compact ? "text-xs" : "text-sm"
                      } font-medium ${
                        currentPage === pageNum
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className={`relative inline-flex items-center px-2 py-1 border border-gray-300 ${
                    compact ? "text-xs" : "text-sm"
                  } font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="sr-only">Next</span>
                  <ArrowRightIcon
                    className={`${compact ? "h-3 w-3" : "h-4 w-4"}`}
                  />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages || isLoading}
                  className={`relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 ${
                    compact ? "text-xs" : "text-sm"
                  } font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="sr-only">Last</span>
                  <ChevronDoubleRightIcon
                    className={`${compact ? "h-3 w-3" : "h-4 w-4"}`}
                  />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}