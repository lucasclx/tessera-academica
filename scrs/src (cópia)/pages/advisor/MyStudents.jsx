// Arquivo: scrs/src/pages/advisor/MyStudents.jsx
import React from 'react';
import { Box, Avatar, Typography, Chip } from '@mui/material'; // Adicionado Chip
import { createPage, StatusChip } from '../../utils'; // StatusChip importado
import { userService } from "../../services"; 
import { Visibility as VisibilityIcon, Email as EmailIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

const myStudentsColumns = [
  {
    id: 'name',
    label: 'Nome do Estudante',
    render: (student) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 32, height: 32, fontSize: '0.875rem' }}>
          {student.name ? student.name.charAt(0).toUpperCase() : '?'}
        </Avatar>
        <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 500 }}>
          {student.name || "Nome não disponível"}
        </Typography>
      </Box>
    )
  },
  {
    id: 'email',
    label: 'Email',
    render: (student) => student.email || "Email não disponível"
  },
  {
    id: 'institution',
    label: 'Instituição',
    render: (student) => student.institution || "Não informado"
  },
  {
    id: 'status', 
    label: 'Status da Conta',
    render: (student) => (
      <StatusChip 
        status={student.isActive ? 'APPROVED' : 'INACTIVE'} // Mapeia isActive para um status que StatusChip entenda
        type="user" 
      />
    )
  },
];

const defaultFilters = [
  {
    id: 'search',
    type: 'search',
    placeholder: 'Buscar por nome ou email do estudante...',
    isMainFilter: false, // Para não ser pego como filtro principal de select
  },
  // Poderia adicionar outros filtros se o backend suportar, ex: por status do documento mais recente, etc.
  // Por enquanto, apenas busca por texto.
];

export default createPage({
  title: "Meus Orientandos",
  pageSubtitle: "Gerencie e acompanhe seus estudantes orientandos.",
  service: userService,
  fetchFunctionName: 'getStudentsForCurrentAdvisorPaged', // Usa a função real do serviço
  
  columnsConfig: myStudentsColumns,
  defaultFilters: defaultFilters, // Passando os filtros definidos
  
  rowActions: (item, utils) => {
    if (!utils || !item) {
      console.error('[MyStudents.jsx] ERRO: utils ou item indefinido em rowActions.');
      return []; 
    }
    const { navigate } = utils; 
    const actions = [];

    if (item.id && navigate) {
        actions.push({
            label: 'Ver Perfil/Trabalhos (Em Breve)', // Atualizado para indicar que não está implementado
            icon: <VisibilityIcon fontSize="small" />,
            isDefaultView: true, // Define esta como ação padrão ao clicar na linha
            onClick: () => {
                // TODO: Implementar navegação para perfil detalhado do estudante ou lista de seus documentos
                toast.info(`Visualizar perfil/trabalhos do estudante: ${item.name} (ID: ${item.id}). Funcionalidade em desenvolvimento.`);
                // Exemplo: navigate(`/advisor/student-profile/${item.id}`);
            },
            disabled: true // Desabilitar até que a funcionalidade exista
        });
    }
    
    if (item.email) {
        actions.push({
            label: 'Enviar Email',
            icon: <EmailIcon fontSize="small" />,
            onClick: () => {
                window.location.href = `mailto:${item.email}`;
            }
        });
    }
    return actions;
  },
  // Não há botão de "Criar Novo" nesta tela, pois orientandos são associados via documentos.
  createPath: null 
});