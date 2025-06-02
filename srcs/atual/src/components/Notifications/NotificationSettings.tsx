// src/components/Notifications/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  EnvelopeIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { notificationsApi } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface NotificationSettingsData {
  id?: number;
  emailEnabled: boolean;
  emailDocumentUpdates: boolean;
  emailComments: boolean;
  emailApprovals: boolean;
  browserEnabled: boolean;
  browserDocumentUpdates: boolean;
  browserComments: boolean;
  browserApprovals: boolean;
  digestFrequency: string;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsData>({
    emailEnabled: true,
    emailDocumentUpdates: true,
    emailComments: true,
    emailApprovals: true,
    browserEnabled: true,
    browserDocumentUpdates: true,
    browserComments: true,
    browserApprovals: true,
    digestFrequency: 'DAILY',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await notificationsApi.updateSettings(settings);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <EnvelopeIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Notificações por Email</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Ativar emails</div>
              <div className="text-sm text-gray-500">Receber notificações por email</div>
            </div>
            <ToggleSwitch
              enabled={settings.emailEnabled}
              onChange={(enabled) => updateSetting('emailEnabled', enabled)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Atualizações de documentos</div>
              <div className="text-sm text-gray-500">Novos documentos, alterações de status</div>
            </div>
            <ToggleSwitch
              enabled={settings.emailDocumentUpdates}
              onChange={(enabled) => updateSetting('emailDocumentUpdates', enabled)}
              disabled={!settings.emailEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Comentários</div>
              <div className="text-sm text-gray-500">Novos comentários e respostas</div>
            </div>
            <ToggleSwitch
              enabled={settings.emailComments}
              onChange={(enabled) => updateSetting('emailComments', enabled)}
              disabled={!settings.emailEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Aprovações</div>
              <div className="text-sm text-gray-500">Aprovações e rejeições de documentos</div>
            </div>
            <ToggleSwitch
              enabled={settings.emailApprovals}
              onChange={(enabled) => updateSetting('emailApprovals', enabled)}
              disabled={!settings.emailEnabled}
            />
          </div>
        </div>
      </div>

      {/* Browser Notifications */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <ComputerDesktopIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Notificações do Navegador</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Ativar notificações</div>
              <div className="text-sm text-gray-500">Receber notificações push no navegador</div>
            </div>
            <ToggleSwitch
              enabled={settings.browserEnabled}
              onChange={(enabled) => updateSetting('browserEnabled', enabled)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Atualizações de documentos</div>
              <div className="text-sm text-gray-500">Novos documentos, alterações de status</div>
            </div>
            <ToggleSwitch
              enabled={settings.browserDocumentUpdates}
              onChange={(enabled) => updateSetting('browserDocumentUpdates', enabled)}
              disabled={!settings.browserEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Comentários</div>
              <div className="text-sm text-gray-500">Novos comentários e respostas</div>
            </div>
            <ToggleSwitch
              enabled={settings.browserComments}
              onChange={(enabled) => updateSetting('browserComments', enabled)}
              disabled={!settings.browserEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Aprovações</div>
              <div className="text-sm text-gray-500">Aprovações e rejeições de documentos</div>
            </div>
            <ToggleSwitch
              enabled={settings.browserApprovals}
              onChange={(enabled) => updateSetting('browserApprovals', enabled)}
              disabled={!settings.browserEnabled}
            />
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Configurações Gerais</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              Frequência do resumo por email
            </label>
            <select
              value={settings.digestFrequency}
              onChange={(e) => updateSetting('digestFrequency', e.target.value)}
              className="input-field"
              disabled={!settings.emailEnabled}
            >
              <option value="NONE">Nunca</option>
              <option value="DAILY">Diário</option>
              <option value="WEEKLY">Semanal</option>
            </select>
            <div className="text-sm text-gray-500 mt-1">
              Receba um resumo das atividades por email
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Horário silencioso - Início
              </label>
              <input
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Horário silencioso - Fim
              </label>
              <input
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Durante o horário silencioso, você não receberá notificações push
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn btn-primary w-full"
        >
          {saving ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </div>
          ) : (
            'Salvar Configurações'
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;