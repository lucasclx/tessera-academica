// src/pages/student/MyDocuments.jsx
import { createPage } from '../../utils/minimal'; // Ajuste o caminho se minimal.js estiver em outro local
import documentService from '../../services/documentService';

const MyDocumentsPage = createPage({
  title: "Minhas Monografias",
  service: documentService,
  fetchFunctionName: 'getMyDocumentsPaged', // Nome da função no service
  createPath: "/student/documents/new",
  viewPath: "/student/documents/:id",
  // canDelete default é para status 'DRAFT', o que é apropriado aqui
});

export default MyDocumentsPage;