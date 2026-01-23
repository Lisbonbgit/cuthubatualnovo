# 💈 Barbearia SaaS - Sistema de Gestão de Barbearias

Uma plataforma SaaS completa para barbearias em Portugal com **arquitectura multi-tenant**, permitindo gestão de marcações, serviços, produtos e equipa.

## 🌟 Arquitectura Multi-Tenant

**Cada barbearia tem a sua própria URL pública:**
```
/barbearia/{slug}
```

**Exemplo:** `/barbearia/barbearia-premium-lisboa`

✅ **Isolamento total de dados**  
✅ **Zero fricção para clientes**  
✅ **Self-service para donos**  
✅ **SEO-friendly**

📖 **[Ver documentação completa Multi-Tenant →](MULTI_TENANT.md)**

---

## 🚀 Funcionalidades Principais

### ✅ Implementado (MVP Core)

#### 🌐 Arquitectura Multi-Tenant
- ✅ Cada barbearia tem URL própria: `/barbearia/{slug}`
- ✅ Isolamento total de dados por tenant
- ✅ Registo automático de clientes no contexto da barbearia
- ✅ Sistema self-service para criação de barbearias
- ✅ Página pública completa por barbearia

#### 🔐 Sistema de Autenticação
- **3 Tipos de Utilizadores:**
  - **Admin (Dono da Barbearia)**: Gestão completa
  - **Barbeiro**: Visualização e gestão de marcações pessoais
  - **Cliente**: Fazer marcações online

#### 📅 Sistema de Marcações (CORE)
- ✅ Geração automática de horários disponíveis
- ✅ Prevenção de marcações duplicadas
- ✅ Confirmação automática de marcações
- ✅ Sistema de horários de funcionamento por dia da semana
- ✅ Cálculo dinâmico de slots baseado na duração dos serviços
- ✅ Notificações mockadas (estrutura preparada)

#### 👨‍💼 Painel Admin
- ✅ Visualizar todas as marcações da barbearia
- ✅ Adicionar/remover barbeiros
- ✅ CRUD completo de serviços (nome, preço, duração)
- ✅ CRUD completo de produtos
- ✅ Gestão de horários de funcionamento
- ✅ Interface com tabs organizado

#### 💇‍♂️ Painel Barbeiro
- ✅ Visualizar marcações pessoais
- ✅ Vista semanal organizada por calendário
- ✅ Detalhes de cliente, serviço, duração e preço

#### 👤 Painel Cliente
- ✅ Criar novas marcações
- ✅ Selecionar barbeiro e serviço
- ✅ Ver horários disponíveis em tempo real
- ✅ Visualizar histórico de marcações

#### 🎨 Design
- ✅ Dark theme premium com cores douradas/âmbar
- ✅ Layout responsivo mobile-first
- ✅ Componentes Shadcn/UI
- ✅ Imagem de hero profissional

---

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 (App Router), React 18
- **Styling**: Tailwind CSS + Shadcn/UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Autenticação**: JWT (jsonwebtoken + bcryptjs)
- **Arquitectura**: Multi-tenant path-based
- **Notificações**: Estrutura preparada para Resend (mockado)

---

## 📁 Estrutura do Projeto

```
/app
├── app/
│   ├── page.js                       # Landing page (marketing)
│   ├── setup/page.js                 # Criar nova barbearia
│   ├── barbearia/[slug]/page.js      # Página pública do tenant ⭐
│   ├── admin/page.js                 # Painel administrativo
│   ├── barbeiro/page.js              # Painel do barbeiro
│   ├── cliente/page.js               # Painel do cliente
│   ├── layout.js                     # Layout principal
│   ├── globals.css                   # Estilos globais
│   └── api/[[...path]]/route.js      # API Routes (todas as rotas)
├── components/ui/                    # Componentes Shadcn
├── lib/                              # Utilitários
├── .env                              # Variáveis de ambiente
├── README.md                         # Documentação principal
├── MULTI_TENANT.md                   # Documentação arquitectura ⭐
└── package.json
```

