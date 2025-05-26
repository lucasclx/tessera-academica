import { createPage } from '../../utils';
import { adminService } from "../../services";

export default createPage({
  title: "Solicitações Pendentes",
  service: adminService,
  fetchFunctionName: 'getPendingRegistrations',
  viewPath: "/admin/registrations/:id",
  canDelete: () => false,
  tableType: 'pendingRegistrations'
});