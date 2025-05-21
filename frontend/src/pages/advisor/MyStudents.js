import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const MyStudents = () => {
  // No futuro, aqui você buscaria e listaria os alunos orientandos
  // Exemplo: const [students, setStudents] = useState([]);
  // useEffect(() => { fetchMyStudents(); }, []);

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Meus Orientandos
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Acompanhe o progresso e gerencie as monografias dos seus orientandos.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Conteúdo da página: lista de orientandos, filtros, etc. */}
        <Typography variant="body1">
          Funcionalidade de visualização e gestão de orientandos em desenvolvimento.
        </Typography>
        {/* Exemplo de como poderia ser uma lista:
          <List>
            {students.map(student => (
              <ListItem key={student.id}>
                <ListItemText primary={student.name} secondary={student.email} />
              </ListItem>
            ))}
          </List>
        */}
      </Paper>
    </Container>
  );
};

export default MyStudents;