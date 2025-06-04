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

## Execução

1. **Backend**

   Copie `backend/com.tessera/.env.example` para `.env`, ajuste as variáveis (banco de dados, JWT, etc.) e execute:

   ```bash
   cd backend/com.tessera
   ./mvnw spring-boot:run
   ```

   O serviço inicia em `http://localhost:8080`.

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
