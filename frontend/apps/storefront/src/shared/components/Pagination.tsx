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
            className={`w-14 h-14 rounded-md text-xs font-black transition-all ${
                currentPage === p
                    ? 'bg-brand-pink text-white shadow-xl shadow-brand-pink/20 scale-110'
                    : 'bg-white border-2 border-gray-50 text-gray-300 hover:text-gray-900 group-hover:border-gray-100 hover:scale-105'
            }`}
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
        if (currentPage > 3) pages.push(<span key="dots-start" className="text-gray-200 font-black">...</span>);
        
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) pages.push(renderPageNumber(i));
        
        if (currentPage < totalPages - 2) pages.push(<span key="dots-end" className="text-gray-200 font-black">...</span>);
        pages.push(renderPageNumber(totalPages));
    }

    return (
        <div className="flex justify-center items-center gap-6 mt-20">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-16 h-16 rounded-md bg-white border-2 border-gray-50 flex items-center justify-center text-gray-300 hover:text-brand-pink hover:border-brand-pink disabled:opacity-30 transition-all group shadow-sm active:scale-90"
            >
                <svg className="w-6 h-6 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div className="flex items-center gap-3">
                {pages}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-16 h-16 rounded-md bg-white border-2 border-gray-50 flex items-center justify-center text-gray-300 hover:text-brand-pink hover:border-brand-pink disabled:opacity-30 transition-all group shadow-sm active:scale-90"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};

export default Pagination;
