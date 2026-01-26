# 🧪 Informações de Teste - Barbearia SaaS

## ✅ Estado Actual do Sistema

### Ambiente
- ✅ Next.js rodando em: http://localhost:3000
- ✅ MongoDB: Conectado e funcional
- ✅ API Routes: Todas funcionais

---

## 👥 Credenciais de Teste

### 🔑 Barbearia Criada
**Nome:** Barbearia Premium Lisboa  
**Slug:** `barbearia-premium-lisboa`  
**Descrição:** A melhor barbearia tradicional de Lisboa

---

### 👨‍💼 Admin (Dono da Barbearia)
```
Email: admin@premium.pt
Password: admin123
Acesso: http://localhost:3000/admin
```

**Permissões:**
- ✅ Ver todas as marcações
- ✅ Adicionar/remover barbeiros
- ✅ Gerir serviços e produtos
- ✅ Configurar horários de funcionamento

---

### 💇‍♂️ Barbeiro
```
Email: joao@premium.pt
Password: barbeiro123
Nome: João Silva
Acesso: http://localhost:3000/barbeiro
```

**Permissões:**
- ✅ Ver marcações pessoais
- ✅ Vista semanal organizada

---

### 👤 Cliente
```
Email: carlos@cliente.pt
Password: cliente123
Nome: Carlos Mendes
Acesso: http://localhost:3000/cliente
```

**Permissões:**
- ✅ Fazer marcações online
- ✅ Ver histórico de marcações

---

## 📋 Dados de Teste Criados

### Serviços Disponíveis
1. **Corte de Cabelo** - 15.00€ - 30 min
2. **Corte + Barba** - 25.00€ - 45 min
3. **Barbear Tradicional** - 12.00€ - 30 min

### Marcação Exemplo
- **Cliente:** Carlos Mendes
- **Barbeiro:** João Silva
- **Serviço:** Corte de Cabelo
- **Data:** 24/01/2026
- **Hora:** 10:00
- **Status:** Confirmada
- **Preço:** 15.00€

---

## 🕐 Horários de Funcionamento

| Dia | Horário | Status |
|-----|---------|--------|
| Segunda-feira | 09:00 - 19:00 | ✅ Aberto |
| Terça-feira | 09:00 - 19:00 | ✅ Aberto |
| Quarta-feira | 09:00 - 19:00 | ✅ Aberto |
| Quinta-feira | 09:00 - 19:00 | ✅ Aberto |
| Sexta-feira | 09:00 - 19:00 | ✅ Aberto |
| Sábado | 09:00 - 19:00 | ✅ Aberto |
| Domingo | - | ❌ Fechado |

---

## 🧪 Testes Realizados

### ✅ Autenticação
- [x] Registo de novos utilizadores
- [x] Login com email/password
- [x] JWT token generation
- [x] Redirecionamento baseado em tipo de user
- [x] Protecção de rotas

### ✅ Sistema de Marcações
- [x] Geração automática de slots disponíveis
- [x] Prevenção de marcações duplicadas
- [x] Confirmação automática
- [x] Filtro por barbeiro e data
- [x] Cálculo dinâmico baseado em duração de serviço

### ✅ Painéis de Utilizador
- [x] Admin: Todas as funcionalidades
- [x] Barbeiro: Vista semanal de marcações
- [x] Cliente: Criar e ver marcações

### ✅ CRUD Operações
- [x] Barbeiros: Create, Read, Delete
- [x] Serviços: Create, Read, Update, Delete
- [x] Produtos: Create, Read, Update, Delete
- [x] Horários: Update

### ✅ UI/UX
- [x] Design responsivo
- [x] Dark theme premium
- [x] Componentes Shadcn/UI
- [x] Navegação entre painéis
- [x] Loading states
- [x] Error handling

---

## 📊 Performance

- **Tempo de resposta API:** ~50-200ms
- **Login:** ~170-200ms
- **Listagem de marcações:** ~10-70ms
- **Geração de slots:** ~8-20ms

---

## 🚀 Como Testar Rapidamente

### 1. Testar como Admin
```bash
# Navegar para:
http://localhost:3000

# Fazer login com:
admin@premium.pt / admin123

# Experimentar:
- Adicionar novo barbeiro
- Criar novo serviço
- Ajustar horários de funcionamento
- Ver marcações
```

### 2. Testar como Cliente
```bash
# Navegar para:
http://localhost:3000

# Fazer login com:
carlos@cliente.pt / cliente123

# Experimentar:
- Criar nova marcação
- Selecionar barbeiro e serviço
- Escolher data e hora
- Ver histórico
```

### 3. Testar como Barbeiro
```bash
# Navegar para:
http://localhost:3000

# Fazer login com:
joao@premium.pt / barbeiro123

# Experimentar:
- Ver marcações da semana
- Ver detalhes de clientes
```

### 4. Criar Nova Barbearia
```bash
# Navegar para:
http://localhost:3000/setup

# Preencher formulário com novos dados
```

---

## 🔍 Verificações de Qualidade

### ✅ Funcionalidades Core
- [x] Multi-tenant (isolamento de dados por barbearia)
- [x] Sistema de autenticação robusto
- [x] Geração inteligente de horários
- [x] Prevenção de conflitos de marcações
- [x] Gestão completa de serviços

