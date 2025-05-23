export const notificationUtils = {
  // Formatar tempo relativo
  formatTimeAgo: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'agora';
    } else if (minutes < 60) {
      return `${minutes} min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else if (days < 7) {
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  },

  // Obter cor da prioridade
  getPriorityColor: (priority) => {
    const colors = {
      'LOW': '#4CAF50',
      'NORMAL': '#2196F3',
      'HIGH': '#FF9800',
      'URGENT': '#F44336'
    };
    return colors[priority] || colors.NORMAL;
  },

  // Obter ícone do tipo de notificação
  getTypeIcon: (type) => {
    const icons = {
      'DOCUMENT_CREATED': '📄',
      'DOCUMENT_SUBMITTED': '📤',
      'DOCUMENT_APPROVED': '✅',
      'DOCUMENT_REJECTED': '❌',
      'DOCUMENT_REVISION_REQUESTED': '🔄',
      'DOCUMENT_FINALIZED': '🎯',
      'VERSION_CREATED': '📝',
      'VERSION_UPDATED': '✏️',
      'COMMENT_ADDED': '💬',
      'COMMENT_REPLIED': '↩️',
      'COMMENT_RESOLVED': '✔️',
      'USER_REGISTERED': '👤',
      'USER_APPROVED': '✅',
      'USER_REJECTED': '❌',
      'DEADLINE_APPROACHING': '⏰',
      'DEADLINE_OVERDUE': '🚨',
      'TASK_ASSIGNED': '📋'
    };
    return icons[type] || '📢';
  },

  // Classificar notificações por categoria
  categorizeNotifications: (notifications) => {
    const categories = {
      documents: [],
      comments: [],
      approvals: [],
      system: []
    };

    notifications.forEach(notification => {
      const type = notification.type;
      
      if (type.includes('DOCUMENT') || type.includes('VERSION')) {
        categories.documents.push(notification);
      } else if (type.includes('COMMENT')) {
        categories.comments.push(notification);
      } else if (type.includes('APPROVED') || type.includes('REJECTED')) {
        categories.approvals.push(notification);
      } else {
        categories.system.push(notification);
      }
    });

    return categories;
  },

  // Agrupar notificações por data
  groupNotificationsByDate: (notifications) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      let groupKey;

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Ontem';
      } else {
        const diffTime = Math.abs(today - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) {
          groupKey = 'Esta semana';
        } else if (diffDays <= 30) {
          groupKey = 'Este mês';
        } else {
          groupKey = date.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          });
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  },

  // Filtrar notificações
  filterNotifications: (notifications, filters) => {
    let filtered = [...notifications];

    // Filtrar por status de leitura
    if (filters.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    // Filtrar por tipo
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(n => filters.types.includes(n.type));
    }

    // Filtrar por prioridade
    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(n => filters.priorities.includes(n.priority));
    }

    // Filtrar por período
    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter(n => {
        const date = new Date(n.createdAt);
        return date >= start && date <= end;
      });
    }

    return filtered;
  },

  // Gerar título amigável para o tipo de notificação
  getTypeTitle: (type) => {
    const titles = {
      'DOCUMENT_CREATED': 'Documento Criado',
      'DOCUMENT_SUBMITTED': 'Documento Submetido',
      'DOCUMENT_APPROVED': 'Documento Aprovado',
      'DOCUMENT_REJECTED': 'Documento Rejeitado',
      'DOCUMENT_REVISION_REQUESTED': 'Revisão Solicitada',
      'DOCUMENT_FINALIZED': 'Documento Finalizado',
      'VERSION_CREATED': 'Nova Versão',
      'VERSION_UPDATED': 'Versão Atualizada',
      'COMMENT_ADDED': 'Novo Comentário',
      'COMMENT_REPLIED': 'Resposta ao Comentário',
      'COMMENT_RESOLVED': 'Comentário Resolvido',
      'USER_REGISTERED': 'Usuário Registrado',
      'USER_APPROVED': 'Usuário Aprovado',
      'USER_REJECTED': 'Usuário Rejeitado',
      'DEADLINE_APPROACHING': 'Prazo Próximo',
      'DEADLINE_OVERDUE': 'Prazo Vencido',
      'TASK_ASSIGNED': 'Tarefa Atribuída'
    };
    return titles[type] || type.replace(/_/g, ' ');
  },

  // Verificar se a notificação é nova (menos de 1 hora)
  isNew: (notification) => {
    const now = new Date();
    const created = new Date(notification.createdAt);
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 1;
  },

  // Verificar se a notificação expirou
  isExpired: (notification) => {
    if (!notification.expiresAt) return false;
    const now = new Date();
    const expires = new Date(notification.expiresAt);
    return now > expires;
  }
};

export default notificationUtils;