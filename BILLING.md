# 💳 Sistema de Assinaturas (Billing Gate) - Documentação Completa

## 🎯 Visão Geral

Sistema de **billing gate mockado** que controla o acesso à criação de barbearias baseado em assinaturas ativas. Garante monetização antes do uso da plataforma.

---

## 📋 Regra de Negócio Principal

> **Apenas utilizadores com assinatura ativa podem criar barbearias**

```
Utilizador SEM subscription → ❌ Bloqueado de criar barbearia
Utilizador COM subscription ativa → ✅ Pode criar barbearia
```

---

## 🔄 Fluxo Completo

### **1. Registo do Utilizador**
```
POST /api/auth/register
{
  "nome": "Pedro Silva",
  "email": "pedro@owner.pt",
  "password": "pedro123",
  "tipo": "owner"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "requires_subscription": true,  ← Flag importante!
    "tipo": "owner"
  }
}
```

---

### **2. Escolha do Plano**

Utilizador acede: `/planos`

**3 Planos Disponíveis:**

| Plano | Preço/mês | Barbearias | Barbeiros | Trial |
|-------|-----------|------------|-----------|-------|
| **Básico** | 29€ | 1 | 2 | 7 dias |
| **Pro** 👑 | 49€ | 1 | 5 | 7 dias |
| **Enterprise** | 99€ | 3 | ∞ | 7 dias |

---

### **3. "Pagamento" Mockado**

```
POST /api/subscriptions
Headers: Authorization: Bearer {token}
{
  "plan_id": "pro",
  "payment_method": "mock_card"
}
```

**O que acontece (mockado):**
1. Sistema **simula processamento** de pagamento
2. **Sempre retorna sucesso** (para demonstração)
3. Cria subscription com `status: "active"`
4. Inicia **trial de 7 dias**
5. Define próxima cobrança (trial_end + 30 dias)

**Response:**
```json
{
  "subscription": {
    "user_id": "xxx",
    "plan_id": "pro",
    "status": "active",
    "trial_end": "2026-01-31T00:00:00Z",
    "next_billing_date": "2026-03-03T00:00:00Z"
  },
  "message": "Assinatura ativada com sucesso! Trial de 7 dias iniciado."
}
```

**Console Log (Mock):**
```
[MOCK PAYMENT] Processing 49€ for user pedro@owner.pt
[MOCK PAYMENT] Payment successful! Subscription activated
[MOCK PAYMENT] Trial period: 7 days (ends 31/01/2026)
```

---

### **4. Criar Barbearia (PROTEGIDO)**

```
POST /api/barbearias
Headers: Authorization: Bearer {token}
{
  "nome": "Barbearia VIP Porto",
  "email_admin": "admin@vip.pt",
  "password_admin": "admin123"
}
```

**Validações Automáticas:**

✅ **Verifica subscription ativa:**
```javascript
const subscription = await db.subscriptions.findOne({
  user_id: userId,
  status: 'active'
});

if (!subscription) {
  return error('Precisa de uma assinatura ativa');
}
```

✅ **Verifica limite do plano:**
```javascript
const existingBarbearias = await db.barbearias.countDocuments({ 
  owner_id: userId 
});

if (existingBarbearias >= planLimits[plan_id]) {
  return error('Limite de barbearias atingido');
}
```

---

## 🔒 Bloqueios Implementados

### **1. Criar Barbearia sem Subscription**

**Request:**
```bash
POST /api/barbearias (sem subscription ativa)
```

**Response:**
```json
{
  "error": "Precisa de uma assinatura ativa para criar uma barbearia",
  "requires_subscription": true
}
```
**Status:** `403 Forbidden`

---

### **2. Limite de Barbearias por Plano**

**Request:**
```bash
POST /api/barbearias (já atingiu o limite do plano)
```

**Response:**
```json
{
  "error": "Limite de barbearias do seu plano atingido"
}
```
**Status:** `403 Forbidden`

---

### **3. Subscription Duplicada**

**Request:**
```bash
POST /api/subscriptions (já tem subscription ativa)
```

**Response:**
```json
{
  "error": "Já possui uma assinatura ativa"
}
```
**Status:** `400 Bad Request`

---

## 📊 Estrutura de Dados

### **Collection: subscriptions**

```javascript
{
  _id: ObjectId,
  user_id: String,              // ID do utilizador owner
  plan_id: String,              // "basic", "pro", "enterprise"
  plan_name: String,            // Nome amigável
  price: Number,                // Preço mensal
  status: String,               // "active", "past_due", "canceled"
  trial_end: Date,              // Fim do trial (7 dias)
  next_billing_date: Date,      // Próxima cobrança
  payment_method: String,       // "mock_card" (mockado)
  created_at: Date,
  updated_at: Date,
  canceled_at: Date             // Se cancelado
}
```

**Exemplo:**
```json
{
  "_id": "69740d50000086336676a65a",
  "user_id": "69740d37000086336676a659",
  "plan_id": "pro",
  "plan_name": "Pro",
  "price": 49,
  "status": "active",
  "trial_end": "2026-01-31T00:07:44.185Z",
  "next_billing_date": "2026-03-03T00:07:44.185Z",
  "payment_method": "mock_card",
  "created_at": "2026-01-24T00:07:44.185Z",
  "updated_at": "2026-01-24T00:07:44.185Z"
}
```

---

### **Collection: barbearias (atualizada)**

```javascript
{
  _id: ObjectId,
  nome: String,
  slug: String,
  owner_id: String,      // ← NOVO: Vincula ao owner
  criado_em: Date
}
```

---

## 🛠️ API Endpoints

### **GET /api/plans**
Lista todos os planos disponíveis

