export const getPermissionDescription = (permission: string): string => {
  const descriptions: Record<string, string> = {
    READ_ONLY: 'Pode visualizar o documento e comentários.',
    READ_COMMENT: 'Pode visualizar e adicionar comentários.',
    READ_WRITE: 'Pode editar o conteúdo do documento.',
    FULL_ACCESS: 'Pode gerenciar colaboradores e configurações do documento.',
  };
  return descriptions[permission] || '';
};

export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  const permissionHierarchy = {
    READ_ONLY: 0,
    READ_COMMENT: 1,
    READ_WRITE: 2,
    FULL_ACCESS: 3,
  };
  
  const userLevel = Math.max(...userPermissions.map(p => permissionHierarchy[p as keyof typeof permissionHierarchy] || 0));
  const requiredLevel = permissionHierarchy[requiredPermission as keyof typeof permissionHierarchy] || 0;
  
 return userLevel >= requiredLevel;
}; 