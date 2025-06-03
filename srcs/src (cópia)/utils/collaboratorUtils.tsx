// src/utils/collaboratorUtils.tsx
import {
  StarIcon,
  UserIcon,
  AcademicCapIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export interface CollaboratorRoleInfo {
  label: string;
  color: string;
  icon: React.ElementType;
  type: 'STUDENT' | 'ADVISOR' | 'OTHER';
}

export interface CollaboratorPermissionInfo {
  label: string;
  color: string;
  description: string;
}

export const COLLABORATOR_ROLE_INFO: Record<string, CollaboratorRoleInfo> = {
  PRIMARY_STUDENT: { 
    label: 'Estudante Principal', 
    color: 'bg-blue-100 text-blue-800', 
    icon: StarIcon,
    type: 'STUDENT'
  },
  SECONDARY_STUDENT: { 
    label: 'Estudante Colaborador', 
    color: 'bg-blue-50 text-blue-700', 
    icon: UserIcon,
    type: 'STUDENT'
  },
  CO_STUDENT: { 
    label: 'Co-autor', 
    color: 'bg-blue-50 text-blue-700', 
    icon: UserIcon,
    type: 'STUDENT'
  },
  PRIMARY_ADVISOR: { 
    label: 'Orientador Principal', 
    color: 'bg-purple-100 text-purple-800', 
    icon: StarIcon,
    type: 'ADVISOR'
  },
  SECONDARY_ADVISOR: { 
    label: 'Orientador Colaborador', 
    color: 'bg-purple-50 text-purple-700', 
    icon: AcademicCapIcon,
    type: 'ADVISOR'
  },
  CO_ADVISOR: { 
    label: 'Co-orientador', 
    color: 'bg-purple-50 text-purple-700', 
    icon: AcademicCapIcon,
    type: 'ADVISOR'
  },
  EXTERNAL_ADVISOR: { 
    label: 'Orientador Externo', 
    color: 'bg-teal-50 text-teal-700', 
    icon: AcademicCapIcon,
    type: 'ADVISOR'
  },
  EXAMINER: { 
    label: 'Banca Examinadora', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: EyeIcon,
    type: 'OTHER'
  },
  REVIEWER: { 
    label: 'Revisor', 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: EyeIcon,
    type: 'OTHER'
  },
  OBSERVER: { 
    label: 'Observador', 
    color: 'bg-gray-100 text-gray-800', 
    icon: EyeIcon,
    type: 'OTHER'
  },
};

export const COLLABORATOR_PERMISSION_INFO: Record<string, CollaboratorPermissionInfo> = {
  READ_ONLY: { 
    label: 'Leitura', 
    color: 'bg-gray-100 text-gray-700',
    description: 'Pode visualizar o documento e comentários.'
  },
  READ_COMMENT: { 
    label: 'Comentar', 
    color: 'bg-blue-100 text-blue-700',
    description: 'Pode visualizar e adicionar comentários.'
  },
  READ_WRITE: { 
    label: 'Editar', 
    color: 'bg-green-100 text-green-700',
    description: 'Pode editar o conteúdo do documento.'
  },
  FULL_ACCESS: { 
    label: 'Total', 
    color: 'bg-red-100 text-red-700',
    description: 'Pode gerenciar colaboradores e configurações do documento.'
  },
};

export const getRoleInfo = (role: string): CollaboratorRoleInfo => {
  return COLLABORATOR_ROLE_INFO[role] || { 
    label: role, 
    color: 'bg-gray-100 text-gray-800', 
    icon: UserIcon,
    type: 'OTHER'
  };
};

export const getPermissionInfo = (permission: string): CollaboratorPermissionInfo => {
  return COLLABORATOR_PERMISSION_INFO[permission] || { 
    label: permission, 
    color: 'bg-gray-100 text-gray-800',
    description: ''
  };
};

export const isPrimaryRole = (role: string): boolean => {
  return ['PRIMARY_STUDENT', 'PRIMARY_ADVISOR'].includes(role);
};

export const canManageCollaborators = (permission: string, role: string): boolean => {
  return permission === 'FULL_ACCESS' || isPrimaryRole(role);
};

export const getDefaultRoleForUserType = (userType: string): string => {
  if (userType.includes('STUDENT')) return 'SECONDARY_STUDENT';
  if (userType.includes('ADVISOR')) return 'SECONDARY_ADVISOR';
  return 'OBSERVER';
};

export const getDefaultPermission = (): string => 'READ_COMMENT';