---

## 🚀 Como Usar

### 1️⃣ Criar uma Nova Barbearia (Self-Service)

1. Acede a `/setup` ou clica em "Criar Minha Barbearia"
2. Preenche:
   - Nome da barbearia
   - Descrição (opcional)
   - Email do administrador
   - Palavra-passe do administrador
3. A barbearia será criada automaticamente com:
   - Conta de admin
   - URL pública única: `/barbearia/{slug}`
   - Horários padrão (Segunda a Sábado: 09:00-19:00)
   - Domingo fechado

**Exemplo:**
- Nome: "Barbas & Estilos Porto"
- URL gerada: `/barbearia/barbas-estilos-porto`

---

### 2️⃣ Configuração pelo Admin

1. **Login Admin:**
   - Acede à página inicial e faz login

2. **Configurar no Painel:**
   - **Adicionar Barbeiros:** Tab "Barbeiros" → "Adicionar Barbeiro"
   - **Criar Serviços:** Tab "Serviços" → Nome, preço (€) e duração (min)
   - **Adicionar Produtos:** Tab "Produtos" → Nome, preço e descrição
   - **Ajustar Horários:** Tab "Horários" → Configurar dias e horários

---

### 3️⃣ Clientes Finais (Marcação Online)

1. **Cliente acede directamente à URL pública:**
   ```
   /barbearia/{slug}
   ```

2. **Vê página da barbearia:**
   - Serviços com preços
   - Equipa de barbeiros
   - Produtos (opcional)

3. **Faz marcação:**
   - Clica "Marcar Agora"
   - Regista-se (automático para aquela barbearia)
   - Escolhe barbeiro, serviço, data e hora
   - Confirma marcação

**Zero fricção!** O cliente não precisa "seleccionar" a barbearia.

---

### 4️⃣ Barbeiros (Gestão de Agenda)

1. **Login como Barbeiro:**
   - Acede à página inicial com credenciais

2. **Visualizar Agenda:**
   - Vista semanal organizada
   - Detalhes: cliente, serviço, duração, preço

---

## 🌐 URLs da Plataforma

```
/                                    # Landing page (marketing)
/setup                               # Criar nova barbearia
/barbearia/{slug}                    # Página pública da barbearia ⭐
/admin                               # Painel admin (protegido)
/barbeiro                            # Painel barbeiro (protegido)
/cliente                             # Painel cliente (protegido)
```

**Exemplo real:**
```
http://localhost:3000/barbearia/barbearia-premium-lisboa
```

---

## 📊 Estrutura da Base de Dados MongoDB

### Collections:

#### `barbearias`
```javascript
{
  _id: ObjectId,
  nome: String,
  slug: String,           // URL-friendly
  descricao: String,
  logo: String | null,
  criado_em: Date
}
```

