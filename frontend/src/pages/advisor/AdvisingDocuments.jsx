// src/pages/advisor/AdvisingDocuments.jsx
import { createPage } from '../../utils/minimal'; // Ajuste o caminho
import documentService from '../../services/documentService';

const AdvisingDocumentsPage = createPage({
  title: "Documentos para Orientação",
  service: documentService,
  fetchFunctionName: 'getMyAdvisingDocumentsPaged', // Nome da função no service
  // createPath: null, // Orientador não cria documentos diretamente aqui
  viewPath: "/advisor/documents/:id/review", // Rota para revisão
  canDelete: () => false, // Orientador geralmente não exclui documentos dos alunos
  columnsConfig: [ // Exemplo de colunas customizadas se necessário
    { id: 'title', label: 'Título', render: (item) => item.title || "Sem Título" },
    { id: 'studentName', label: 'Estudante', render: (item) => item.studentName || "N/A" },
    { id: 'status', label: 'Status', render: (item) => <StatusChip status={item.status} /> },
    { id: 'updatedAt', label: 'Atualizado em', render: (item) => item.updatedAt ? format(new Date(item.updatedAt), 'dd/MM/yy HH:mm') : '-' }
  ]
});

export default AdvisingDocumentsPage;