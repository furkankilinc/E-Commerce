import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-24 flex justify-center items-center gap-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-16 h-16 rounded-md bg-white border-2 border-gray-50 flex items-center justify-center text-gray-300 hover:text-brand-pink hover:border-brand-pink disabled:opacity-30 transition-all group shadow-sm"
            >
                <svg className="w-6 h-6 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeWidth="3.5" />
                </svg>
            </button>
            <div className="flex items-center gap-3">
                {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                        return (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`w-14 h-14 rounded-md text-xs font-semibold transition-all ${currentPage === p ? 'bg-brand-pink text-white  shadow-brand-pink/20' : 'bg-white border-2 border-gray-50 text-gray-300 hover:text-gray-900'}`}
                            >
                                {p}
                            </button>
                        );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2) {
                        return <span key={p} className="text-gray-200 font-semibold">...</span>;
                    }
                    return null;
                })}
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-16 h-16 rounded-md bg-white border-2 border-gray-50 flex items-center justify-center text-gray-300 hover:text-brand-pink hover:border-brand-pink disabled:opacity-30 transition-all shadow-sm"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeWidth="3.5" />
                </svg>
            </button>
        </div>
    );
};

export default Pagination;
