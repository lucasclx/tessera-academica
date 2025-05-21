import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Box,
  Paper, 
  Avatar
} from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import './Register.css'; // Vamos adicionar um arquivo CSS para sobrescrever quaisquer estilos globais problemáticos

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    justification: '',
    role: 'STUDENT'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword 
        || !formData.institution || !formData.department || !formData.justification) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await authService.register(registerData);
      toast.success('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="register-container">
      <Paper 
        elevation={3} 
        sx={{ 
          maxWidth: 500,
          width: '100%',
          mx: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 1
        }}
      >
        <Avatar sx={{ bgcolor: '#f44336', m: 1 }}>
          <PersonAddOutlined />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Cadastro - Tessera Acadêmica
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome Completo"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Senha"
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="institution"
            label="Instituição"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="department"
            label="Departamento"
            name="department"
            value={formData.department}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="justification"
            label="Justificativa para uso do sistema"
            name="justification"
            multiline
            rows={4}
            value={formData.justification}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 2, 
              mb: 2,
              bgcolor: '#1976d2',
              color: 'white',
              height: 48,
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
            disabled={isSubmitting}
          >
            CADASTRAR
          </Button>
          
          <Box sx={{ 
            width: '100%', 
            textAlign: 'center',
            mt: 2
          }}>
            <Button
              onClick={goToLogin}
              sx={{ 
                textTransform: 'uppercase',
                color: '#1976d2',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
            >
              JÁ TEM UMA CONTA? FAÇA LOGIN
            </Button>
          </Box>
        </Box>
      </Paper>
    </div>
  );
};

export default Register;