// src/components/ui/index.js
export { default as DataTable } from './DataTable';
export { default as StatusChip } from './StatusChip';
export { 
  default as EmptyState, 
  EmptyDocuments, 
  EmptySearchResults, 
  EmptyFilterResults, 
  EmptyNotifications 
} from './EmptyState';
export { default as LoadingButton } from './LoadingButton';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as PageHeader } from './PageHeader';

// ADICIONADO: Exports dos Skeleton Loaders
export { 
  DocumentCardSkeleton,
  TableSkeleton,
  NotificationSkeleton,
  PageSkeleton,
  FormSkeleton,
  CustomDocumentSkeleton
} from './SkeletonLoader';