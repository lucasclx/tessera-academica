// src/utils/pdfExport.ts - Versão robusta com fallbacks
import { toast } from 'react-hot-toast';

export const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-z0-9_-]+/gi, '_');
};

// Função auxiliar para carregar html2pdf.js dinamicamente
const loadHtml2Pdf = async () => {
  try {
    const html2pdf = await import('html2pdf.js');
    return html2pdf.default;
  } catch (error) {
    console.warn('html2pdf.js não pôde ser carregado:', error);
    return null;
  }
};

// Método nativo do navegador como fallback
const exportUsingBrowserPrint = (element: HTMLElement, filename: string): void => {
  // Prepara o conteúdo para impressão
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove elementos que não devem aparecer no PDF
  const elementsToRemove = clone.querySelectorAll('button, .tooltip, .no-print');
  elementsToRemove.forEach(el => el.remove());

  // Cria uma nova janela para impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Não foi possível abrir janela para impressão. Verifique se pop-ups estão bloqueados.');
    return;
  }

  // HTML completo para a nova janela
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background: white;
            padding: 20mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 15mm;
            }
            
            @page {
              margin: 15mm;
              size: A4;
            }
          }
          
          /* Estilos para conteúdo rico */
          .prose, .content {
            max-width: none !important;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: 600;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #1f2937;
          }
          
          h1 { font-size: 2.25em; }
          h2 { font-size: 1.875em; }
          h3 { font-size: 1.5em; }
          h4 { font-size: 1.25em; }
          h5 { font-size: 1.125em; }
          h6 { font-size: 1em; }
          
          p {
            margin-bottom: 1em;
            text-align: justify;
          }
          
          ul, ol {
            margin-bottom: 1em;
            padding-left: 2em;
          }
          
          li {
            margin-bottom: 0.25em;
          }
          
          blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1em;
            margin: 1.5em 0;
            font-style: italic;
            color: #6b7280;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            font-size: 0.875em;
          }
          
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
          }
          
          th {
            background-color: #f9fafb;
            font-weight: 600;
          }
          
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          pre {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 1em;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.875em;
            margin: 1em 0;
          }
          
          code {
            background-color: #f3f4f6;
            padding: 0.125em 0.25em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.875em;
          }
          
          a {
            color: #2563eb;
            text-decoration: underline;
          }
          
          a[href]:after {
            content: " (" attr(href) ")";
            font-size: 0.8em;
            color: #6b7280;
          }
          
          img {
            max-width: 100%;
            height: auto;
            margin: 1em 0;
          }
          
          .math-display {
            text-align: center;
            margin: 1em 0;
          }
          
          /* Quebras de página */
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          /* Ocultar elementos desnecessários */
          .no-print,
          button,
          .tooltip,
          .dropdown {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="content">
          ${clone.innerHTML}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Aguarda carregamento e executa impressão
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  toast.success('Abrindo janela de impressão. Escolha "Salvar como PDF" na impressora.');
};

// Função principal para exportar elemento para PDF
export const exportElementToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    // Tenta usar html2pdf.js primeiro
    const html2pdf = await loadHtml2Pdf();
    
    if (html2pdf) {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success('PDF exportado com sucesso!');
    } else {
      // Fallback para método nativo
      exportUsingBrowserPrint(element, filename);
    }
    
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    toast.error('Erro ao exportar PDF. Tentando método alternativo...');
    
    // Fallback em caso de erro
    try {
      exportUsingBrowserPrint(element, filename);
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError);
      toast.error('Não foi possível exportar o PDF. Tente usar Ctrl+P para imprimir.');
    }
  }
};

// Função para exportar HTML string para PDF
export const exportHtmlToPdf = async (html: string, filename: string): Promise<void> => {
  const container = document.createElement('div');
  container.innerHTML = html;
  
  // Aplica estilos básicos para melhor renderização
  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.lineHeight = '1.6';
  container.style.color = '#374151';
  
  // Adiciona temporariamente ao DOM para renderização
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  
  try {
    await exportElementToPdf(container, filename);
  } finally {
    // Remove do DOM
    document.body.removeChild(container);
  }
};

// Função utilitária para preparar conteúdo antes da exportação
export const prepareContentForPdf = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove elementos que não devem aparecer no PDF
  const elementsToRemove = clone.querySelectorAll(
    'button, .tooltip, .no-print, .dropdown, [data-no-print="true"]'
  );
  elementsToRemove.forEach(el => el.remove());
  
  // Converte links relativos em absolutos
  const links = clone.querySelectorAll('a[href]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('mailto')) {
      link.setAttribute('href', new URL(href, window.location.href).href);
    }
  });
  
  // Converte imagens relativas em absolutas
  const images = clone.querySelectorAll('img[src]');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
      img.setAttribute('src', new URL(src, window.location.href).href);
    }
  });
  
  return clone;
};