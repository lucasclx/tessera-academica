package com.tessera.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.Version;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.repository.VersionRepository;

@Service
public class DocumentService {
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private VersionRepository versionRepository;
    
    // ADICIONANDO: Injeção do serviço de eventos de notificação
    @Autowired
    private NotificationEventService notificationEventService;
    
    @Transactional
    public VersionDTO createVersion(VersionDTO versionDTO, User currentUser) {
        Document document = documentRepository.findById(versionDTO.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Verificar permissões - apenas o estudante pode criar versões em documentos de rascunho ou revisão
        if (!currentUser.getId().equals(document.getStudent().getId())) {
            throw new RuntimeException("Apenas o estudante pode criar novas versões");
        }
        
        // Verificar se o documento está em status que permite novas versões
        if (document.getStatus() != DocumentStatus.DRAFT && document.getStatus() != DocumentStatus.REVISION) {
            throw new RuntimeException("Novas versões só podem ser criadas em documentos em rascunho ou revisão");
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
        
        // ADICIONANDO: Disparar evento de notificação
        notificationEventService.onVersionCreated(version, currentUser);
        
        return mapToDTO(version);
    }
    
    // Resto dos métodos permanecem inalterados...
    // (getVersion, getVersionsByDocument, etc.)
    
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