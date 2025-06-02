import React from 'react';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  subtitle?: string;
  trend?: { value: number; direction: 'up' | 'down' };
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'gray',
  subtitle,
  trend 
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className={`text-2xl font-bold ${color === 'gray' ? 'text-gray-900' : `text-${color}-600`}`}>
            {value}
          </div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.direction === 'up' ? '↗' : '↘'} {trend.value}%
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;