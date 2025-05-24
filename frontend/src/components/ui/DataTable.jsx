import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, IconButton, Skeleton, Box, Typography,
  TableSortLabel, Chip
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  pagination = null,
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  onSort = null,
  sortBy = null,
  sortOrder = 'asc',
  onRowClick = null,
  onMenuClick = null,
  emptyState = null,
  stickyHeader = true,
  size = 'medium'
}) => {
  const handleSort = (columnId) => {
    if (onSort && columns.find(col => col.id === columnId)?.sortable) {
      onSort(columnId);
    }
  };

  const renderSkeletonRows = () => (
    Array.from({ length: pagination?.rowsPerPage || 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((column) => (
          <TableCell key={`skeleton-${column.id}`}>
            <Skeleton variant="text" width={column.width || '100%'} />
          </TableCell>
        ))}
      </TableRow>
    ))
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6 }}>
        {emptyState || (
          <Typography variant="body2" color="text.secondary">
            Nenhum dado encontrado
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table stickyHeader={stickyHeader} size={size}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{ minWidth: column.minWidth }}
                sortDirection={sortBy === column.id ? sortOrder : false}
              >
                {column.sortable ? (
                  <TableSortLabel
                    active={sortBy === column.id}
                    direction={sortBy === column.id ? sortOrder : 'asc'}
                    onClick={() => handleSort(column.id)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {column.label}
                  </Typography>
                )}
              </TableCell>
            ))}
            {onMenuClick && <TableCell align="right" sx={{ width: 50 }}>Ações</TableCell>}
          </TableRow>
        </TableHead>
        
        <TableBody>
          {loading ? (
            renderSkeletonRows()
          ) : data.length === 0 ? (
            renderEmptyState()
          ) : (
            data.map((row, index) => (
              <TableRow
                hover
                key={row.id || index}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {column.render ? column.render(row) : row[column.field]}
                  </TableCell>
                ))}
                {onMenuClick && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuClick(e, row);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={pagination.rowsPerPageOptions || [5, 10, 25]}
          component="div"
          count={pagination.total || 0}
          rowsPerPage={pagination.rowsPerPage || 10}
          page={pagination.page || 0}
          onPageChange={(event, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      )}
    </TableContainer>
  );
};

export default DataTable;