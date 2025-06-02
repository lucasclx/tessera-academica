export const getRoleDisplayName = (roles: string[]): string => {
  if (roles.includes('ROLE_ADMIN')) return 'Administrador';
  if (roles.includes('ROLE_ADVISOR')) return 'Orientador';
  if (roles.includes('ROLE_STUDENT')) return 'Estudante';
  return 'Usuário';
};

export const getRoleColor = (roles: string[]): string => {
  if (roles.includes('ROLE_ADMIN')) return 'bg-red-100 text-red-800';
  if (roles.includes('ROLE_ADVISOR')) return 'bg-blue-100 text-blue-800';
  if (roles.includes('ROLE_STUDENT')) return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
};

export const formatRoleNames = (roles: { name: string }[]): string => {
  return roles
    .map(role => role.name.replace('ROLE_', ''))
    .join(', ') || 'N/A';
};
