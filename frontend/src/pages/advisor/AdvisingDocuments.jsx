import { createPage } from '../../utils/minimal';
import documentService from '../../services/documentService';

const AdvisingDocumentsPage = createPage({
  title: "Documentos para Orientação",
  service: documentService,
  fetchFunctionName: 'getMyAdvisingDocumentsPaged',
  viewPath: "/advisor/documents/:id/review",
  canDelete: () => false // Orientador não deleta documentos
});

export default AdvisingDocumentsPage;