# 🎯 Arquitectura Multi-Tenant - Barbearia SaaS

## 🏗️ Visão Geral

Sistema SaaS completo com **arquitectura multi-tenant** onde cada barbearia tem a sua própria URL pública e dados completamente isolados.

---

## 🌐 Sistema de URLs

### **Modelo Implementado: Path-based Multi-Tenant**

Cada barbearia tem uma URL única:
```
plataforma.com/barbearia/{slug}
```

**Exemplo Real:**
```
http://localhost:3000/barbearia/barbearia-premium-lisboa
```

### **Porquê Path-based vs Subdomínio?**

✅ **Path-based** (implementado):
- Não requer configuração DNS
- Funciona em qualquer ambiente
- SEO-friendly desde o início
- Fácil de testar e desenvolver

🔄 **Subdomínio** (futuro):
- Requer wildcard DNS: `*.plataforma.com`
- Melhor para branding
- Certificado SSL wildcard necessário

---

## 🔄 Fluxo Multi-Tenant

### 1️⃣ **Criação de Barbearia (Self-Service)**

```
Dono → /setup → Preenche dados → Cria barbearia
```

**O que acontece:**
1. Sistema gera `slug` único (URL-friendly)
2. Cria conta admin automaticamente
3. Configura horários padrão
4. Retorna URL pública: `/barbearia/{slug}`

**Exemplo:**
- Nome: "Barbearia Premium Lisboa"
- Slug gerado: `barbearia-premium-lisboa`
- URL: `/barbearia/barbearia-premium-lisboa`

---

### 2️⃣ **Cliente Acede Directamente ao Tenant**

```
Cliente → /barbearia/{slug} → Vê página pública da barbearia
```

**O que o cliente vê:**
- ✅ Nome e descrição da barbearia
- ✅ Lista de serviços com preços
- ✅ Equipa de barbeiros
- ✅ Produtos disponíveis
- ✅ Botão "Marcar Agora"

**Sem selecção manual!** O contexto está na URL.

---

### 3️⃣ **Registo Automático no Tenant**

Quando o cliente clica em "Marcar Agora":

```mermaid
Cliente não autenticado → Modal de Auth → Registar
  ↓
Sistema associa automaticamente ao tenant (barbearia_id)
  ↓
Cliente fica no contexto da barbearia
  ↓
Abre formulário de marcação
```

**Código de exemplo:**
```javascript
// No registo, barbearia_id é passado automaticamente
const body = {
  nome,
  email,
  password,
  tipo: 'cliente',
  barbearia_id: barbearia._id  // ← Contexto automático!
};
```

---

### 4️⃣ **Isolamento de Dados**

**Princípio:** Cada query filtra por `barbearia_id`

```javascript
// Buscar serviços
db.servicos.find({ barbearia_id: "xxx" })

// Buscar marcações
db.marcacoes.find({ barbearia_id: "xxx" })

// Buscar barbeiros
db.utilizadores.find({ 
  barbearia_id: "xxx",
  tipo: "barbeiro"
})
```

✅ **Total isolamento entre tenants**  
✅ **Zero possibilidade de vazamento de dados**

---

## 📁 Estrutura de Rotas

```
/                           # Landing page (marketing)
├── /setup                  # Criar nova barbearia (público)
├── /admin                  # Painel admin (protegido)
├── /barbeiro               # Painel barbeiro (protegido)
├── /cliente                # Painel cliente (protegido)
└── /barbearia/{slug}       # Página pública da barbearia ⭐
    ├── Hero section
    ├── Serviços
    ├── Equipa
    ├── Produtos
    └── Sistema de marcação (com auth integrado)
```

---

## 🔐 Fluxo de Autenticação no Tenant

### **Para Clientes Novos:**
```
1. Acede /barbearia/{slug}
2. Clica "Marcar Agora"
3. Modal aparece com tabs: Login | Registar
4. Preenche registo → Sistema associa ao tenant
5. Abre formulário de marcação automaticamente
```

### **Para Clientes Existentes:**
```
1. Acede /barbearia/{slug}
2. Clica "Marcar Agora"
3. Modal aparece
4. Faz login
5. Abre formulário de marcação
```

