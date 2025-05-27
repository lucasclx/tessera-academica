2import { io, Socket } from 'socket.io-client'
import { Notification, NotificationSummary, DocumentActivity } from '@/types'

interface WebSocketCallbacks {
  onNotification?: (notification: Notification) => void
  onSummaryUpdate?: (summary: NotificationSummary) => void
  onDocumentActivity?: (activity: DocumentActivity) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
}

class WebSocketService {
  private socket: Socket | null = null
  private callbacks: WebSocketCallbacks = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(callbacks: WebSocketCallbacks = {}) {
    this.callbacks = callbacks

    const token = localStorage.getItem('auth_token')
    if (!token) {
      console.warn('Token de autenticação não encontrado para WebSocket')
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080'

    this.socket = io(wsUrl, {
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Eventos de conexão
    this.socket.on('connect', () => {
      console.log('WebSocket conectado')
      this.reconnectAttempts = 0
      this.callbacks.onConnect?.()
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason)
      this.callbacks.onDisconnect?.()
      
      // Tentar reconectar se não foi desconexão manual
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error)
      this.callbacks.onError?.(error)
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    })

    // Eventos de notificação
    this.socket.on('notification', (data: Notification) => {
      console.log('Nova notificação recebida:', data)
      this.callbacks.onNotification?.(data)
    })

    this.socket.on('notification-summary', (data: NotificationSummary) => {
      console.log('Resumo de notificações atualizado:', data)
      this.callbacks.onSummaryUpdate?.(data)
    })

    // Eventos de atividade de documento
    this.socket.on('document-activity', (data: DocumentActivity) => {
      console.log('Atividade no documento:', data)
      this.callbacks.onDocumentActivity?.(data)
    })

    // Eventos de colaboração em tempo real
    this.socket.on('user-joined', (data: { documentId: number; user: string }) => {
      console.log('Usuário entrou no documento:', data)
      this.callbacks.onDocumentActivity?.({
        type: 'user_joined',
        user: data.user,
        timestamp: new Date().toISOString(),
        data
      })
    })

    this.socket.on('user-left', (data: { documentId: number; user: string }) => {
      console.log('Usuário saiu do documento:', data)
      this.callbacks.onDocumentActivity?.({
        type: 'user_left',
        user: data.user,
        timestamp: new Date().toISOString(),
        data
      })
    })

    this.socket.on('document-updated', (data: { documentId: number; user: string; changes: any }) => {
      console.log('Documento atualizado:', data)
      this.callbacks.onDocumentActivity?.({
        type: 'document_updated',
        user: data.user,
        timestamp: new Date().toISOString(),
        data
      })
    })
  }

  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Backoff exponencial
    
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect()
      }
    }, delay)
  }

  // Métodos para colaboração em tempo real
  joinDocument(documentId: number) {
    if (this.socket?.connected) {
      this.socket.emit('join-document', { documentId })
      console.log(`Entrando no documento ${documentId}`)
    }
  }

  leaveDocument(documentId: number) {
    if (this.socket?.connected) {
      this.socket.emit('leave-document', { documentId })
      console.log(`Saindo do documento ${documentId}`)
    }
  }

  sendCursorPosition(documentId: number, position: number) {
    if (this.socket?.connected) {
      this.socket.emit('cursor-position', { documentId, position })
    }
  }

  sendTextChange(documentId: number, changes: any) {
    if (this.socket?.connected) {
      this.socket.emit('text-change', { documentId, changes })
    }
  }

  // Método para enviar eventos personalizados
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket não conectado, não foi possível enviar evento:', event)
    }
  }

  // Método para escutar eventos personalizados
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  // Método para parar de escutar eventos
  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      console.log('WebSocket desconectado manualmente')
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

// Instância singleton do WebSocket
const webSocketService = new WebSocketService()

// Funções de conveniência para uso em toda a aplicação
export const connectWebSocket = (callbacks?: WebSocketCallbacks) => {
  webSocketService.connect(callbacks)
}

export const disconnectWebSocket = () => {
  webSocketService.disconnect()
}

export const joinDocument = (documentId: number) => {
  webSocketService.joinDocument(documentId)
}

export const leaveDocument = (documentId: number) => {
  webSocketService.leaveDocument(documentId)
}

export const sendCursorPosition = (documentId: number, position: number) => {
  webSocketService.sendCursorPosition(documentId, position)
}

export const sendTextChange = (documentId: number, changes: any) => {
  webSocketService.sendTextChange(documentId, changes)
}

export const emitWebSocketEvent = (event: string, data: any) => {
  webSocketService.emit(event, data)
}

export const onWebSocketEvent = (event: string, callback: (data: any) => void) => {
  webSocketService.on(event, callback)
}

export const offWebSocketEvent = (event: string, callback?: (data: any) => void) => {
  webSocketService.off(event, callback)
}

export const isWebSocketConnected = (): boolean => {
  return webSocketService.isConnected()
}

export const getWebSocketInstance = (): Socket | null => {
  return webSocketService.getSocket()
}

// Função utilitária para inicializar WebSocket com configurações padrão
export const initializeWebSocket = () => {
  connectWebSocket({
    onConnect: () => {
      console.log('WebSocket inicializado com sucesso')
    },
    onDisconnect: () => {
      console.log('WebSocket desconectado')
    },
    onError: (error) => {
      console.error('Erro no WebSocket:', error)
    }
  })
}

export default webSocketService