### ✅ Segurança
- [x] Passwords hasheadas (bcrypt)
- [x] JWT tokens com expiração (7 dias)
- [x] Protecção de rotas por tipo de utilizador
- [x] Validação de permissões em API routes

### ✅ UX/UI
- [x] Interface intuitiva
- [x] Feedback visual imediato
- [x] Cores e contraste adequados
- [x] Design profissional

---

## 📝 Notas Importantes

### Sistema de Notificações
- **Status:** MOCKADO
- **Estrutura:** Preparada para Resend
- **Log:** Console mostra emails que seriam enviados
- **Exemplo:** `[MOCK EMAIL] Marcação confirmada para carlos@cliente.pt em 2026-01-24 às 10:00`

### Variáveis de Ambiente
- `JWT_SECRET`: Configurado (mudar em produção)
- `RESEND_API_KEY`: Vazio (preparado para integração futura)
- `MONGO_URL`: Configurado e funcional

---

## 🎯 Próximos Passos Sugeridos

1. **Testar criação de múltiplas marcações**
2. **Testar conflitos de horários**
3. **Adicionar mais barbeiros**
4. **Criar produtos**
5. **Ajustar horários e testar impacto nos slots**
6. **Criar segunda barbearia para testar multi-tenant**

---

**Última Actualização:** 23 de Janeiro de 2026  
**Versão:** 1.0.0 (MVP Core Completo)

---

## Testing Protocol

### Communication Protocol with Testing Sub-agent
When the testing agent is invoked, the main agent should:
1. Provide clear context about what needs to be tested
2. Share relevant credentials and API endpoints
3. Wait for the testing agent to complete and report back
4. Review findings and implement necessary fixes

### Backend Testing Instructions

#### Feature: Multi-Location Management (Locais) - ✅ TESTED & WORKING

**New Endpoints to Test:**
1. `GET /api/locais` - List all locations for the barbershop (admin only) - ✅ WORKING
2. `POST /api/locais` - Create a new location (admin only) - ✅ WORKING (Plan limits enforced)
3. `PUT /api/locais/:id` - Update a location (admin only) - ✅ WORKING
4. `DELETE /api/locais/:id` - Delete/deactivate a location (admin only) - ✅ WORKING

**Test Credentials:**
- Admin: admin@teste.pt / admin123 - ✅ WORKING

**Test Results (8/8 tests passed - 100% success rate):**
- ✅ Admin authentication working correctly
- ✅ Unauthorized access properly rejected (401)
- ✅ GET /api/locais returns locations list with stats
- ✅ POST /api/locais correctly enforces plan limits (Básico plan: 1 location max)
- ✅ GET /api/locais/:id returns location details with barber count
- ✅ PUT /api/locais/:id successfully updates location data
- ✅ DELETE /api/locais/:id performs soft delete (sets ativo: false)
- ✅ Invalid location IDs return proper 404 errors

**Verified Behavior:**
- ✅ Admin can list, edit and delete locations
- ✅ Each location has: nome, morada, telefone, email, horarios (per day)
- ✅ Locations respect plan limits (limite_barbearias) - "Básico" plan allows 1 location
- ✅ Locations can be activated/deactivated via soft delete
- ✅ API returns total barbeiros count for each location
- ✅ Plan upgrade prompts work correctly when limits reached
- ✅ Proper validation and error handling for all endpoints

**Current Location in System:**
- "Loja Centro" (ID: 697750282d47e4d96049cb26) - Active with 0 barbers

**Example Location Data:**
```json
{
  "nome": "Loja Centro",
  "morada": "Rua Principal, 123 - Lisboa",
  "telefone": "+351 21 123 4567",
  "email": "centro@barbearia.pt",
  "horarios": {
    "segunda": {"aberto": true, "abertura": "09:00", "fecho": "19:00"},
    "terca": {"aberto": true, "abertura": "09:00", "fecho": "19:00"},
    "quarta": {"aberto": true, "abertura": "09:00", "fecho": "19:00"},
    "quinta": {"aberto": true, "abertura": "09:00", "fecho": "19:00"},
    "sexta": {"aberto": true, "abertura": "09:00", "fecho": "19:00"},
    "sabado": {"aberto": true, "abertura": "09:00", "fecho": "17:00"},
    "domingo": {"aberto": false, "abertura": "09:00", "fecho": "13:00"}
  }
}
```

**Testing Agent Notes:**
- All CRUD operations working correctly
- Plan limits properly enforced - prevents creating more locations than plan allows
- Soft delete implementation working (sets ativo: false instead of hard delete)
- Proper authentication and authorization checks in place
- Error handling and validation working as expected
- API responses include proper data structures and status codes

---

#### Legacy: Manual Booking Feature

**Endpoints:**
1. `POST /api/clientes/manual` - Create manual client (admin/barbeiro only)
2. `POST /api/marcacoes/manual` - Create manual booking (admin/barbeiro only)

**Test Credentials:**
- Admin: admin@premium.pt / admin123
- Barbeiro: joao@premium.pt / barbeiro123

**Expected Behavior:**
- Admin can create clients and bookings for any barber
- Barber can create clients and bookings only for themselves
- Manual bookings start with status 'aceita'
- Manual clients have `criado_manualmente: true` flag
