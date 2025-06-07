# Tessera Acadêmica

Tessera Acadêmica é um sistema completo para gestão de documentos acadêmicos. O repositório contém:

- **backend/** – serviço Spring Boot localizado em `backend/com.tessera`.
- **frontend/** – aplicação React + Vite.

## Build

### Backend

```bash
cd backend/com.tessera
./mvnw clean package
```

O artefato gerado fica em `target/`.

### Frontend

```bash
cd frontend
npm install
npm run build
```

Os arquivos de produção ficam em `dist/`.

## Instalação de Dependências para Testes

Antes de executar os testes é necessário baixar todas as dependências do
backend (Maven) e do frontend (npm). O repositório já fornece o Maven Wrapper,
portanto não é preciso ter o Maven instalado localmente.

### Backend

```bash
cd backend/com.tessera
./mvnw -q dependency:go-offline
```

### Frontend

```bash
cd frontend
npm ci
```

Para ambientes offline ou de integração contínua, utilize o script
`scripts/install-dependencies.sh`, que faz o pré-download de todas as
dependências necessárias.

## Execução

1. **Backend**

   Copie `backend/com.tessera/.env.example` para `.env`, ajuste as variáveis (banco de dados, JWT, CORS, etc.) e execute:

   ```bash
   cd backend/com.tessera
   ./mvnw spring-boot:run
   ```

   O serviço inicia em `http://localhost:8080`.
   Defina `ALLOWED_ORIGINS` ou a propriedade `app.cors.allowed-origins` para controlar quais origens podem acessar o backend.

2. **Frontend**

   Copie `frontend/.env.example` para `.env`, defina `VITE_API_BASE_URL` com a URL do backend e rode:

   ```bash
   npm run dev
   ```

  A aplicação ficará acessível em `http://localhost:3000` (porta definida em `vite.config.ts`).

## Running Tests

### Backend

```bash
cd backend/com.tessera && ./mvnw test
```

### Frontend

```bash
cd frontend && npm install && npm test
```

---

Com o backend e o frontend executando, acesse a interface em `http://localhost:3000` e utilize o sistema normalmente.
