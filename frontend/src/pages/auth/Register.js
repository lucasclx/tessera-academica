import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Typography, Container, Box, Paper, Avatar, Link, Grid, MenuItem } from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Senhas devem ser iguais')
    .required('Confirmação de senha é obrigatória'),
  role: Yup.string()
    .required('Papel é obrigatório'),
  institution: Yup.string()
    .required('Instituição é obrigatória'),
  department: Yup.string()
    .required('Departamento é obrigatório'),
  justification: Yup.string()
    .required('Justificativa é obrigatória')
    .min(20, 'Justificativa deve ter pelo menos 20 caracteres')
});

const Register = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...registerData } = values;
      await authService.register(registerData);
      toast.success('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Cadastro - Tessera Acadêmica
        </Typography>
        <Box sx={{ mt: 1, width: '100%' }}>
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: '',
              institution: '',
              department: '',
              justification: ''
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="name"
                      label="Nome Completo"
                      name="name"
                      autoComplete="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="email"
                      label="Email"
                      name="email"
                      autoComplete="email"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      select
                      fullWidth
                      id="role"
                      label="Papel no Sistema"
                      name="role"
                      error={touched.role && Boolean(errors.role)}
                      helperText={touched.role && errors.role}
                    >
                      <MenuItem value="STUDENT">Aluno</MenuItem>
                      <MenuItem value="ADVISOR">Orientador</MenuItem>
                    </Field>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="password"
                      label="Senha"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="confirmPassword"
                      label="Confirmar Senha"
                      type="password"
                      id="confirmPassword"
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="institution"
                      label="Instituição"
                      name="institution"
                      error={touched.institution && Boolean(errors.institution)}
                      helperText={touched.institution && errors.institution}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="department"
                      label="Departamento"
                      name="department"
                      error={touched.department && Boolean(errors.department)}
                      helperText={touched.department && errors.department}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      id="justification"
                      label="Justificativa para uso do sistema"
                      name="justification"
                      multiline
                      rows={4}
                      error={touched.justification && Boolean(errors.justification)}
                      helperText={touched.justification && errors.justification}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
                <Grid container justifyContent="flex-end">
                  <Grid item>
                    <Link component={RouterLink} to="/login" variant="body2">
                      Já tem uma conta? Faça login
                    </Link>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;