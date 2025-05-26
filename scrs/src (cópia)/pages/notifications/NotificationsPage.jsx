import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Card, CardContent, Typography, 
  Tabs, Tab, Box, Button 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  DataTable, PageHeader, EmptyState, 
  formatTimeAgo, getNotificationIcon, getPriorityColor,
  StatusChip
} from '../../utils';
import { useNotifications } from '../../context/NotificationContext';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { 
    notifications, summary, loading, 
    markAsRead, markAllAsRead, loadAllHistoricalNotifications 
  } = useNotifications();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [allNotifications, setAllNotifications] = useState([]);

  useEffect(() => {
    const loadHistorical = async () => {
      try {
        const data = await loadAllHistoricalNotifications(0, 50);
        setAllNotifications(data.content || []);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    };
    loadHistorical();
  }, []);

  const columns = [
    {
      id: 'type',
      label: 'Tipo',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: '1.2rem' }}>
            {getNotificationIcon(row.type)}
          </Box>
          <StatusChip status={row.priority} />
        </Box>
      )
    },
    {
      id: 'content',
      label: 'Notificação',
      render: (row) => (
        <Box>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: row.read ? 'normal' : 'bold'
          }}>
            {row.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {row.message}
          </Typography>
        </Box>
      )
    },
    {
      id: 'createdAt',
      label: 'Data',
      render: (row) => (
        <Typography variant="body2">
          {formatTimeAgo(row.createdAt)}
        </Typography>
      )
    }
  ];

  const filteredNotifications = allNotifications.filter(notification => {
    switch (selectedTab) {
      case 1: return !notification.read;
      case 2: return notification.read;
      default: return true;
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
            onClick: markAllAsRead
          },
          {
            label: 'Configurações',
            variant: 'outlined',
            onClick: () => navigate('/settings/notifications')
          }
        ]}
      />

      {/* Cards de Resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { key: 'unreadCount', label: 'Não lidas', color: 'primary' },
          { key: 'documentsCount', label: 'Documentos', color: 'info' },
          { key: 'commentsCount', label: 'Comentários', color: 'success' },
          { key: 'approvalsCount', label: 'Aprovações', color: 'warning' }
        ].map(({ key, label, color }) => (
          <Grid item xs={6} sm={3} key={key}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color={`${color}.main`}>
                  {summary[key] || 0}
                </Typography>
                <Typography variant="body2">{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label={`Todas (${allNotifications.length})`} />
          <Tab label={`Não lidas (${summary.unreadCount})`} />
          <Tab label="Lidas" />
        </Tabs>
      </Box>

      {/* Tabela */}
      <DataTable
        data={filteredNotifications}
        columns={columns}
        loading={loading}
        emptyState={
          <EmptyState
            title="Nenhuma notificação"
            description="Você está em dia! Não há notificações."
          />
        }
        onRowClick={(notification) => {
          if (!notification.read) markAsRead(notification.id);
          if (notification.actionUrl) navigate(notification.actionUrl);
        }}
      />
    </Container>
  );
};

export default NotificationsPage;