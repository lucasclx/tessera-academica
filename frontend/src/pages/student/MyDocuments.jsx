import { createPage } from '../../utils';
import { documentService } from "../../services";

export default createPage({
  title: "Minhas Monografias",
  service: documentService,
  fetchFunctionName: 'getMyDocumentsPaged',
  createPath: "/student/documents/new",
  viewPath: "/student/documents/:id",
  tableType: 'studentDocuments'
});