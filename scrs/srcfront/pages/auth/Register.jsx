import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Box,
  Paper, 
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  Divider,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { PersonAddOutlined, School, SupervisorAccount } from '@mui/icons-material';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import './Register.css';

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    justification: '',
    role: 'STUDENT', // Default role
    academicDegree: '',
    researchArea: '',
    courseLevel: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const steps = ['Informações básicas', 'Perfil acadêmico', 'Confirmação'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validação básica do primeiro passo
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
    } else if (activeStep === 1) {
      // Validação básica do segundo passo
      if (!formData.institution || !formData.department) {
        toast.error('Preencha a instituição e o departamento');
        return;
      }
      if (formData.role === 'ADVISOR' && !formData.academicDegree) {
        toast.error('Informe seu grau acadêmico');
        return;
      }
      if (!formData.justification) {
        toast.error('É necessário fornecer uma justificativa');
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação final
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword 
        || !formData.institution || !formData.department || !formData.justification) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { confirmPassword, courseLevel, ...registerData } = formData;
      
      // Incluir informações específicas do papel escolhido
      const dataToSend = { ...registerData };
      
      // Se for estudante, incluir nível do curso
      if (formData.role === 'STUDENT' && formData.courseLevel) {
        dataToSend.additionalInfo = {
          courseLevel: formData.courseLevel
        };
      }
      
      // Se for orientador, incluir grau acadêmico e área de pesquisa
      if (formData.role === 'ADVISOR') {
        dataToSend.additionalInfo = {
          academicDegree: formData.academicDegree,
          researchArea: formData.researchArea
        };
      }
      
      await authService.register(dataToSend);
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Dados de acesso
            </Typography>
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
              helperText="A senha deve ter pelo menos 6 caracteres"
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
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
              <InputLabel id="role-label">Tipo de Usuário</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Tipo de Usuário"
                onChange={handleChange}
              >
                <MenuItem value="STUDENT">Estudante</MenuItem>
                <MenuItem value="ADVISOR">Orientador/Professor</MenuItem>
              </Select>
              <FormHelperText>Selecione o tipo de conta que deseja criar</FormHelperText>
            </FormControl>
            
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
            
            {formData.role === 'ADVISOR' && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="academicDegree"
                  label="Grau Acadêmico"
                  name="academicDegree"
                  placeholder="Ex: Doutor em Ciência da Computação"
                  value={formData.academicDegree}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="normal"
                  fullWidth
                  id="researchArea"
                  label="Área de Pesquisa"
                  name="researchArea"
                  placeholder="Ex: Inteligência Artificial, Banco de Dados, etc."
                  value={formData.researchArea}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
              </>
            )}
            
            {formData.role === 'STUDENT' && (
              <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
                <InputLabel id="course-level-label">Nível do Curso</InputLabel>
                <Select
                  labelId="course-level-label"
                  id="courseLevel"
                  name="courseLevel"
                  value={formData.courseLevel}
                  label="Nível do Curso"
                  onChange={handleChange}
                >
                  <MenuItem value="UNDERGRADUATE">Graduação</MenuItem>
                  <MenuItem value="SPECIALIZATION">Especialização</MenuItem>
                  <MenuItem value="MASTERS">Mestrado</MenuItem>
                  <MenuItem value="PHD">Doutorado</MenuItem>
                </Select>
              </FormControl>
            )}
            
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
              sx={{ mb: 2 }}
              placeholder={formData.role === 'STUDENT' ? 
                "Explique por que você precisa usar o sistema, mencionando seu projeto de pesquisa ou monografia" : 
                "Explique seu interesse em orientar alunos nesta plataforma e sua experiência na área"}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirme seus dados
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Dados Básicos</Typography>
                <Divider sx={{ mb: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Nome:</Typography>
                    <Typography variant="body1">{formData.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">{formData.email}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Tipo de Usuário:</Typography>
                    <Typography variant="body1">
                      {formData.role === 'STUDENT' ? 'Estudante' : 'Orientador/Professor'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Dados Acadêmicos</Typography>
                <Divider sx={{ mb: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Instituição:</Typography>
                    <Typography variant="body1">{formData.institution}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Departamento:</Typography>
                    <Typography variant="body1">{formData.department}</Typography>
                  </Grid>
                  
                  {formData.role === 'ADVISOR' && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Grau Acadêmico:</Typography>
                        <Typography variant="body1">{formData.academicDegree}</Typography>
                      </Grid>
                      {formData.researchArea && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Área de Pesquisa:</Typography>
                          <Typography variant="body1">{formData.researchArea}</Typography>
                        </Grid>
                      )}
                    </>
                  )}
                  
                  {formData.role === 'STUDENT' && formData.courseLevel && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Nível do Curso:</Typography>
                      <Typography variant="body1">
                        {formData.courseLevel === 'UNDERGRADUATE' && 'Graduação'}
                        {formData.courseLevel === 'SPECIALIZATION' && 'Especialização'}
                        {formData.courseLevel === 'MASTERS' && 'Mestrado'}
                        {formData.courseLevel === 'PHD' && 'Doutorado'}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
            
            <Typography variant="body2" color="text.secondary">
              Após o cadastro, sua solicitação será analisada por um administrador. 
              Você receberá um e-mail quando sua conta for aprovada.
            </Typography>
          </Box>
        );
      
      default:
        return 'Passo desconhecido';
    }
  };

  return (
    <div className="register-container">
      <Paper 
        elevation={3} 
        sx={{ 
          maxWidth: 600,
          width: '100%',
          mx: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 1
        }}
      >
        <Avatar sx={{ 
          bgcolor: formData.role === 'STUDENT' ? '#1976d2' : '#f50057',
          m: 1 
        }}>
          {formData.role === 'STUDENT' ? <School /> : <SupervisorAccount />}
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Cadastro - Tessera Acadêmica
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4, width: '100%' }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {renderStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Voltar
            </Button>
            
            <Box sx={{ flex: '1 1 auto' }} />
            
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleNext}
              >
                Próximo
              </Button>
            )}
          </Box>
        </Box>
        
        <Box sx={{ 
          width: '100%', 
          textAlign: 'center',
          mt: 3
        }}>
          <Button
            onClick={goToLogin}
            sx={{ 
              textTransform: 'none',
              color: '#1976d2',
            }}
          >
            Já tem uma conta? Faça login
          </Button>
        </Box>
      </Paper>
    </div>
  );
};

export default Register;