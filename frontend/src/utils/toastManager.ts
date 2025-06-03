class ToastManager {
  private activeToasts = new Set<string>();

  isActive(id: string): boolean {
    return this.activeToasts.has(id);
  }

  add(id: string): void {
    this.activeToasts.add(id);
    // Auto-remover após 10 segundos (tempo máximo de toast)
    setTimeout(() => this.remove(id), 10000);
  }

  remove(id: string): void {
    this.activeToasts.delete(id);
  }
}

export const toastManager = new ToastManager();
