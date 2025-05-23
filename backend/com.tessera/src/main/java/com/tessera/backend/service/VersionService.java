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