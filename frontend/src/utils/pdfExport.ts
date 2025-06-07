import html2pdf from 'html2pdf.js';

export const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-z0-9_-]+/gi, '_');
};

export const exportElementToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  await html2pdf().set(opt).from(element).save();
};

export const exportHtmlToPdf = async (html: string, filename: string): Promise<void> => {
  const container = document.createElement('div');
  container.innerHTML = html;
  await exportElementToPdf(container, filename);
};
