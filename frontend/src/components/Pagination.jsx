import { PAGE_SIZE_OPTIONS } from '../constants';

export default function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        <span>
          Page <strong>{page}</strong> of <strong>{safeTotalPages}</strong>
        </span>
        <span className="pagination-count">
          ({totalCount} {totalCount === 1 ? 'patient' : 'patients'} total)
        </span>
      </div>

      <div className="pagination-controls">
        <label htmlFor="page-size-select" className="page-size-label">
          Rows per page:
        </label>
        <select
          id="page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={disabled}
          className="page-size-select"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || disabled}
          aria-label="Previous page"
        >
          &larr; Previous
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages || disabled}
          aria-label="Next page"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
