// src/components/Layout/Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationCenter from '../Notifications/NotificationCenter'; // Importar o NotificationCenter
import SettingsModal from './SettingsModal';
import { WebSocketProvider } from '../providers/WebSocketProvider'; // Importar o WebSocketProvider

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false); // Estado para a Central de Notificações
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const toggleNotificationCenter = () => {
    setIsNotificationCenterOpen(!isNotificationCenterOpen);
  };

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  return (
    <WebSocketProvider> {/* Envolver com WebSocketProvider */}
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            onNotificationBellClick={toggleNotificationCenter} // Passar a função para o Header
            onSettingsClick={openSettingsModal}
          />

          {/* Main content area */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Notification Center */}
        <NotificationCenter
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      </div>
    </WebSocketProvider>
  );
};

export default Layout;