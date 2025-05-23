// frontend/src/pages/settings/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControl,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email,
  Notifications,
  Schedule,
  VolumeUp,
  // Smartphone, // Smartphone icon not used, can be removed
  Computer,
  Save,
  RestoreOutlined,
  // TestOutlined, // CORRIGIDO: Ícone não existe
  NotificationsActiveOutlined, // Ícone alternativo para teste de notificação
  Info
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNotifications } from '../../context/NotificationContext';

const NotificationSettings = () => {
  const { 
    settings: contextSettings, 
    updateSettings, 
    requestNotificationPermission 
  } = useNotifications();

  const [settings, setSettings] = useState({
    emailEnabled: true,
    emailDocumentUpdates: true,
    emailComments: true,
    emailApprovals: true,
    browserEnabled: true,
    browserDocumentUpdates: true,
    browserComments: true,
    browserApprovals: true,
    digestFrequency: 'DAILY',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState('default');

  useEffect(() => {
    if (contextSettings) {
      setSettings(prevSettings => ({ ...prevSettings, ...contextSettings }));
    }
    
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [contextSettings]);

  useEffect(() => {
    if (contextSettings) {
      // Check if there are actual changes before setting hasChanges to true
      const currentSettingsString = JSON.stringify(settings);
      const contextSettingsString = JSON.stringify({
        ...contextSettings, // Ensure all keys are present for comparison
        // Add any missing keys from the default 'settings' state if contextSettings might be incomplete
        emailEnabled: contextSettings.emailEnabled !== undefined ? contextSettings.emailEnabled : true,
        emailDocumentUpdates: contextSettings.emailDocumentUpdates !== undefined ? contextSettings.emailDocumentUpdates : true,
        emailComments: contextSettings.emailComments !== undefined ? contextSettings.emailComments : true,
        emailApprovals: contextSettings.emailApprovals !== undefined ? contextSettings.emailApprovals : true,
        browserEnabled: contextSettings.browserEnabled !== undefined ? contextSettings.browserEnabled : true,
        browserDocumentUpdates: contextSettings.browserDocumentUpdates !== undefined ? contextSettings.browserDocumentUpdates : true,
        browserComments: contextSettings.browserComments !== undefined ? contextSettings.browserComments : true,
        browserApprovals: contextSettings.browserApprovals !== undefined ? contextSettings.browserApprovals : true,
        digestFrequency: contextSettings.digestFrequency || 'DAILY',
        quietHoursStart: contextSettings.quietHoursStart || '22:00',
        quietHoursEnd: contextSettings.quietHoursEnd || '08:00',

      });
      if (currentSettingsString !== contextSettingsString) {
        setHasChanges(true);
      } else {
        setHasChanges(false);
      }
    }
  }, [settings, contextSettings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(settings);
      toast.success('Configurações salvas com sucesso!');
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (contextSettings) {
      setSettings(contextSettings);
      setHasChanges(false);
    }
  };

  const handleRequestPermission = async () => {
    const permissionGranted = await requestNotificationPermission(); // requestNotificationPermission from context
    setBrowserPermission(permissionGranted ? 'granted' : Notification.permission); // Update based on actual permission
    
    if (permissionGranted) {
      toast.success('Permissão concedida! Você receberá notificações do navegador.');
    } else if (Notification.permission === 'denied') {
      toast.error('Permissão negada. Por favor, habilite nas configurações do seu navegador.');
    } else {
        toast.warn('Permissão para notificações não concedida.');
    }
  };

  const handleTestNotification = () => {
    if (browserPermission === 'granted') {
      try {
        new Notification('Teste - Tessera Acadêmica', {
          body: 'Esta é uma notificação de teste para verificar se tudo está funcionando corretamente.',
          icon: '/logo192.png', // Caminho para um ícone na pasta public
          tag: 'test-notification'
        });
        toast.info('Notificação de teste enviada!');
      } catch (e) {
        toast.error("Erro ao enviar notificação de teste.");
        console.error("Erro ao testar notificação:", e);
      }
    } else {
      toast.warn('Você precisa conceder permissão para notificações do navegador primeiro.');
    }
    setTestDialogOpen(false);
  };

  const getPermissionStatus = () => {
    switch (browserPermission) {
      case 'granted':
        return { color: 'success', text: 'Concedida' };
      case 'denied':
        return { color: 'error', text: 'Negada' };
      default:
        return { color: 'warning', text: 'Pendente' };
    }
  };

  const permissionStatusChip = getPermissionStatus();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações de Notificações
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Personalize como e quando você recebe notificações sobre atividades na plataforma.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Status das Notificações"
              subheader="Informações sobre o status atual das suas preferências de notificação"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Computer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle2">Navegador</Typography>
                    <Chip 
                      label={permissionStatusChip.text} 
                      color={permissionStatusChip.color} 
                      size="small" 
                    />
                    {browserPermission !== 'granted' && (
                      <Button 
                        size="small" 
                        onClick={handleRequestPermission}
                        sx={{ mt: 1, display: 'block', mx: 'auto' }}
                      >
                        {browserPermission === 'denied' ? 'Verificar Permissão' : 'Solicitar Permissão'}
                      </Button>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Email sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="subtitle2">Email</Typography>
                    <Chip 
                      label={settings.emailEnabled ? 'Ativo' : 'Inativo'} 
                      color={settings.emailEnabled ? 'success' : 'default'}
                      size="small" 
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Schedule sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="subtitle2">Horário Silencioso</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {settings.quietHoursStart || "N/A"} - {settings.quietHoursEnd || "N/A"}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <VolumeUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="subtitle2">Digest de Email</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {settings.digestFrequency === 'DAILY' ? 'Diário' : 
                       settings.digestFrequency === 'WEEKLY' ? 'Semanal' : 'Desabilitado'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={ <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Email color="action" />Notificações por Email</Box>}
              subheader="Configure quando receber emails de notificação"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={settings.emailEnabled || false} onChange={(e) => handleSettingChange('emailEnabled', e.target.checked)}/>}
                  label="Habilitar notificações por email"
                />
                <Box sx={{ ml: 4, mt: 1, pl:1, borderLeft: '2px solid #eee' }}>
                  <FormControlLabel control={<Switch checked={settings.emailDocumentUpdates || false} onChange={(e) => handleSettingChange('emailDocumentUpdates', e.target.checked)} disabled={!settings.emailEnabled}/>} label="Atualizações de documentos"/>
                  <FormControlLabel control={<Switch checked={settings.emailComments || false} onChange={(e) => handleSettingChange('emailComments', e.target.checked)} disabled={!settings.emailEnabled}/>} label="Novos comentários"/>
                  <FormControlLabel control={<Switch checked={settings.emailApprovals || false} onChange={(e) => handleSettingChange('emailApprovals', e.target.checked)} disabled={!settings.emailEnabled}/>} label="Aprovações e rejeições"/>
                </Box>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Notifications color="action" />Notificações do Navegador</Box>}
              subheader="Configure notificações em tempo real no seu navegador"
              action={
                browserPermission === 'granted' && (
                  <Tooltip title="Enviar notificação de teste">
                    {/* CORRIGIDO: Ícone alterado */}
                    <IconButton onClick={() => setTestDialogOpen(true)}><NotificationsActiveOutlined /></IconButton>
                  </Tooltip>
                )
              }
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={settings.browserEnabled || false} onChange={(e) => handleSettingChange('browserEnabled', e.target.checked)} disabled={browserPermission !== 'granted'}/>}
                  label="Habilitar notificações do navegador"
                />
                {browserPermission !== 'granted' && (
                  <Alert severity={browserPermission === 'denied' ? "error" : "info"} sx={{ mt: 1, mb: 2 }}>
                    {browserPermission === 'denied' 
                        ? "Permissão negada. Altere nas configurações do navegador." 
                        : "Permissão necessária para notificações do navegador."}
                    {browserPermission === 'default' && <Button size="small" onClick={handleRequestPermission} sx={{ml:1}}>Solicitar</Button>}
                  </Alert>
                )}
                <Box sx={{ ml: 4, mt: 1, pl:1, borderLeft: '2px solid #eee' }}>
                  <FormControlLabel control={<Switch checked={settings.browserDocumentUpdates || false} onChange={(e) => handleSettingChange('browserDocumentUpdates', e.target.checked)} disabled={!settings.browserEnabled || browserPermission !== 'granted'}/>} label="Atualizações de documentos"/>
                  <FormControlLabel control={<Switch checked={settings.browserComments || false} onChange={(e) => handleSettingChange('browserComments', e.target.checked)} disabled={!settings.browserEnabled || browserPermission !== 'granted'}/>} label="Novos comentários"/>
                  <FormControlLabel control={<Switch checked={settings.browserApprovals || false} onChange={(e) => handleSettingChange('browserApprovals', e.target.checked)} disabled={!settings.browserEnabled || browserPermission !== 'granted'}/>} label="Aprovações e rejeições"/>
                </Box>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Configurações Avançadas" subheader="Personalize quando e como receber notificações"/>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Frequência do Digest de Email</InputLabel>
                    <Select value={settings.digestFrequency || 'DAILY'} onChange={(e) => handleSettingChange('digestFrequency', e.target.value)} label="Frequência do Digest de Email">
                      <MenuItem value="NONE">Nunca (apenas tempo real)</MenuItem>
                      <MenuItem value="DAILY">Diário</MenuItem>
                      <MenuItem value="WEEKLY">Semanal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth type="time" label="Início do Horário Silencioso" value={settings.quietHoursStart || '22:00'} onChange={(e) => handleSettingChange('quietHoursStart', e.target.value)} InputLabelProps={{ shrink: true }} helperText="Notificações silenciadas após este horário"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth type="time" label="Fim do Horário Silencioso" value={settings.quietHoursEnd || '08:00'} onChange={(e) => handleSettingChange('quietHoursEnd', e.target.value)} InputLabelProps={{ shrink: true }} helperText="Notificações reativadas após este horário"/>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 3 }} icon={<Info fontSize="inherit"/>}>
                O digest de email resume as notificações não lidas no período selecionado. O horário silencioso pausa as notificações do navegador e emails (exceto os digests, se configurados para envio).
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, mt:1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                {hasChanges && (<Chip label="Alterações não salvas" color="warning" variant="outlined" />)}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<RestoreOutlined />} onClick={handleReset} disabled={!hasChanges || loading}>Restaurar Padrão</Button>
                <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={!hasChanges || loading}>
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)}>
        <DialogTitle>Testar Notificação do Navegador</DialogTitle>
        <DialogContent><Typography>Isto enviará uma notificação de teste para o seu navegador.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleTestNotification} variant="contained">Enviar Teste</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NotificationSettings;