#### `utilizadores`
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,        // bcrypt hash
  nome: String,
  tipo: String,            // "admin" | "barbeiro" | "cliente"
  barbearia_id: String,
  criado_em: Date
}
```

#### `servicos`
```javascript
{
  _id: ObjectId,
  nome: String,
  preco: Number,           // em euros
  duracao: Number,         // em minutos
  barbearia_id: String,
  criado_em: Date
}
```

#### `produtos`
```javascript
{
  _id: ObjectId,
  nome: String,
  preco: Number,
  descricao: String,
  imagem: String,          // URL da imagem
  barbearia_id: String,
  criado_em: Date
}
```

#### `marcacoes`
```javascript
{
  _id: ObjectId,
  cliente_id: String,
  barbeiro_id: String,
  servico_id: String,
  barbearia_id: String,
  data: String,            // YYYY-MM-DD
  hora: String,            // HH:MM
  status: String,          // "confirmada" | "cancelada"
  criado_em: Date
}
```

#### `horarios_funcionamento`
```javascript
{
  _id: ObjectId,
  barbearia_id: String,
  dia_semana: String,      // "segunda", "terca", etc.
  hora_inicio: String,     // "09:00"
  hora_fim: String,        // "19:00"
  ativo: Boolean
}
```

---

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registar novo utilizador
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter utilizador actual (requer token)

### Barbearias
- `POST /api/barbearias` - Criar nova barbearia
- `GET /api/barbearias/:slug` - Obter dados públicos da barbearia

### Barbeiros (Admin apenas)
- `POST /api/barbeiros` - Adicionar barbeiro
- `GET /api/barbeiros` - Listar barbeiros
- `DELETE /api/barbeiros/:id` - Remover barbeiro

### Serviços
- `POST /api/servicos` - Criar serviço (Admin)
- `GET /api/servicos` - Listar serviços
- `PUT /api/servicos/:id` - Actualizar serviço (Admin)
- `DELETE /api/servicos/:id` - Remover serviço (Admin)

### Produtos
- `POST /api/produtos` - Criar produto (Admin)
- `GET /api/produtos` - Listar produtos
- `PUT /api/produtos/:id` - Actualizar produto (Admin)
- `DELETE /api/produtos/:id` - Remover produto (Admin)

### Marcações
- `POST /api/marcacoes` - Criar marcação
- `GET /api/marcacoes` - Listar marcações (filtrado por tipo de user)
- `GET /api/marcacoes/slots` - Obter horários disponíveis
- `PUT /api/marcacoes/:id` - Actualizar status da marcação

### Horários
- `POST /api/horarios` - Actualizar horários (Admin)
- `GET /api/horarios` - Obter horários de funcionamento

---

## 🔒 Variáveis de Ambiente

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# JWT Secret (mudar em produção!)
JWT_SECRET=barbearia_saas_super_secret_key_change_in_production

# Resend API Key (preparado para futuro)
RESEND_API_KEY=
```

---

## 🎨 Design System

### Cores Principais
- **Background**: `zinc-950` (preto profundo)
- **Cards**: `zinc-800` / `zinc-900`
- **Accent**: `amber-600` (dourado)
- **Text**: `white` / `zinc-300` / `zinc-400`
- **Borders**: `zinc-700`

### Tipografia
- Font: Inter (via Google Fonts)
- Tamanhos: Baseado em classes Tailwind

---

## 📝 Próximas Funcionalidades (Roadmap)

### Fase 2 - Melhorias
- [ ] Página pública individual por barbearia (`/barbearia/[slug]`)
- [ ] Catálogo de produtos na página pública
- [ ] Planos mensais/assinaturas
- [ ] Sistema de promoções
- [ ] Estatísticas e dashboard

### Fase 3 - Integrações
- [ ] Integração real com Resend (emails)
- [ ] Sistema de pagamentos (Stripe/MB Way)
- [ ] Notificações WhatsApp
- [ ] Upload de imagens (logo, produtos)

### Fase 4 - Extras
- [ ] Sistema de avaliações
- [ ] Programa de fidelidade
- [ ] Multi-idioma (EN, ES)
- [ ] App mobile (React Native)

---

## 🧪 Como Testar

### Fluxo Completo:

1. **Criar Barbearia:**
   ```bash
   curl -X POST http://localhost:3000/api/barbearias \
     -H "Content-Type: application/json" \
     -d '{
       "nome": "Test Barbearia",
       "email_admin": "admin@test.pt",
       "password_admin": "admin123"
     }'
   ```

2. **Login Admin:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@test.pt", "password": "admin123"}'
   ```

3. **Adicionar Barbeiro, Serviços e testar marcações**

---

## 📄 Licença

Propriedade privada - Todos os direitos reservados.

---

## 👨‍💻 Desenvolvido Por

Sistema desenvolvido para barbearias em Portugal.

**Versão**: 1.0.0 (MVP)  
**Data**: Janeiro 2026
