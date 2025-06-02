import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  actions,
  breadcrumb 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center">
            {Icon && <Icon className="h-7 w-7 mr-2 text-primary-600" />}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          {breadcrumb && (
            <nav className="flex mt-2" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                {breadcrumb.map((item, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && <span className="mx-2">/</span>}
                    {item.href ? (
                      <a href={item.href} className="hover:text-gray-700">{item.label}</a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
