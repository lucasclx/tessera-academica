// Arquivo: scrs/src (cópia)/pages/advisor/MyStudents.jsx
import React from 'react';
import { Container, Typography, Paper, Box, Avatar, Chip } from '@mui/material'; // Adicionado Chip
import { createPage, getTableColumns, StatusChip } from '../../utils'; // StatusChip importado
import { userService } from "../../services"; 
import { Visibility as VisibilityIcon, Email as EmailIcon } from '@mui/icons-material';
import { toast } from 'react-toastify'; // Adicionado toast para feedback

// Definição de colunas para a tabela de orientandos
const myStudentsColumns = [
  {
    id: 'name',
    label: 'Nome do Estudante',
    render: (student) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
          {student.name ? student.name.charAt(0).toUpperCase() : '?'}
        </Avatar>
        <Typography variant="subtitle2" color="primary.dark" sx={{ fontWeight: 500 }}>
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
    id: 'institution', // Supondo que o DTO do estudante tenha essa informação
    label: 'Instituição',
    render: (student) => student.institution || "Não informado" // Verificar se a prop existe no DTO UserSelectionDTO
  },
  {
    id: 'status', // Supondo que UserSelectionDTO tenha status
    label: 'Status da Conta', // O DTO UserSelectionDTO não parece ter um campo `status` diretamente.
                          // O `isActive` é booleano. Precisaria de um mapeamento ou ajuste no DTO.
    render: (student) => student.isActive !== undefined ? (
                            <StatusChip status={student.isActive ? 'APPROVED' : 'REJECTED'} type="user" /> // Simulação
                         ) : <Chip label="Status Desconhecido" size="small" />
  },
];

const defaultFilters = [
  {
    id: 'search',
    type: 'search',
    placeholder: 'Buscar por nome ou email do estudante...',
  },
];

// Placeholder para a função de busca de estudantes do orientador
// Você precisará implementar essa lógica no backend e no userService
// Este é um mock para o frontend funcionar sem quebrar.
const mockGetStudentsForCurrentAdvisorPaged = async (page, size, search, filter, sortBy, sortOrder) => {
    console.warn("[MyStudents.jsx] Usando mockGetStudentsForCurrentAdvisorPaged. Implemente o backend real.");
    // Simula uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const allStudents = [ // Dados de exemplo
        { id: 1, name: "Ana Silva", email: "ana.silva@example.com", institution: "Universidade X", isActive: true },
        { id: 2, name: "Bruno Costa", email: "bruno.costa@example.com", institution: "Instituto Y", isActive: true },
        { id: 3, name: "Carlos Dias", email: "carlos.dias@example.com", institution: "Faculdade Z", isActive: false },
    ];
    // Aplicar filtros e busca (simples)
    let filteredStudents = allStudents;
    if (search) {
        filteredStudents = filteredStudents.filter(s => 
            s.name.toLowerCase().includes(search.toLowerCase()) || 
            s.email.toLowerCase().includes(search.toLowerCase())
        );
    }
    // Paginação
    const start = page * size;
    const end = start + size;
    const paginatedStudents = filteredStudents.slice(start, end);

    return {
        content: paginatedStudents,
        totalElements: filteredStudents.length,
        totalPages: Math.ceil(filteredStudents.length / size),
        pageNumber: page,
        pageSize: size
    };
};

// Adicionando a função mock ao userService se ela não existir, para evitar que createPage falhe
if (!userService.getStudentsForCurrentAdvisorPaged) {
    userService.getStudentsForCurrentAdvisorPaged = mockGetStudentsForCurrentAdvisorPaged;
}


export default createPage({
  title: "Meus Orientandos",
  pageSubtitle: "Gerencie e acompanhe seus estudantes orientandos.",
  service: userService,
  fetchFunctionName: 'getStudentsForCurrentAdvisorPaged', // <<-- SUBSTITUA PELO NOME CORRETO DA FUNÇÃO REAL
  
  columnsConfig: myStudentsColumns,
  defaultFilters: defaultFilters,
  
  rowActions: (item, utils) => {
    console.log('[MyStudents.jsx] rowActions - item:', item);
    console.log('[MyStudents.jsx] rowActions - utils (segundo argumento):', utils);

    if (!utils) {
      console.error('[MyStudents.jsx] ERRO CRÍTICO: O segundo argumento (utils) para rowActions está undefined! Não é possível criar ações de menu.');
      return []; 
    }

    const { navigate } = utils; 

    const actions = [];

    if (item && item.id && navigate) {
        actions.push({
            label: 'Ver Perfil/Trabalhos',
            icon: <VisibilityIcon fontSize="small" />,
            isDefaultView: true,
            onClick: () => {
                // Exemplo de rota: navigate(`/advisor/student-profile/${item.id}`);
                toast.info(`Funcionalidade "Ver Perfil/Trabalhos" para ${item.name} (ID: ${item.id}) ainda não implementada.`);
                console.log(`Navegar para detalhes do estudante: ${item.id}`);
            },
        });
    }
    
    if (item && item.email && navigate) {
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
});