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
  Smartphone,
  Computer,
  Save,
  RestoreOutlined,
  TestOutlined,
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

  // Carregar configurações iniciais
  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    }
    
    // Verificar permissão do browser
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [contextSettings]);

  // Detectar mudanças
  useEffect(() => {
    if (contextSettings) {
      const hasChanges = JSON.stringify(settings) !== JSON.stringify(contextSettings);
      setHasChanges(hasChanges);
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
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setBrowserPermission(granted ? 'granted' : 'denied');
    
    if (granted) {
      toast.success('Permissão concedida! Você receberá notificações do navegador.');
    } else {
      toast.warn('Permissão negada. As notificações do navegador não funcionarão.');
    }
  };

  const handleTestNotification = () => {
    if (browserPermission === 'granted') {
      new Notification('Teste - Tessera Acadêmica', {
        body: 'Esta é uma notificação de teste para verificar se tudo está funcionando corretamente.',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
      toast.info('Notificação de teste enviada!');
    } else {
      toast.warn('Você precisa conceder permissão primeiro.');
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
        return { color: 'warning', text: 'Não solicitada' };
    }
  };

  const permissionStatus = getPermissionStatus();

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
        {/* Status e Permissões */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Status das Notificações"
              subheader="Informações sobre o status atual das notificações"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Computer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle2">Navegador</Typography>
                    <Chip 
                      label={permissionStatus.text} 
                      color={permissionStatus.color} 
                      size="small" 
                    />
                    {browserPermission !== 'granted' && (
                      <Button 
                        size="small" 
                        onClick={handleRequestPermission}
                        sx={{ mt: 1, display: 'block', mx: 'auto' }}
                      >
                        Permitir
                      </Button>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
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
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Schedule sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="subtitle2">Horário Silencioso</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {settings.quietHoursStart} - {settings.quietHoursEnd}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <VolumeUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="subtitle2">Digest</Typography>
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

        {/* Configurações de Email */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email color="primary" />
                  Notificações por Email
                </Box>
              }
              subheader="Configure quando receber emails de notificação"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailEnabled}
                      onChange={(e) => handleSettingChange('emailEnabled', e.target.checked)}
                    />
                  }
                  label="Habilitar notificações por email"
                />
                
                <Box sx={{ ml: 4, mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailDocumentUpdates}
                        onChange={(e) => handleSettingChange('emailDocumentUpdates', e.target.checked)}
                        disabled={!settings.emailEnabled}
                      />
                    }
                    label="Atualizações de documentos"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailComments}
                        onChange={(e) => handleSettingChange('emailComments', e.target.checked)}
                        disabled={!settings.emailEnabled}
                      />
                    }
                    label="Novos comentários"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailApprovals}
                        onChange={(e) => handleSettingChange('emailApprovals', e.target.checked)}
                        disabled={!settings.emailEnabled}
                      />
                    }
                    label="Aprovações e rejeições"
                  />
                </Box>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Configurações do Navegador */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications color="primary" />
                  Notificações do Navegador
                </Box>
              }
              subheader="Configure notificações em tempo real"
              action={
                browserPermission === 'granted' && (
                  <Tooltip title="Enviar notificação de teste">
                    <IconButton onClick={() => setTestDialogOpen(true)}>
                      <TestOutlined />
                    </IconButton>
                  </Tooltip>
                )
              }
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.browserEnabled}
                      onChange={(e) => handleSettingChange('browserEnabled', e.target.checked)}
                      disabled={browserPermission !== 'granted'}
                    />
                  }
                  label="Habilitar notificações do navegador"
                />
                
                {browserPermission !== 'granted' && (
                  <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                    Você precisa conceder permissão para receber notificações do navegador.
                  </Alert>
                )}
                
                <Box sx={{ ml: 4, mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.browserDocumentUpdates}
                        onChange={(e) => handleSettingChange('browserDocumentUpdates', e.target.checked)}
                        disabled={!settings.browserEnabled || browserPermission !== 'granted'}
                      />
                    }
                    label="Atualizações de documentos"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.browserComments}
                        onChange={(e) => handleSettingChange('browserComments', e.target.checked)}
                        disabled={!settings.browserEnabled || browserPermission !== 'granted'}
                      />
                    }
                    label="Novos comentários"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.browserApprovals}
                        onChange={(e) => handleSettingChange('browserApprovals', e.target.checked)}
                        disabled={!settings.browserEnabled || browserPermission !== 'granted'}
                      />
                    }
                    label="Aprovações e rejeições"
                  />
                </Box>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Configurações Avançadas */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Configurações Avançadas"
              subheader="Personalize quando e como receber notificações"
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Frequência do Digest</InputLabel>
                    <Select
                      value={settings.digestFrequency}
                      onChange={(e) => handleSettingChange('digestFrequency', e.target.value)}
                      label="Frequência do Digest"
                    >
                      <MenuItem value="NONE">Desabilitado</MenuItem>
                      <MenuItem value="DAILY">Diário</MenuItem>
                      <MenuItem value="WEEKLY">Semanal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Início do Horário Silencioso"
                    value={settings.quietHoursStart}
                    onChange={(e) => handleSettingChange('quietHoursStart', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Horário em que as notificações serão silenciadas"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Fim do Horário Silencioso"
                    value={settings.quietHoursEnd}
                    onChange={(e) => handleSettingChange('quietHoursEnd', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Horário em que as notificações voltam ao normal"
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Info sx={{ mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Sobre o Horário Silencioso
                    </Typography>
                    <Typography variant="body2">
                      Durante o horário silencioso, você não receberá notificações do navegador nem emails. 
                      As notificações serão acumuladas e enviadas quando o horário silencioso terminar.
                    </Typography>
                  </Box>
                </Box>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Ações */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                {hasChanges && (
                  <Alert severity="warning" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                      Você tem alterações não salvas
                    </Typography>
                  </Alert>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RestoreOutlined />}
                  onClick={handleReset}
                  disabled={!hasChanges || loading}
                >
                  Desfazer Alterações
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={!hasChanges || loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de Teste */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)}>
        <DialogTitle>Testar Notificação</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja enviar uma notificação de teste para verificar se tudo está funcionando corretamente?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleTestNotification} variant="contained">
            Enviar Teste
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NotificationSettings;