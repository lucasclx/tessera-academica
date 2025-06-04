import { describe, it, expect } from 'vitest';
import { getPermissionDescription, hasPermission } from '../permissionUtils';

describe('permissionUtils', () => {
  it('returns correct descriptions', () => {
    expect(getPermissionDescription('READ_ONLY')).toBe('Pode visualizar o documento e comentários.');
    expect(getPermissionDescription('READ_COMMENT')).toBe('Pode visualizar e adicionar comentários.');
    expect(getPermissionDescription('READ_WRITE')).toBe('Pode editar o conteúdo do documento.');
    expect(getPermissionDescription('FULL_ACCESS')).toBe('Pode gerenciar colaboradores e configurações do documento.');
    expect(getPermissionDescription('UNKNOWN')).toBe('');
  });

  it('evaluates permission hierarchy', () => {
    expect(hasPermission(['READ_ONLY'], 'READ_ONLY')).toBe(true);
    expect(hasPermission(['READ_ONLY'], 'READ_COMMENT')).toBe(false);
    expect(hasPermission(['READ_WRITE'], 'READ_COMMENT')).toBe(true);
    expect(hasPermission(['READ_COMMENT', 'READ_ONLY'], 'READ_WRITE')).toBe(false);
    expect(hasPermission(['FULL_ACCESS'], 'READ_WRITE')).toBe(true);
  });
});
