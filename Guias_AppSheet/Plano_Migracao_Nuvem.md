# Plano de Migração: AppSheet para Nuvem (Custom Code)

Este documento detalha a arquitetura, as dependências, a estrutura de banco de dados e os aspectos de segurança necessários para migrar o atual sistema "Gestão de Visitas Médicas" do AppSheet para uma plataforma web / PWA (Progressive Web App) baseada em código próprio e hospedada na nuvem.

## 1. Arquitetura e Stack Tecnológico (Dependências)

A escolha das tecnologias visa garantir baixo custo inicial, altíssima escalabilidade, segurança de dados hospitalares e facilidade de manutenção.

### 1.1 Frontend (Interface do Usuário)
*   **Framework:** **Next.js (React)**. É o padrão da indústria para aplicações web modernas. Permite criar uma PWA (Progressive Web App), o que significa que os médicos poderão instalar a aplicação na tela inicial do celular (iOS/Android) sem precisar passar pela App Store ou Google Play.
*   **Estilização:** **Tailwind CSS** + **shadcn/ui**. Componentes bonitos, acessíveis e fáceis de customizar para dar uma cara limpa e profissional ao sistema médico.
*   **Relatórios e Exportações:** Bibliotecas como `jspdf` (para gerar PDFs complexos do Extrato no próprio navegador) e `papaparse` ou geradores nativos para baixar arquivos CSV perfeitamente formatados.

### 1.2 Backend e Banco de Dados (BaaS)
*   **Plataforma:** **Supabase**. É a melhor alternativa de código aberto ao Firebase. Ele fornece um banco de dados relacional **PostgreSQL**, que é perfeito para relacionar "Visitas" com "Pacientes" (o que o AppSheet fazia por baixo dos panos).
*   **Armazenamento (Storage):** O próprio Supabase possui storage seguro, caso no futuro seja necessário anexar guias médicas ou documentos em PDF nas visitas.

### 1.3 Hospedagem (Cloud Hosting)
*   **Frontend:** **Vercel**. Hospedagem na nuvem otimizada para Next.js. Gratuita para projetos iniciais e escala automaticamente.
*   **Backend:** **Supabase Cloud**. Gerencia o banco de dados e a autenticação, com backups automáticos na nuvem.

---

## 2. Estrutura do Banco de Dados (PostgreSQL)

O banco de dados relacional (PostgreSQL) substituirá as abas do Google Sheets. A estrutura ficará muito mais rígida e segura contra exclusões acidentais.

### Tabela: `pacientes`
Substitui a aba "Pacientes" do Sheets.
*   `id` (UUID, Primary Key, gerado automaticamente - substitui UNIQUEID)
*   `prontuario` (Texto/Varchar, Único)
*   `nome` (Texto/Varchar, Obrigatório)
*   `rg` (Texto/Varchar)
*   `status` (Enum: 'Ativo', 'Alta', padrão: 'Ativo')
*   `user_id` (UUID, Foreign Key) -> *Ver seção de segurança*.
*   `created_at` (Timestamp)

### Tabela: `visitas`
Substitui a aba "Visitas" do Sheets.
*   `id` (UUID, Primary Key, gerado automaticamente)
*   `paciente_id` (UUID, Foreign Key referenciando `pacientes.id`) -> *Garante que uma visita nunca exista sem um paciente válido*.
*   `data_hora` (Timestamp/Timestamptz, Obrigatório)
*   `tipo` (Enum: 'E', 'P', 'EP')
*   `status_pagamento` (Enum: 'Em aberto', 'Pago', 'Glosa')
*   `data_pagamento` (Date, Nulo permitido)
*   `observacoes` (Texto/Text)
*   `medico_id` (UUID, Foreign Key referenciando a tabela de usuários logados).
*   `created_at` (Timestamp)

*Nota: A aba "Filtros" que criamos no AppSheet deixa de existir. Em uma aplicação real baseada em React, os filtros do "Extrato" são variavéis de estado na memória do navegador do usuário, não ocupando espaço no banco de dados e permitindo que múltiplos usuários filtrem dados diferentes ao mesmo tempo sem colidir.*

---

## 3. Segurança e Controle de Acesso (Compliance)

Como estamos lidando com dados de pacientes, a segurança não pode depender de um "link oculto" no Google Sheets.

1.  **Autenticação (Login):**
    *   Todos os médicos/operadores precisarão de login com e-mail e senha (gerenciado pelo **Supabase Auth**).
    *   Opção de "Login com Google" para facilitar o acesso de quem já usava o AppSheet.

2.  **Row Level Security (RLS no PostgreSQL):**
    *   Esta é a camada vital de segurança que o Supabase oferece.
    *   **Regra 1 (Visibilidade Limitada):** Um médico padrão (Role: Doutor) só pode fazer `SELECT`, `INSERT` e `UPDATE` em registros da tabela `visitas` onde o `medico_id` seja igual ao próprio ID logado dele. Ele não consegue ler pacientes ou faturamentos de outros profissionais.
    *   **Regra 2 (Administrativo):** Um usuário administrador (Role: Admin) pode ver a tabela de todos para calcular os repasses gerais no Dashboard do Extrato.
    *   Mesmo que um hacker descubra as credenciais de banco de dados do frontend, o RLS no servidor barra qualquer extração de dados não autorizada.

3.  **Ambiente e Variáveis (.env):**
    *   Chaves de banco de dados e APIs privadas jamais ficam no código. Elas são injetadas diretamente na nuvem (na Vercel) de forma criptografada.

---

## 4. Fases de Implementação sugeridas

### Fase 1: Fundação
*   Criar repositório Git.
*   Configurar projeto Next.js + Tailwind.
*   Criar e configurar o projeto no Supabase (Rodar os scripts SQL para criar as tabelas `pacientes` e `visitas` e ativar o RLS).

### Fase 2: Front-end e Autenticação
*   Criar tela de Login/Cadastro.
*   Desenvolver o Layout Base (Menu lateral, cabeçalho, navegação móvel).

### Fase 3: CRUD Principal (O Core do App)
*   **Pacientes:** Tela de lista (com busca por RG/Nome) e formulário de cadastro/edição (dando Alta).
*   **Visitas:** Formulário de nova visita (com select inteligente buscando pacientes ativos da base) e lista de diário do médico.

### Fase 4: O "Extrato" (Dashboard Financeiro)
*   Tela de relatórios com seletores de Data Inicial / Data Final e Status.
*   Busca assíncrona no Supabase para montar a tabela dinamicamente.
*   Botões nativos para Exportar CSV e Gerar PDF formatado.

### Fase 5: Migração de Dados
*   Exportar toda a base de dados oficial do Google Sheets do usuário em formato `.csv`.
*   Fazer upload (upload massivo) dos arquivos CSV para o Supabase, garantindo que os IDs antigos se mantenham para não quebrar o relacionamento entre visitas passadas e pacientes.

### Fase 6: Deploy
*   Subir a aplicação de Produção na Vercel.
*   Criação dos logins oficiais da clínica/médicos.
*   Substituição do AppSheet pela PWA nos celulares.