### **Para Clientes já Autenticados:**
```
1. Acede /barbearia/{slug}
2. Vê botão extra: "Meu Painel"
3. Clica "Marcar Agora" → Vai directo ao formulário
```

---

## 🎨 UX no Tenant

### **Sem Fricção:**
- ❌ Não pede para "seleccionar barbearia"
- ❌ Não mostra lista de barbearias
- ❌ Não há dropdowns desnecessários

### **Contexto Automático:**
- ✅ Cliente sabe em que barbearia está (logo/nome)
- ✅ Só vê serviços/barbeiros daquela barbearia
- ✅ Marcação directa sem passos extra

---

## 📊 Vantagens da Arquitectura

### **Para o Negócio:**
1. **Escalabilidade:** Adicionar N barbearias não afecta performance
2. **SEO:** Cada barbearia tem URL única indexável
3. **White-label:** Barbearia pode partilhar o seu link
4. **Analytics:** Tracking independente por tenant

### **Para o Dono da Barbearia:**
1. **Branding:** URL própria para marketing
2. **Simplicidade:** Clientes acedem directamente
3. **Profissional:** Parece um site dedicado

### **Para o Cliente:**
1. **Rapidez:** Zero passos extra
2. **Clareza:** Sempre sabe onde está
3. **Confiança:** URL clara e específica

---

## 🔒 Segurança Multi-Tenant

### **Isolamento de Dados:**
```javascript
// Todas as queries incluem barbearia_id
const servicos = await db.servicos.find({
  barbearia_id: tenant_id  // ← Filtro obrigatório
});
```

### **Validação de Permissões:**
```javascript
// Admin só pode gerir a sua barbearia
if (decoded.tipo === 'admin' && decoded.barbearia_id !== barbeariaId) {
  return error('Acesso negado');
}
```

### **Protecção de Rotas:**
- `/admin` → Só admin do tenant
- `/barbeiro` → Só barbeiro do tenant
- `/cliente` → Cliente de qualquer tenant
- `/barbearia/{slug}` → Público

---

## 🚀 Exemplo de Fluxo Completo

### **Cenário: Nova Barbearia**

```
PASSO 1: Criar Barbearia
  Pedro → /setup
  Preenche: "Barbas & Estilos Porto"
  Sistema gera slug: "barbas-estilos-porto"
  URL criada: /barbearia/barbas-estilos-porto
  ✅ Pedro é admin

PASSO 2: Configurar (Pedro como Admin)
  Pedro → Login → /admin
  Adiciona barbeiro: João
  Cria serviços: Corte (15€), Barba (10€)
  Configura horários: Seg-Sex 10h-20h

PASSO 3: Cliente Final
  Ana encontra link: /barbearia/barbas-estilos-porto
  Vê serviços e preços
  Clica "Marcar Agora"
  Regista-se (automático para tenant)
  Escolhe: João, Corte, Amanhã 15h
  ✅ Marcação confirmada

PASSO 4: Barbeiro
  João → Login → /barbeiro
  Vê marcação de Ana na agenda
  ✅ Atende no horário
```

---

## 📈 Métricas por Tenant

Cada barbearia tem as suas próprias:
- Total de marcações
- Receita gerada
- Serviços mais populares
- Horários de pico
- Taxa de cancelamento

**Isolamento total de dados analytics também!**

---

## 🔮 Futuro: Subdomínios

**Plano para Fase 2:**

Permitir que barbearias tenham:
```
barbas-estilos.plataforma.com
```

**Requisitos técnicos:**
- Wildcard DNS: `*.plataforma.com → IP`
- Wildcard SSL: `*.plataforma.com`
- Lógica de routing por Host header
- Manter compatibilidade com path-based

**Vantagens extra:**
- Branding mais forte
- Domain próprio possível
- URLs mais curtas

---

## 🎯 Conclusão

✅ **Arquitectura multi-tenant completa**  
✅ **URL única por barbearia**  
✅ **Isolamento total de dados**  
✅ **Zero fricção para o cliente final**  
✅ **Self-service para donos de barbearias**  
✅ **Escalável para milhares de tenants**  

**A plataforma está pronta para crescer!** 🚀
