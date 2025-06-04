package com.tessera.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tessera.backend.dto.VersionDTO;
import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.Version;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.exception.PermissionDeniedException;
import com.tessera.backend.exception.BusinessRuleException;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.VersionRepository;
import com.tessera.backend.util.DiffUtils;

@Service
public class VersionService {
    
    @Autowired
    private VersionRepository versionRepository;
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Autowired
    private DiffUtils diffUtils;
    
    @Autowired
    private NotificationEventService notificationEventService;
    
    @Transactional
    public VersionDTO createVersion(VersionDTO versionDTO, User currentUser) {
        Document document = documentRepository.findById(versionDTO.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Verificar permissões - apenas colaboradores com permissão de edição podem criar versões
        if (!document.canUserEdit(currentUser)) {
            throw new PermissionDeniedException("Você não tem permissão para criar uma nova versão");
        }
        
        // Verificar se o documento está em status que permite novas versões
        if (document.getStatus() != DocumentStatus.DRAFT && document.getStatus() != DocumentStatus.REVISION) {
            throw new BusinessRuleException("Novas versões só podem ser criadas em documentos em rascunho ou revisão");
        }
        
        // Calcular número da versão
        String versionNumber = generateVersionNumber(document);
        
        // Criar nova versão
        Version version = new Version();
        version.setDocument(document);
        version.setVersionNumber(versionNumber);
        version.setCommitMessage(versionDTO.getCommitMessage());
        version.setContent(versionDTO.getContent());
        version.setCreatedBy(currentUser);
        
        // Calcular diff da versão anterior, se existir
        Optional<Version> previousVersion = versionRepository.findLatestByDocument(document);
        if (previousVersion.isPresent()) {
            String diff = diffUtils.generateDiff(previousVersion.get().getContent(), versionDTO.getContent());
            version.setDiffFromPrevious(diff);
        }
        
        // Salvar versão
        version = versionRepository.save(version);
        
        // Se documento estava em revisão, voltar para "Submetido"
        if (document.getStatus() == DocumentStatus.REVISION) {
            document.setStatus(DocumentStatus.SUBMITTED);
            documentRepository.save(document);
        }
        
        // Disparar evento de notificação
        notificationEventService.onVersionCreated(version, currentUser);
        
        return mapToDTO(version);
    }
    
    public VersionDTO getVersion(Long id) {
        Version version = versionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        return mapToDTO(version);
    }
    
    public List<VersionDTO> getVersionsByDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        List<Version> versions = versionRepository.findByDocumentOrderByCreatedAtDesc(document);
        return versions.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public Page<VersionDTO> getVersionsByDocument(Long documentId, Pageable pageable) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        Page<Version> versions = versionRepository.findByDocumentOrderByCreatedAtDesc(document, pageable);
        return versions.map(this::mapToDTO);
    }
    
    public List<VersionDTO> getVersionHistory(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        List<Version> versions = versionRepository.findVersionHistory(document);
        return versions.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public String getDiffBetweenVersions(Long v1Id, Long v2Id) {
        Version version1 = versionRepository.findById(v1Id)
                .orElseThrow(() -> new ResourceNotFoundException("Versão 1 não encontrada"));
        
        Version version2 = versionRepository.findById(v2Id)
                .orElseThrow(() -> new ResourceNotFoundException("Versão 2 não encontrada"));
        
        return diffUtils.generateDiff(version1.getContent(), version2.getContent());
    }
    
    private VersionDTO mapToDTO(Version version) {
        VersionDTO dto = new VersionDTO();
        dto.setId(version.getId());
        dto.setDocumentId(version.getDocument().getId());
        dto.setVersionNumber(version.getVersionNumber());
        dto.setCommitMessage(version.getCommitMessage());
        dto.setContent(version.getContent());
        dto.setDiffFromPrevious(version.getDiffFromPrevious());
        dto.setCreatedById(version.getCreatedBy().getId());
        dto.setCreatedByName(version.getCreatedBy().getName());
        dto.setCreatedAt(version.getCreatedAt());
        dto.setCommentCount(version.getComments().size());
        
        return dto;
    }
    
    private String generateVersionNumber(Document document) {
        List<Version> versions = versionRepository.findByDocumentOrderByCreatedAtDesc(document);
        if (versions.isEmpty()) {
            return "1.0";
        }
        
        String lastVersionNumber = versions.get(0).getVersionNumber();
        String[] parts = lastVersionNumber.split("\\.");
        
        int major = Integer.parseInt(parts[0]);
        int minor = Integer.parseInt(parts[1]);
        
        return major + "." + (minor + 1);
    }
}