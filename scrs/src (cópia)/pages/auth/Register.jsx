import React, { useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, Button, Typography, Box, Paper, Avatar, FormControl,
  InputLabel, Select, MenuItem, Grid, FormHelperText, Divider,
  Card, CardContent, Stepper, Step, StepLabel, Container
} from '@mui/material';
import { PersonAddOutlined, School, SupervisorAccount } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { authService } from '../../services';

// Reducer para gerenciar o estado do formulário
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_STEP':
      return { ...state, activeStep: action.step };
    case 'RESET':
      return action.payload;
    default:
      return state;
  }
};

const initialState = {
  activeStep: 0,
  name: '', email: '', password: '', confirmPassword: '',
  institution: '', department: '', justification: '',
  role: 'STUDENT', academicDegree: '', researchArea: '', courseLevel: ''
};

const Register = () => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const steps = ['Informações básicas', 'Perfil acadêmico', 'Confirmação'];

  const handleChange = (field) => (e) => {
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!state.name || !state.email || !state.password || !state.confirmPassword) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
        if (state.password !== state.confirmPassword) {
          toast.error('As senhas não coincidem');
          return false;
        }
        if (state.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return false;
        }
        return true;
      case 1:
        if (!state.institution || !state.department || !state.justification) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
        if (state.role === 'ADVISOR' && !state.academicDegree) {
          toast.error('Informe seu grau acadêmico');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(state.activeStep)) {
      dispatch({ type: 'SET_STEP', step: state.activeStep + 1 });
    }
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: state.activeStep - 1 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1)) return;
    
    setIsSubmitting(true);
    try {
      const { confirmPassword, courseLevel, activeStep, ...registerData } = state;
      
      const dataToSend = { ...registerData };
      
      if (state.role === 'STUDENT' && state.courseLevel) {
        dataToSend.additionalInfo = { courseLevel: state.courseLevel };
      }
      
      if (state.role === 'ADVISOR') {
        dataToSend.additionalInfo = {
          academicDegree: state.academicDegree,
          researchArea: state.researchArea
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Dados de acesso</Typography>
            <TextField
              margin="normal" required fullWidth
              label="Nome Completo" name="name" autoComplete="name"
              value={state.name} onChange={handleChange('name')} sx={{ mb: 2 }}
            />
            <TextField
              margin="normal" required fullWidth
              label="Email" name="email" autoComplete="email"
              value={state.email} onChange={handleChange('email')} sx={{ mb: 2 }}
            />
            <TextField
              margin="normal" required fullWidth
              label="Senha" name="password" type="password" autoComplete="new-password"
              value={state.password} onChange={handleChange('password')} sx={{ mb: 2 }}
              helperText="Mínimo 6 caracteres"
            />
            <TextField
              margin="normal" required fullWidth
              label="Confirmar Senha" name="confirmPassword" type="password"
              value={state.confirmPassword} onChange={handleChange('confirmPassword')} sx={{ mb: 2 }}
            />
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
              <InputLabel>Tipo de Usuário</InputLabel>
              <Select
                value={state.role} label="Tipo de Usuário" name="role"
                onChange={handleChange('role')}
              >
                <MenuItem value="STUDENT">Estudante</MenuItem>
                <MenuItem value="ADVISOR">Orientador/Professor</MenuItem>
              </Select>
              <FormHelperText>Selecione o tipo de conta</FormHelperText>
            </FormControl>
            
            <TextField
              margin="normal" required fullWidth label="Instituição" name="institution"
              value={state.institution} onChange={handleChange('institution')} sx={{ mb: 2 }}
            />
            <TextField
              margin="normal" required fullWidth label="Departamento" name="department"
              value={state.department} onChange={handleChange('department')} sx={{ mb: 2 }}
            />
            
            {state.role === 'ADVISOR' && (
              <>
                <TextField
                  margin="normal" required fullWidth label="Grau Acadêmico" name="academicDegree"
                  placeholder="Ex: Doutor em Ciência da Computação"
                  value={state.academicDegree} onChange={handleChange('academicDegree')} sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal" fullWidth label="Área de Pesquisa" name="researchArea"
                  placeholder="Ex: Inteligência Artificial, Banco de Dados"
                  value={state.researchArea} onChange={handleChange('researchArea')} sx={{ mb: 2 }}
                />
              </>
            )}
            
            {state.role === 'STUDENT' && (
              <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
                <InputLabel>Nível do Curso</InputLabel>
                <Select
                  value={state.courseLevel} label="Nível do Curso" name="courseLevel"
                  onChange={handleChange('courseLevel')}
                >
                  <MenuItem value="UNDERGRADUATE">Graduação</MenuItem>
                  <MenuItem value="SPECIALIZATION">Especialização</MenuItem>
                  <MenuItem value="MASTERS">Mestrado</MenuItem>
                  <MenuItem value="PHD">Doutorado</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <TextField
              margin="normal" required fullWidth label="Justificativa" name="justification"
              multiline rows={4} value={state.justification} onChange={handleChange('justification')}
              placeholder={state.role === 'STUDENT' ? 
                "Explique por que precisa usar o sistema" : 
                "Explique seu interesse em orientar alunos"}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Confirme seus dados</Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Dados Básicos</Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Nome:</Typography>
                    <Typography variant="body1">{state.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">{state.email}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                    <Typography variant="body1">
                      {state.role === 'STUDENT' ? 'Estudante' : 'Orientador/Professor'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Dados Acadêmicos</Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Instituição:</Typography>
                    <Typography variant="body1">{state.institution}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Departamento:</Typography>
                    <Typography variant="body1">{state.department}</Typography>
                  </Grid>
                  
                  {state.role === 'ADVISOR' && state.academicDegree && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Grau Acadêmico:</Typography>
                      <Typography variant="body1">{state.academicDegree}</Typography>
                    </Grid>
                  )}
                  
                  {state.role === 'STUDENT' && state.courseLevel && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Nível:</Typography>
                      <Typography variant="body1">
                        {{
                          'UNDERGRADUATE': 'Graduação',
                          'SPECIALIZATION': 'Especialização', 
                          'MASTERS': 'Mestrado',
                          'PHD': 'Doutorado'
                        }[state.courseLevel]}
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
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: state.role === 'STUDENT' ? '#1976d2' : '#f50057', m: 1 }}>
          {state.role === 'STUDENT' ? <School /> : <SupervisorAccount />}
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Cadastro - Tessera Acadêmica
        </Typography>
        
        <Stepper activeStep={state.activeStep} sx={{ mb: 4, width: '100%' }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {renderStepContent(state.activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={state.activeStep === 0}
              onClick={handleBack}
            >
              Voltar
            </Button>
            
            <Box sx={{ flex: '1 1 auto' }} />
            
            {state.activeStep === steps.length - 1 ? (
              <Button
                type="submit" variant="contained" color="primary"
                onClick={handleSubmit} disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleNext}>
                Próximo
              </Button>
            )}
          </Box>
        </Box>
        
        <Box sx={{ width: '100%', textAlign: 'center', mt: 3 }}>
          <Button onClick={() => navigate('/login')} sx={{ textTransform: 'none', color: '#1976d2' }}>
            Já tem uma conta? Faça login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;