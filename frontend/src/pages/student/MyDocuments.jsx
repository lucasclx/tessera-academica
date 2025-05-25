import { createPage } from '../../utils/minimal';
import documentService from '../../services/documentService';

const MyDocumentsPage = createPage({
  title: "Minhas Monografias",
  service: documentService,
  fetchFunctionName: 'getMyDocumentsPaged',
  createPath: "/student/documents/new",
  viewPath: "/student/documents/:id"
});

export default MyDocumentsPage;