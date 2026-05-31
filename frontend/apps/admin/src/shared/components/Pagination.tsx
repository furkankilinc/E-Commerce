import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        // Always show page 1
        pages.push(1);

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        if (start > 2) {
            pages.push('...');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push('...');
        }

        // Always show last page
        pages.push(totalPages);

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex justify-center items-center gap-2 sm:gap-6 mt-16 max-w-full px-4 select-none">
            <button
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="ui-pagination-btn w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shrink-0"
                aria-label="Önceki Sayfa"
            >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-3 overflow-hidden">
                {visiblePages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="ui-pagination-dots px-1 text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500"
                            >
                                ...
                            </span>
                        );
                    }
                    // Mobile'da aktif sayfadan bir önceki sayfayı gizle (1. sayfa veya son sayfa değilse)
                    const shouldHideOnMobile = page === currentPage - 1 && page !== 1 && page !== totalPages;

                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page as number)}
                            className={`ui-pagination-btn w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-xs shrink-0 ${
                                shouldHideOnMobile ? '!hidden sm:!flex' : 'flex'
                            } items-center justify-center ${currentPage === page ? 'active' : ''}`}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>

            <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="ui-pagination-btn w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shrink-0"
                aria-label="Sonraki Sayfa"
            >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default Pagination;

