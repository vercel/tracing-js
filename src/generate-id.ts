export const generateId = () =>
  Math.random()
    .toString(16)
    .slice(2)
    .toUpperCase();
