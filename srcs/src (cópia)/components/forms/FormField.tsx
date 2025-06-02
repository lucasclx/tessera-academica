// src/components/forms/FormField.tsx
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select';
  register: any;
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

// Elimina campos de formulário repetitivos