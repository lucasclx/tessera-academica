import { createPage } from '../../utils';
import { documentService } from "../../services";

export default createPage({
  title: "Documentos para Orientação",
  service: documentService,
  fetchFunctionName: 'getMyAdvisingDocumentsPaged',
  viewPath: "/advisor/documents/:id/review",
  canDelete: () => false,
  tableType: 'advisorDocuments'
});