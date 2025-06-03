import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select';
  register: any;
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  register,
  error,
  options,
  placeholder,
  disabled = false
}) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          {...register(name)}
          id={name}
          placeholder={placeholder}
          className={`input-field ${error ? 'input-error' : ''}`}
          disabled={disabled}
          rows={4}
        />
      ) : type === 'select' ? (
        <select
          {...register(name)}
          id={name}
          className={`input-field ${error ? 'input-error' : ''}`}
          disabled={disabled}
        >
          <option value="">Selecione...</option>
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...register(name)}
          type={type}
          id={name}
          placeholder={placeholder}
          className={`input-field ${error ? 'input-error' : ''}`}
          disabled={disabled}
        />
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};