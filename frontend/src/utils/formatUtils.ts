export const formatBytes = (bytes?: number, decimals = 2): string => {
  if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const truncateText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const pluralize = (count: number, singular: string, plural?: string): string => {
  return count === 1 ? singular : (plural || `${singular}s`);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};