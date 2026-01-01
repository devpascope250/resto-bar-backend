"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePagination = void 0;
const generatePagination = (totalItems, currentPage, itemsPerPage) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return {
        totalItems,
        currentPage,
        itemsPerPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
    };
};
exports.generatePagination = generatePagination;
