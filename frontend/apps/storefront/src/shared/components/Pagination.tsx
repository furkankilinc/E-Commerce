import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const renderPageNumber = (p: number) => (
        <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`ui-pagination-btn ${currentPage === p ? 'active' : ''}`}
        >
            {p}
        </button>
    );

    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) pages.push(renderPageNumber(i));
    } else {
        pages.push(renderPageNumber(1));
        if (currentPage > 3) pages.push(<span key="dots-start" className="ui-pagination-dots">...</span>);

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) pages.push(renderPageNumber(i));

        if (currentPage < totalPages - 2) pages.push(<span key="dots-end" className="ui-pagination-dots">...</span>);
        pages.push(renderPageNumber(totalPages));
    }

    return (
        <div className="ui-pagination-container">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="ui-pagination-btn"
            >
                <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div className="flex items-center gap-3">
                {pages}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ui-pagination-btn"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};

export default Pagination;
