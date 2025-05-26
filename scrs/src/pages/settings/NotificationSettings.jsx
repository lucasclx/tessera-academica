import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Grid, Card, CardContent, CardHeader,
  Switch, FormControl, FormControlLabel, FormGroup, Select, MenuItem,
  InputLabel, TextField, Button, Divider, Alert, Chip, IconButton, Tooltip
} from '@mui/material';
import {
  Email, Notifications, Schedule, Computer, Save, RestoreOutlined,
  NotificationsActiveOutlined, Info
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
    emailEnabled: true, emailDocumentUpdates: true, emailComments: true, emailApprovals: true,
    browserEnabled: true, browserDocumentUpdates: true, browserComments: true, browserApprovals: true,
    digestFrequency: 'DAILY', quietHoursStart: '22:00', quietHoursEnd: '08:00'
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [browserPermission, setBrowserPermission] = useState('default');

  useEffect(() => {
    if (contextSettings) {
      setSettings(prev => ({ ...prev, ...contextSettings }));
    }
    
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [contextSettings]);

  useEffect(() => {
    if (contextSettings) {
      const hasActualChanges = JSON.stringify(settings) !== JSON.stringify(contextSettings);
      setHasChanges(hasActualChanges);
    }
  }, [settings, contextSettings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
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
    const permissionGranted = await requestNotificationPermission();
    setBrowserPermission(permissionGranted ? 'granted' : Notification.permission);
  };

  const handleTestNotification = () => {
    if (browserPermission === 'granted') {
      try {
        new Notification('Teste - Tessera Acadêmica', {
          body: 'Esta é uma notificação de teste.',
          icon: '/logo192.png'
        });
        toast.info('Notificação de teste enviada!');
      } catch (e) {
        toast.error("Erro ao enviar teste.");
      }
    } else {
      toast.warn('Conceda permissão primeiro.');
    }
  };

  const getPermissionChip = () => {
    const colors = { granted: 'success', denied: 'error', default: 'warning' };
    const labels = { granted: 'Concedida', denied: 'Negada', default: 'Pendente' };
    return <Chip label={labels[browserPermission]} color={colors[browserPermission]} size="small" />;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações de Notificações
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Personalize como você recebe notificações.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Status */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Status das Notificações" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Computer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle2">Navegador</Typography>
                    {getPermissionChip()}
                    {browserPermission !== 'granted' && (
                      <Button size="small" onClick={handleRequestPermission} sx={{ mt: 1, display: 'block', mx: 'auto' }}>
                        {browserPermission === 'denied' ? 'Verificar' : 'Solicitar'}
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

        {/* Email Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Email />Email</Box>}
              subheader="Configure notificações por email"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={settings.emailEnabled} onChange={(e) => handleSettingChange('emailEnabled', e.target.checked)}/>}
                  label="Habilitar emails"
                />
                <Box sx={{ ml: 4, mt: 1 }}>
                  <FormControlLabel control={<Switch checked={settings.emailDocumentUpdates} onChange={(e) => handleSettingChange('emailDocumentUpdates', e.target.checked)} disabled={!settings.emailEnabled}/>} label="Documentos"/>
                  <FormControlLabel control={<Switch checked={settings.emailComments} onChange={(e) => handleSettingChange('emailComments', e.target.checked)} disabled={!settings.emailEnabled}/>} label="Comentários"/>
                  <FormControlLabel control={<Switch checked={settings.emailApprovals} onChange={(e) => handleSettingChange('emailApprovals', e.target.checked)} disabled={!settings.emailEnabled}/>} label="Aprovações"/>
                </Box>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Browser Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Notifications />Navegador</Box>}
              subheader="Notificações em tempo real"
              action={
                browserPermission === 'granted' && (
                  <Tooltip title="Testar notificação">
                    <IconButton onClick={handleTestNotification}><NotificationsActiveOutlined /></IconButton>
                  </Tooltip>
                )
              }
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={settings.browserEnabled} onChange={(e) => handleSettingChange('browserEnabled', e.target.checked)} disabled={browserPermission !== 'granted'}/>}
                  label="Habilitar notificações"
                />
                {browserPermission !== 'granted' && (
                  <Alert severity={browserPermission === 'denied' ? "error" : "info"} sx={{ mt: 1, mb: 2 }}>
                    {browserPermission === 'denied' 
                        ? "Permissão negada. Altere nas configurações do navegador." 
                        : "Permissão necessária."}
                    {browserPermission === 'default' && <Button size="small" onClick={handleRequestPermission} sx={{ml:1}}>Solicitar</Button>}
                  </Alert>
                )}
                <Box sx={{ ml: 4, mt: 1 }}>
                  <FormControlLabel control={<Switch checked={settings.browserDocumentUpdates} onChange={(e) => handleSettingChange('browserDocumentUpdates', e.target.checked)} disabled={!settings.browserEnabled || browserPermission !== 'granted'}/>} label="Documentos"/>
                  <FormControlLabel control={<Switch checked={settings.browserComments} onChange={(e) => handleSettingChange('browserComments', e.target.checked)} disabled={!settings.browserEnabled || browserPermission !== 'granted'}/>} label="Comentários"/>
                  <FormControlLabel control={<Switch checked={settings.browserApprovals} onChange={(e) => handleSettingChange('browserApprovals', e.target.checked)} disabled={!settings.browserEnabled || browserPermission !== 'granted'}/>} label="Aprovações"/>
                </Box>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Configurações Avançadas" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Frequência do Digest</InputLabel>
                    <Select value={settings.digestFrequency} onChange={(e) => handleSettingChange('digestFrequency', e.target.value)} label="Frequência">
                      <MenuItem value="NONE">Nunca</MenuItem>
                      <MenuItem value="DAILY">Diário</MenuItem>
                      <MenuItem value="WEEKLY">Semanal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth type="time" label="Início Silencioso" value={settings.quietHoursStart} onChange={(e) => handleSettingChange('quietHoursStart', e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField fullWidth type="time" label="Fim Silencioso" value={settings.quietHoursEnd} onChange={(e) => handleSettingChange('quietHoursEnd', e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 3 }} icon={<Info />}>
                O horário silencioso pausa notificações do navegador entre os horários configurados.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                {hasChanges && (<Chip label="Alterações não salvas" color="warning" variant="outlined" />)}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<RestoreOutlined />} onClick={handleReset} disabled={!hasChanges || loading}>
                  Restaurar
                </Button>
                <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={!hasChanges || loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NotificationSettings;