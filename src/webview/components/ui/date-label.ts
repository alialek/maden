export const formatDateElementLabel = (date?: string): string | null => {
  if (!date) return null;

  const today = new Date();
  const elementDate = new Date(date);
  const isToday =
    elementDate.getDate() === today.getDate() &&
    elementDate.getMonth() === today.getMonth() &&
    elementDate.getFullYear() === today.getFullYear();

  const isYesterday =
    new Date(today.setDate(today.getDate() - 1)).toDateString() ===
    elementDate.toDateString();
  const isTomorrow =
    new Date(today.setDate(today.getDate() + 2)).toDateString() ===
    elementDate.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  if (isTomorrow) return 'Tomorrow';

  return elementDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
