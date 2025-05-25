import { createPage, STATUS_CONFIG } from '../../utils/minimal';
import adminService from '../../services/adminService';
import { Typography, Box } from '@mui/material';
import { format } from 'date-fns';

const PendingRegistrationsPage = createPage({
  title: "Solicitações Pendentes",
  service: adminService,
  fetchFunctionName: 'getPendingRegistrations',
  viewPath: "/admin/registrations/:id",
  canDelete: () => false,
  columnsConfig: [
    {
      id: 'user',
      label: 'Usuário',
      render: (item) => (
        <Box>
          <Typography variant="subtitle2" color="primary">
            {item.user?.name || "N/A"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.user?.email || "N/A"}
          </Typography>
        </Box>
      )
    },
    {
      id: 'role',
      label: 'Papel',
      render: (item) => {
        const role = item.user?.roles?.[0]?.name;
        const config = STATUS_CONFIG[role] || { label: role, color: 'default' };
        return (
          <Chip label={config.label} color={config.color} size="small" />
        );
      }
    },
    {
      id: 'institution',
      label: 'Instituição',
      render: (item) => item.institution || "N/A"
    },
    {
      id: 'createdAt',
      label: 'Data',
      render: (item) => item.createdAt ? 
        format(new Date(item.createdAt), 'dd/MM/yy HH:mm') : '-'
    }
  ]
});

export default PendingRegistrationsPage;
