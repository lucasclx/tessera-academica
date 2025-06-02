// src/pages/admin/MetricsPage.tsx
import React, { useEffect, useState } from 'react';
import { metricsApi } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { ServerIcon, CpuChipIcon, CircleStackIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const MetricsPage: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const health = await metricsApi.getHealth();
        const system = await metricsApi.getSystem();
        setHealthMetrics(health);
        setSystemMetrics(system);
      } catch (err) {
        toast.error('Erro ao carregar métricas do sistema.');
        setError('Não foi possível carregar os dados das métricas.');
        console.error("Metrics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const formatBytes = (bytes?: number, decimals = 2) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-700">Carregando métricas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Métricas do Sistema</h1>
      </div>

      {healthMetrics && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <ServerIcon className="h-6 w-6 mr-3 text-green-500" /> Saúde da Aplicação
            </h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className={`mt-1 text-lg font-semibold ${healthMetrics.status === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                  {healthMetrics.status || 'N/A'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Aplicação</dt>
                <dd className="mt-1 text-lg text-gray-900">{healthMetrics.application || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Versão</dt>
                <dd className="mt-1 text-lg text-gray-900">{healthMetrics.version || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                <dd className="mt-1 text-lg text-gray-900">
                  {healthMetrics.timestamp ? new Date(healthMetrics.timestamp).toLocaleString('pt-BR') : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {systemMetrics && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <CpuChipIcon className="h-6 w-6 mr-3 text-blue-500" /> Métricas de Recursos do Sistema
            </h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CircleStackIcon className="h-5 w-5 mr-1 text-gray-400"/> Memória JVM
                </dt>
                <dd className="mt-1 text-gray-900">
                  <ul className="text-sm space-y-1 pl-1">
                    <li>Total: {formatBytes(systemMetrics.memory?.total)}</li>
                    <li>Usada: {formatBytes(systemMetrics.memory?.used)}</li>
                    <li>Livre: {formatBytes(systemMetrics.memory?.free)}</li>
                    <li>Máxima Alocável: {formatBytes(systemMetrics.memory?.max)}</li>
                  </ul>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Processadores</dt>
                <dd className="mt-1 text-lg text-gray-900">{systemMetrics.processors || 'N/A'} disponíveis</dd>
              </div>
              {/* Uptime pode ser adicionado se o backend prover essa informação específica */}
              {/* <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Uptime</dt>
                <dd className="mt-1 text-lg text-gray-900">{systemMetrics.uptime ? formatUptime(systemMetrics.uptime) : 'N/A'}</dd>
              </div> */}
            </dl>
          </div>
        </div>
      )}

      {(!healthMetrics && !systemMetrics && !loading && !error) && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma métrica disponível</h3>
          <p className="mt-1 text-sm text-gray-500">
            Não foi possível carregar ou não há dados de métricas para exibir.
          </p>
        </div>
      )}
    </div>
  );
};

export default MetricsPage;