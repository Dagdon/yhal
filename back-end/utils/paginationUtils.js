export const buildPagination = (totalItems, currentPage = 1, perPage = 10) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const page = Number(currentPage) || 1;
  return {
    totalItems,
    currentPage: page,
    perPage,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};

export const paginateArray = (data, page = 1, limit = 10) => {
  const startIdx = (page - 1) * limit;
  const endIdx = page * limit;
  return {
    pagination: buildPagination(data.length, page, limit),
    results: data.slice(startIdx, endIdx),
  };
};

export default { buildPagination, paginateArray };


