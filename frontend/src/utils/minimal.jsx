// src/utils/minimal.js - TUDO EM 1 ARQUIVO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Menu, ListItemIcon, ListItemText, Grid, Fab,
  CircularProgress, Alert
} from '@mui/material';
import { 
  Add, Search, Edit, Visibility, Delete, MoreVert,
  CheckCircle, Warning, Info, Send
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// STATUS CONFIG ULTRA-MINIMAL
const STATUS = {
  DRAFT: { label: 'Rascunho', color: 'default', icon: Edit },
  SUBMITTED: { label: 'Enviado', color: 'primary', icon: Send },
  REVISION: { label: 'Em Revisão', color: 'warning', icon: Warning },
  APPROVED: { label: 'Aprovado', color: 'success', icon: CheckCircle },
  FINALIZED: { label: 'Finalizado', color: 'info', icon: Info }
};

// HOOK ULTRA-MINIMAL PARA DADOS
export const useData = (fetchFn, deps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    try {
      setLoading(true);
      const result = await fetchFn(page, size, search, filter, 'updatedAt', 'desc');
      setData(result?.content || []);
      setTotal(result?.totalElements || 0);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, size, search, filter, ...deps]);

  return {
    data, loading, page, size, total, search, filter,
    setPage, setSize, setSearch, setFilter, reload: load
  };
};

// COMPONENTE STATUS CHIP ULTRA-MINIMAL
export const StatusChip = ({ status }) => {
  const config = STATUS[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

// FACTORY ULTRA-MINIMAL PARA PÁGINAS
export const createPage = ({ title, service, createPath, viewPath, canDelete = status => status === 'DRAFT' }) => {
  return function Page() {
    const navigate = useNavigate();
    const { data, loading, page, size, total, search, filter, setPage, setSize, setSearch, setFilter, reload } = useData(service.getMyDocumentsPaged || service.getPendingRegistrations);
    const [menu, setMenu] = useState({ anchor: null, item: null });

    const handleAction = async (action, item) => {
      try {
        if (action === 'delete' && window.confirm(`Excluir "${item.title || item.user?.name}"?`)) {
          await service.deleteDocument?.(item.id) || service.delete?.(item.id);
          toast.success('Excluído com sucesso');
          reload();
        }
        setMenu({ anchor: null, item: null });
      } catch (error) {
        toast.error('Erro na operação');
      }
    };

    if (loading && data.length === 0) {
      return (
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      );
    }

    return (
      <Container maxWidth="lg">
        {/* HEADER ULTRA-COMPACTO */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">{title}</Typography>
          {createPath && (
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate(createPath)}>
              Novo
            </Button>
          )}
        </Box>

        {/* FILTROS ULTRA-COMPACTOS */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={filter} onChange={(e) => setFilter(e.target.value)} label="Status">
                  <MenuItem value="ALL">Todos</MenuItem>
                  {Object.entries(STATUS).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* TABELA ULTRA-COMPACTA */}
        {data.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Nenhum item encontrado</Typography>
            {createPath && (
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate(createPath)}>
                Criar Primeiro Item
              </Button>
            )}
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Principal</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Detalhes</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} hover onClick={() => navigate(viewPath.replace(':id', item.id))}>
                    <TableCell>
                      <Typography variant="subtitle2" color="primary">
                        {item.title || item.user?.name || 'Sem título'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description || item.user?.email || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status || (item.user?.roles?.[0]?.name)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.advisorName || item.studentName || item.institution || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.updatedAt || item.createdAt ? 
                          format(new Date(item.updatedAt || item.createdAt), 'dd/MM/yy') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setMenu({ anchor: e.currentTarget, item }); 
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={size}
              onRowsPerPageChange={(e) => setSize(parseInt(e.target.value))}
            />
          </TableContainer>
        )}

        {/* MENU ULTRA-COMPACTO */}
        <Menu
          anchorEl={menu.anchor}
          open={Boolean(menu.anchor)}
          onClose={() => setMenu({ anchor: null, item: null })}
        >
          <MenuItem onClick={() => navigate(viewPath.replace(':id', menu.item?.id))}>
            <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
            Ver
          </MenuItem>
          {menu.item?.id && (
            <MenuItem onClick={() => navigate(viewPath.replace(':id', menu.item.id) + '?edit=true')}>
              <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
              Editar
            </MenuItem>
          )}
          {canDelete(menu.item?.status) && (
            <MenuItem onClick={() => handleAction('delete', menu.item)}>
              <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
              Excluir
            </MenuItem>
          )}
        </Menu>

        {/* FAB ULTRA-COMPACTO */}
        {createPath && (
          <Fab 
            color="primary" 
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
            onClick={() => navigate(createPath)}
          >
            <Add />
          </Fab>
        )}
      </Container>
    );
  };
};