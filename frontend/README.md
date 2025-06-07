# Tessera Acadêmica

Sistema completo de gestão de documentos acadêmicos para estudantes e orientadores, desenvolvido com Spring Boot (backend) e React (frontend).

## 🚀 Funcionalidades

### Para Estudantes
- ✅ Criação e edição de documentos acadêmicos
- ✅ Sistema de versionamento com controle de mudanças
- ✅ Submissão de documentos para revisão
- ✅ Acompanhamento do status dos documentos
- ✅ Dashboard personalizado com métricas
- ✅ Sistema de notificações

### Para Orientadores
- ✅ Revisão e aprovação de documentos
- ✅ Solicitação de revisões com feedback
- ✅ Gerenciamento de múltiplos orientandos
- ✅ Dashboard com documentos pendentes
- ✅ Sistema de comentários e anotações

### Para Administradores
- ✅ Aprovação de novos usuários
- ✅ Gerenciamento de usuários e permissões
- ✅ Dashboard administrativo com estatísticas
- ✅ Sistema de auditoria e logs

### Funcionalidades Técnicas
- ✅ Editor de texto rico (TipTap)
- ✅ Sistema de colaboração múltipla
- ✅ API RESTful completa
- ✅ Autenticação JWT
- ✅ Sistema de notificações em tempo real
- ✅ Interface responsiva e moderna
- ✅ Documentação Swagger/OpenAPI

## 🏗️ Arquitetura

### Backend (Spring Boot)
```
backend/
├── src/main/java/com/tessera/backend/
│   ├── config/          # Configurações (Security, JWT, CORS, etc.)
│   ├── controller/      # Controllers REST
│   ├── dto/            # Data Transfer Objects
│   ├── entity/         # Entidades JPA
│   ├── repository/     # Repositórios Spring Data
│   ├── security/       # Configurações de segurança
│   ├── service/        # Lógica de negócio
│   └── util/          # Utilitários
└── src/main/resources/
    ├── application.properties
    └── templates/      # Templates de email
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── store/         # Gerenciamento de estado (Zustand)
│   ├── lib/          # Configurações de API e utilitários
│   ├── Editor/       # Editor de texto rico
│   └── assets/       # Recursos estáticos
├── public/
└── index.html
```

## 🛠️ Tecnologias

### Backend
- **Spring Boot 3.2** - Framework principal
- **Spring Security** - Autenticação e autorização
- **Spring Data JPA** - Persistência de dados
- **MySQL** - Banco de dados
- **JWT** - Autenticação stateless
- **Swagger/OpenAPI** - Documentação da API
- **JavaMail** - Sistema de emails
- **WebSocket** - Notificações em tempo real

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **React Router** - Roteamento
- **React Hook Form** - Gerenciamento de formulários
- **TanStack Query** - Cache e sincronização de dados
- **Zustand** - Gerenciamento de estado
- **TipTap** - Editor de texto rico
- **Axios** - Cliente HTTP

## 📋 Pré-requisitos

### Backend
- Java 17 ou superior
- Maven 3.8 ou superior
- MySQL 8.0 ou superior

### Frontend
- Node.js 18 ou superior
- npm ou yarn

## 🚀 Instalação e Execução

### 1. Configuração do Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE tessera;
CREATE USER 'tessera_user'@'localhost' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON tessera.* TO 'tessera_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configuração do Backend

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd tessera-academica/backend
```

2. **Configure as variáveis de ambiente:**
Copie `.env.example` para `.env` na raiz do projeto backend:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tessera
DB_USERNAME=tessera_user
DB_PASSWORD=senha_segura

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_com_pelo_menos_32_caracteres

# Email (opcional - para funcionalidades de email)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu_email@gmail.com
MAIL_PASSWORD=sua_senha_de_app

# Server
SERVER_PORT=8080
```

3. **Execute o backend:**
```bash
# Usando Maven
./mvnw spring-boot:run

# Ou compile e execute
./mvnw clean package
java -jar target/tessera-backend-0.0.1-SNAPSHOT.jar
```

O backend estará disponível em `http://localhost:8080`

### 3. Configuração do Frontend

1. **Navegue para o diretório frontend:**
```bash
cd ../frontend
```

2. **Instale as dependências:**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente:**
Copie `.env.example` para `.env` na raiz do projeto frontend e ajuste se necessário:
```env
VITE_API_BASE_URL=http://localhost:8080
```

4. **Execute o frontend:**
```bash
npm run dev
# ou
yarn dev
```

O frontend estará disponível em `http://localhost:5173`

## 👤 Usuários Padrão

O sistema cria automaticamente um usuário administrador:

- **Email:** admin@tessera.com
- **Senha:** admin123

Para criar novos usuários (estudantes e orientadores), acesse a página de registro e aguarde aprovação do administrador.

## 📚 Documentação da API

Com o backend executando, acesse:
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

## 🔧 Scripts Disponíveis

### Backend
```bash
# Executar aplicação
./mvnw spring-boot:run

# Executar testes
./mvnw test

# Gerar pacote
./mvnw clean package

# Executar com perfil específico
./mvnw spring-boot:run -Dspring-boot.run.profiles=production
```

### Frontend
```bash
# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🌟 Funcionalidades Detalhadas

### Sistema de Colaboração
- Múltiplos estudantes por documento
- Diferentes tipos de orientadores (principal, co-orientador, externo)
- Sistema de permissões granular
- Papéis: PRIMARY_STUDENT, SECONDARY_STUDENT, PRIMARY_ADVISOR, etc.

### Editor Avançado
- Editor WYSIWYG com TipTap
 - Formatação rica (negrito, itálico, listas, tabelas, subscrito e sobrescrito)
- Inserção de imagens e links
- Histórico de mudanças entre versões
 - Avaliada a adição de recursos de citação e referências, porém ainda não há
   extensão oficial do TipTap disponível

### Sistema de Notificações
- Notificações em tempo real via WebSocket
- Notificações por email
- Configurações personalizáveis por usuário
- Dashboard de notificações

### Auditoria e Segurança
- Log completo de todas as ações
- Autenticação JWT segura
- Rate limiting
- Validação de dados robusta

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no GitHub
- Entre em contato através do email: suporte@tessera.com

## 🚧 Roadmap

### Próximas Funcionalidades
- [ ] Sistema de comentários inline no editor
- [ ] Integração com LaTeX
- [ ] Export para PDF
- [ ] Sistema de templates
- [ ] Análise de plágio
- [ ] Mobile app
- [ ] Integração com sistemas acadêmicos

---

**Tessera Acadêmica** - Transformando a gestão de documentos acadêmicos. 🎓