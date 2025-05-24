import React, { useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, Tabs, Tab, Box } from '@mui/material';
import { Notifications, Today, CheckCircle } from '@mui/icons-material';

import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyNotifications } from '../../components/ui/EmptyState';

const NotificationsPageOptimized = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [summary, setSummary] = useState({
    unreadCount: 0,
    documentsCount: 0,
    commentsCount: 0,
    approvalsCount: 0
  });

  // COLUNAS SIMPLIFICADAS PARA NOTIFICAÇÕES
  const columns = [
    {
      id: 'type',
      label: 'Tipo',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: '1.2rem' }}>
            {getNotificationIcon(row.type)}
          </Box>
          <StatusChip 
            status={row.priority} 
            size="small"
            customConfig={{
              LOW: { label: 'Baixa', color: 'default' },
              NORMAL: { label: 'Normal', color: 'primary' },
              HIGH: { label: 'Alta', color: 'warning' },
              URGENT: { label: 'Urgente', color: 'error' }
            }}
          />
        </Box>
      )
    },
    {
      id: 'content',
      label: 'Notificação',
      render: (row) => (
        <Box>
          <Box sx={{ 
            fontWeight: row.read ? 'normal' : 'bold',
            color: row.read ? 'text.secondary' : 'text.primary'
          }}>
            {row.title}
          </Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
            {row.message}
          </Box>
        </Box>
      )
    },
    {
      id: 'createdAt',
      label: 'Data',
      render: (row) => (
        <Box>
          <Box>{new Date(row.createdAt).toLocaleDateString('pt-BR')}</Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {new Date(row.createdAt).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Box>
        </Box>
      )
    }
  ];

  const getNotificationIcon = (type) => {
    const icons = {
      'DOCUMENT_CREATED': '📄',
      'DOCUMENT_SUBMITTED': '📤', 
      'COMMENT_ADDED': '💬',
      'DOCUMENT_APPROVED': '✅'
    };
    return icons[type] || '📢';
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedTab) {
      case 1: return !notification.read; // Não lidas
      case 2: return notification.read;  // Lidas
      default: return true; // Todas
    }
  });

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Notificações"
        subtitle={`${summary.unreadCount} não lidas`}
        actions={[
          {
            label: 'Marcar todas como lidas',
            variant: 'outlined',
            onClick: () => {/* marcar todas como lidas */}
          },
          {
            label: 'Configurações',
            variant: 'outlined',
            onClick: () => navigate('/settings/notifications')
          }
        ]}
      />

      {/* RESUMO EM CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">{summary.unreadCount}</Typography>
              <Typography variant="body2">Não lidas</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">{summary.documentsCount}</Typography>
              <Typography variant="body2">Documentos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">{summary.commentsCount}</Typography>
              <Typography variant="body2">Comentários</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">{summary.approvalsCount}</Typography>
              <Typography variant="body2">Aprovações</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS PARA FILTRAR */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label={`Todas (${notifications.length})`} />
          <Tab label={`Não lidas (${summary.unreadCount})`} />
          <Tab label="Lidas" />
        </Tabs>
      </Box>

      {/* TABELA DE NOTIFICAÇÕES */}
      <DataTable
        data={filteredNotifications}
        columns={columns}
        loading={loading}
        emptyState={<EmptyNotifications />}
        onRowClick={(notification) => {
          // Marcar como lida e navegar se tiver actionUrl
          if (notification.actionUrl) {
            navigate(notification.actionUrl);
          }
        }}
      />
    </Container>
  );
};

export default NotificationsPageOptimized;