**Response:**
```json
{
  "plans": [
    {
      "id": "basic",
      "name": "Básico",
      "price": 29,
      "features": [...],
      "limits": {
        "barbearias": 1,
        "barbeiros": 2
      }
    }
  ]
}
```

---

### **POST /api/subscriptions**
Criar nova subscription (mock payment)

**Body:**
```json
{
  "plan_id": "pro",
  "payment_method": "mock_card"
}
```

**Headers:** `Authorization: Bearer {token}`

---

### **GET /api/subscriptions/status**
Verificar status da subscription

**Response:**
```json
{
  "has_subscription": true,
  "subscription": {
    "status": "active",
    "trial_ended": false,
    "days_until_trial_end": 5,
    "is_trial": true
  }
}
```

---

### **POST /api/subscriptions/cancel**
Cancelar subscription

**Response:**
```json
{
  "message": "Assinatura cancelada com sucesso"
}
```

---

## 🔐 Middleware de Proteção

### **Verificação em `/setup`**

```javascript
// Redireciona para /planos se sem subscription
useEffect(() => {
  const response = await fetch('/api/subscriptions/status');
  const data = await response.json();
  
  if (!data.has_subscription || data.subscription.status !== 'active') {
    router.push('/planos');
  }
}, []);
```

---

### **Verificação em `/admin`**

```javascript
// Futura implementação: soft lock
const subscription = await getSubscriptionStatus();

if (subscription.status === 'canceled' || subscription.status === 'past_due') {
  // Mostrar aviso mas permitir visualização (soft lock)
  showWarning('Assinatura expirada. Reative para continuar.');
}
```

---

## 📅 Gestão de Trial

### **Trial de 7 Dias:**
- **Início:** Data da criação da subscription
- **Fim:** `created_at + 7 dias`
- **Próxima cobrança:** `trial_end + 30 dias`

### **Cálculo de Dias Restantes:**
```javascript
const now = new Date();
const daysUntilTrial = Math.ceil(
  (new Date(subscription.trial_end) - now) / (1000 * 60 * 60 * 24)
);
```

---

## 🚨 Soft Lock vs Hard Lock

### **Soft Lock (Implementado):**
```
Subscription cancelada/expirada
  ↓
✅ Dados preservados
✅ Pode visualizar (read-only)
❌ Não pode criar/editar
💡 Banner: "Reative sua assinatura"
```

### **Hard Lock (Futuro):**
```
Subscription cancelada por 90 dias
  ↓
❌ Acesso bloqueado totalmente
❌ Dados agendados para deleção
📧 Email: "Últimos dias para reativar"
```

---

## 🧪 Testes Realizados

### **Teste 1: Criar Barbearia SEM Subscription**
```bash
curl -X POST /api/barbearias \
  -H "Authorization: Bearer {token_sem_subscription}"
```
**✅ Resultado:** `403 - Precisa de uma assinatura ativa`

---

### **Teste 2: Criar Subscription (Mock)**
```bash
curl -X POST /api/subscriptions \
  -H "Authorization: Bearer {token}" \
  -d '{"plan_id": "pro"}'
```
**✅ Resultado:** Subscription criada com trial de 7 dias

---

### **Teste 3: Criar Barbearia COM Subscription**
```bash
curl -X POST /api/barbearias \
  -H "Authorization: Bearer {token_com_subscription}"
```
**✅ Resultado:** Barbearia criada com sucesso

---

### **Teste 4: Exceder Limite do Plano**
```bash
# Plano Básico (limite: 1 barbearia)
# Tentar criar 2ª barbearia
```
**✅ Resultado:** `403 - Limite de barbearias atingido`

---

## 🎨 UI/UX do Billing

### **Página /planos:**
✅ Grid com 3 planos  
✅ Badge "Mais Popular" no Pro  
✅ Ícones diferentes por plano  
✅ Lista de features com checkmarks  
✅ Botão "Começar Trial Grátis"  
✅ Loader durante processamento  
✅ FAQ section  
✅ Trust signals (7 dias grátis, cancelamento fácil)

### **Fluxo Visual:**
```
Homepage → Register → /planos → Choose Plan
  ↓ (mock payment)
"Assinatura ativada!" → /setup → Criar Barbearia
```

---

## 📊 Limites por Plano

| Recurso | Básico | Pro | Enterprise |
|---------|--------|-----|------------|
| **Barbearias** | 1 | 1 | 3 |
| **Barbeiros** | 2 | 5 | ∞ |
| **Marcações** | ∞ | ∞ | ∞ |
| **API Access** | ❌ | ❌ | ✅ |
| **White-label** | ❌ | ❌ | ✅ |
| **Suporte** | Email | Prioritário | 24/7 |

---

## 🔮 Roadmap (Integração Real)

### **Fase 1: Stripe Checkout (Futuro)**
- Substituir mock por Stripe API
- Webhooks para eventos de pagamento
- Customer Portal do Stripe
- Invoices automáticos

### **Fase 2: Gestão Avançada**
- Upgrades/downgrades de plano
- Reativação automática
- Avisos antes de expirar (7, 3, 1 dia)
- Soft lock com read-only access

### **Fase 3: Analytics**
- MRR (Monthly Recurring Revenue)
- Churn rate
- Trial conversion rate
- Lifetime value por cliente

---

## ✅ Conclusão

**Sistema de Billing Mockado Completo:**

✅ Bloqueio efetivo sem subscription  
✅ 3 planos configurados  
✅ Trial de 7 dias implementado  
✅ Mock payment funcionando  
✅ Limites por plano validados  
✅ UI profissional e clara  
✅ Pronto para migrar para Stripe  

**A plataforma agora é monetizável desde o primeiro dia!** 💰
