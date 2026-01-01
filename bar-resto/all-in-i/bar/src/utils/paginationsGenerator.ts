
export const generatePagination = (totalItems: number, currentPage: number, itemsPerPage: number) => {
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
