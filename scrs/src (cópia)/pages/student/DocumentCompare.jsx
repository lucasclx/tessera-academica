import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Paper, Grid,
  FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, CardHeader, Divider,
  IconButton, Chip, Alert, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  ArrowBack, SwapHoriz, Refresh, ExpandMore,
  CompareArrows, Schedule, Person, Info, History
} from '@mui/icons-material';
import { versionService, documentService } from "../../services";

const DocumentCompare = () => {
  const { id, v1, v2 } = useParams();
  const navigate = useNavigate();
  
  // Estados
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);
  const [selectedV1, setSelectedV1] = useState(v1 || '');
  const [selectedV2, setSelectedV2] = useState(v2 || '');
  const [diff, setDiff] = useState('');
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (selectedV1 && selectedV2 && selectedV1 !== selectedV2) {
      loadComparison();
    }
  }, [selectedV1, selectedV2]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar documento
      const docData = await documentService.getDocument(id);
      setDocument(docData);
      
      // Carregar versões
      const versionsData = await versionService.getVersionsByDocument(id);
      setVersions(versionsData);
      
      // Se temos versões na URL, selecionar automaticamente
      if (v1 && v2) {
        setSelectedV1(v1);
        setSelectedV2(v2);
      } else if (versionsData.length >= 2) {
        // Selecionar as duas versões mais recentes por padrão
        setSelectedV1(versionsData[1].id.toString());
        setSelectedV2(versionsData[0].id.toString());
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar documento e versões');
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      setComparing(true);
      
      // Carregar detalhes das versões selecionadas
      const [v1Data, v2Data] = await Promise.all([
        versionService.getVersion(selectedV1),
        versionService.getVersion(selectedV2)
      ]);
      
      setVersion1(v1Data);
      setVersion2(v2Data);
      
      // Carregar diff entre as versões
      const diffData = await versionService.getDiffBetweenVersions(selectedV1, selectedV2);
      setDiff(diffData);
      
    } catch (error) {
      console.error('Erro ao comparar versões:', error);
      setError('Erro ao comparar versões');
    } finally {
      setComparing(false);
    }
  };

  const handleSwapVersions = () => {
    const temp = selectedV1;
    setSelectedV1(selectedV2);
    setSelectedV2(temp);
  };

  const renderDiff = (content1, content2) => {
    // Função simples para destacar diferenças
    // Em um cenário real, você usaria uma biblioteca como diff2html
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    
    const diffLines = [];
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        diffLines.push({
          type: 'equal',
          content: line1,
          lineNumber: i + 1
        });
      } else {
        if (line1) {
          diffLines.push({
            type: 'removed',
            content: line1,
            lineNumber: i + 1,
            side: 'left'
          });
        }
        if (line2) {
          diffLines.push({
            type: 'added',
            content: line2,
            lineNumber: i + 1,
            side: 'right'
          });
        }
      }
    }
    
    return diffLines;
  };

  const formatVersionLabel = (version) => {
    return `v${version.versionNumber} - ${version.commitMessage}`;
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Carregando comparação...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={loadData} sx={{ ml: 2 }}>
            Tentar Novamente
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(`/student/documents/${id}`)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              Comparar Versões
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {document?.title}
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
        >
          Atualizar
        </Button>
      </Box>

      {/* Seletor de Versões */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <CompareArrows sx={{ mr: 1, verticalAlign: 'middle' }} />
          Selecionar Versões para Comparar
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>Versão Anterior</InputLabel>
              <Select
                value={selectedV1}
                onChange={(e) => setSelectedV1(e.target.value)}
                label="Versão Anterior"
              >
                {versions.map((version) => (
                  <MenuItem key={version.id} value={version.id.toString()}>
                    {formatVersionLabel(version)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
            <IconButton onClick={handleSwapVersions} color="primary">
              <SwapHoriz />
            </IconButton>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel>Versão Posterior</InputLabel>
              <Select
                value={selectedV2}
                onChange={(e) => setSelectedV2(e.target.value)}
                label="Versão Posterior"
              >
                {versions.map((version) => (
                  <MenuItem key={version.id} value={version.id.toString()}>
                    {formatVersionLabel(version)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {selectedV1 === selectedV2 && selectedV1 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Selecione versões diferentes para fazer a comparação.
          </Alert>
        )}
      </Paper>

      {/* Informações das Versões */}
      {version1 && version2 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={`Versão ${version1.versionNumber}`}
                subheader={version1.commitMessage}
                sx={{ bgcolor: '#ffebee' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {version1.createdByName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {new Date(version1.createdAt).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={`Versão ${version2.versionNumber}`}
                subheader={version2.commitMessage}
                sx={{ bgcolor: '#e8f5e9' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {version2.createdByName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {new Date(version2.createdAt).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Comparação */}
      {comparing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Comparando versões...</Typography>
        </Box>
      ) : version1 && version2 ? (
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'grey.100', p: 2 }}>
            <Typography variant="h6">
              Comparação Lado a Lado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <Chip label="Removido" size="small" sx={{ bgcolor: '#ffebee', mr: 1 }} />
              <Chip label="Adicionado" size="small" sx={{ bgcolor: '#e8f5e9', mr: 1 }} />
              <Chip label="Inalterado" size="small" sx={{ bgcolor: '#f5f5f5' }} />
            </Typography>
          </Box>
          
          <Grid container>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0', minHeight: '400px' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ bgcolor: '#ffebee', p: 1, borderRadius: 1 }}>
                  Versão {version1.versionNumber} (Anterior)
                </Typography>
                <Box
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '600px',
                    overflow: 'auto'
                  }}
                >
                  {version1.content}
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, minHeight: '400px' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ bgcolor: '#e8f5e9', p: 1, borderRadius: 1 }}>
                  Versão {version2.versionNumber} (Posterior)
                </Typography>
                <Box
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '600px',
                    overflow: 'auto'
                  }}
                >
                  {version2.content}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Info sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Selecione duas versões para comparar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use os seletores acima para escolher as versões que deseja comparar.
          </Typography>
        </Paper>
      )}

      {/* Informações Adicionais */}
      {versions.length > 0 && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              Histórico Completo de Versões ({versions.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {versions.map((version, index) => (
                <Grid item xs={12} md={6} lg={4} key={version.id}>
                  <Card 
                    variant="outlined"
                    sx={{
                      bgcolor: (selectedV1 === version.id.toString() || selectedV2 === version.id.toString()) 
                        ? 'primary.light' : 'background.paper',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 2
                      }
                    }}
                    onClick={() => {
                      if (!selectedV1) {
                        setSelectedV1(version.id.toString());
                      } else if (!selectedV2) {
                        setSelectedV2(version.id.toString());
                      } else if (selectedV1 === version.id.toString()) {
                        setSelectedV1('');
                      } else if (selectedV2 === version.id.toString()) {
                        setSelectedV2('');
                      } else {
                        setSelectedV2(version.id.toString());
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" color="primary">
                          v{version.versionNumber}
                        </Typography>
                        {index === 0 && (
                          <Chip label="Mais Recente" size="small" color="success" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" gutterBottom>
                        {version.commitMessage}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Person sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="caption">
                          {version.createdByName}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="caption">
                          {new Date(version.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(version.createdAt).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                      </Box>
                      
                      {version.commentCount > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={`${version.commentCount} comentário${version.commentCount !== 1 ? 's' : ''}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Dicas de Uso */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          💡 Dicas para Comparação
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              • <strong>Clique nos cards</strong> do histórico para selecioná-los rapidamente
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Use o botão trocar</strong> para inverter as versões selecionadas
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              • <strong>Versões mais recentes</strong> aparecem primeiro na lista
            </Typography>
            <Typography variant="body2" paragraph>
              • <strong>Comentários</strong> são mostrados quando disponíveis
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DocumentCompare;