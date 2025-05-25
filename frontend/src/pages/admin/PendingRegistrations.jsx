// src/pages/admin/PendingRegistrations.jsx
import { createPage, StatusChip } from '../../utils/minimal'; // Ajuste o caminho
import adminService from '../../services/adminService';
import { format } from 'date-fns';
import { Typography } from '@mui/material';


const PendingRegistrationsPage = createPage({
  title: "Solicitações Pendentes",
  service: adminService,
  fetchFunctionName: 'getPendingRegistrations', // Nome da função no service
  // createPath: null, // Admin não cria solicitações aqui
  viewPath: "/admin/registrations/:id",
  canDelete: () => false, // Admin aprova/rejeita, não deleta diretamente da lista
  columnsConfig: [
    { id: 'user', label: 'Usuário', render: (item) => (
        <>
          <Typography variant="subtitle2" color="primary">{item.user?.name || "N/A"}</Typography>
          <Typography variant="caption" color="text.secondary" component="div">{item.user?.email || "N/A"}</Typography>
        </>
    )},
    { id: 'role', label: 'Papel Solicitado', render: (item) => <StatusChip status={item.user?.roles?.[0]?.name} /> },
    { id: 'institution', label: 'Instituição', render: (item) => item.institution || "N/A" },
    { id: 'createdAt', label: 'Data Solicitação', render: (item) => item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yy HH:mm') : '-' }
  ]
});

export default PendingRegistrationsPage;