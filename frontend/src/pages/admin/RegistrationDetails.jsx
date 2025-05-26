import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Grid, 
  Divider, TextField, CircularProgress, Chip, Card,
  CardContent, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { adminService } from "../../services";

const RegistrationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRegistrationDetails();
  }, [id]);

  const fetchRegistrationDetails = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRegistrationDetails(id);
      setRegistration(data);
    } catch (error) {
      toast.error('Erro ao carregar detalhes da solicitação');
      console.error(error);
      navigate('/admin/registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await adminService.approveRegistration(id, approvalNotes);
      toast.success('Solicitação aprovada com sucesso');
      navigate('/admin/registrations');
    } catch (error) {
      toast.error('Erro ao aprovar solicitação');
      console.error(error);
    } finally {
      setSubmitting(false);
      setOpenApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('É necessário informar o motivo da rejeição');
      return;
    }

    setSubmitting(true);
    try {
      await adminService.rejectRegistration(id, rejectionReason);
      toast.success('Solicitação rejeitada');
      navigate('/admin/registrations');
    } catch (error) {
      toast.error('Erro ao rejeitar solicitação');
      console.error(error);
    } finally {
      setSubmitting(false);
      setOpenRejectDialog(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!registration) {
    return (
      <Container>
        <Typography variant="h5">Solicitação não encontrada</Typography>
        <Button variant="contained" onClick={() => navigate('/admin/registrations')}>
          Voltar para lista
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Detalhes da Solicitação
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/admin/registrations')}>
          Voltar para lista
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Usuário
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Nome:</Typography>
                  <Typography variant="body1">{registration.user.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Email:</Typography>
                  <Typography variant="body1">{registration.user.email}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Papel:</Typography>
                  {registration.user.roles.map(role => (
                    <Chip 
                      key={role.name} 
                      label={role.name === 'STUDENT' ? 'Aluno' : role.name === 'ADVISOR' ? 'Orientador' : role.name} 
                      color={role.name === 'STUDENT' ? 'primary' : 'secondary'}
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Data de Cadastro:</Typography>
                  <Typography variant="body1">
                    {format(new Date(registration.user.registrationDate), 'dd/MM/yyyy HH:mm')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações Institucionais
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Instituição:</Typography>
                  <Typography variant="body1">{registration.institution}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Departamento:</Typography>
                  <Typography variant="body1">{registration.department}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Justificativa
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" paragraph>
                {registration.justification}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              size="large"
              onClick={() => setOpenApproveDialog(true)}
            >
              Aprovar
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Cancel />}
              size="large"
              onClick={() => setOpenRejectDialog(true)}
            >
              Rejeitar
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Diálogo de Aprovação */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)}>
        <DialogTitle>Aprovar Solicitação</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você está prestes a aprovar a solicitação de cadastro de <strong>{registration.user.name}</strong>.
            O usuário receberá uma notificação por email.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="notes"
            label="Observações (opcional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApprove} 
            color="success" 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Processando...' : 'Confirmar Aprovação'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Rejeição */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>Rejeitar Solicitação</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você está prestes a rejeitar a solicitação de cadastro de <strong>{registration.user.name}</strong>.
            Por favor, informe o motivo da rejeição. O usuário receberá uma notificação por email.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Motivo da Rejeição"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={!rejectionReason.trim()}
            helperText={!rejectionReason.trim() ? 'O motivo é obrigatório' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={submitting || !rejectionReason.trim()}
          >
            {submitting ? 'Processando...' : 'Confirmar Rejeição'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RegistrationDetails;