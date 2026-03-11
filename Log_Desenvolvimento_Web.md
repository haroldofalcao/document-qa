# Log de Desenvolvimento: Sistema Web Interno (Fase 2)

**Data da Atualização:** 10 de Março de 2026

Nesta sessão, realizamos uma evolução significativa na arquitetura e nas funcionalidades do **App Web Interno** em React, transformando-o de um protótipo básico em um sistema robusto e preparado para o fluxo real do hospital.

Abaixo está o registro completo de tudo o que foi construído e refatorado nesta etapa:

### 1. Autenticação e Segurança (Foundation)

* **Integração com Firebase Auth**: Implementamos o login seguro exclusivo via Google.
* **Rotas Privadas**: O sistema agora exige autenticação (`PrivateRoute`). Usuários não logados são barrados e redirecionados para a tela de `Login`.
* **Captura de Dados do Médico**: O formulário de Visitas agora detecta automaticamente o nome e o e-mail do médico logado para assinar o Lançamento, eliminando a necessidade de digitação manual.

### 2. Módulo de Pacientes (Alta e Histórico)

* **Data de Admissão**: O formulário de cadastro de pacientes (`PacienteForm`) agora exige e salva a `data_inicio` no momento da criação.
* **Função "Dar Alta" (Soft Delete)**: O botão "Deletar" foi substituído. Para manter a integridade do histórico financeiro, o sistema não apaga mais o registro do paciente. Em vez disso, altera o status para `alta` e registra a `data_alta`.
* **Filtro Inteligente**: Pacientes que receberam "Alta" deixam de aparecer nas listas suspensas (dropdowns) para registrar novas visitas diárias ou retroativas. No entanto, eles continuam existindo na base de dados para fins de contabilidade e emissão de extratos.

### 3. Módulos de Visitas (Diárias e Retroativas)

* **Lançamento Diário**: O formulário padrão (`VisitaForm`) agora registra automaticamente a `data_hora` atual no banco de dados.
* **Lançamento no Passado**: Criamos um modal específico (`VisitaRetroativaForm`) que permite injetar uma data manual anterior ao dia de hoje, ideal para registrar visitas que esqueceram de ser apontadas no dia correto.

### 4. Controle de Repasses (Refatoração de UX)

* **Fim dos Modais de Pagamento**: Substituímos os pop-ups de edição por seleções dinâmicas (dropdowns) integradas diretamente na tabela.
* **Baixa Instantânea**: O status de repasse agora pode ser classificado rapidamente na própria listagem como **"Em Aberto"**, **"Pago"** ou **"Glosa"**.
* **Automação de Datas**: Ao alterar o status de uma visita para "Pago" ou "Glosa", o sistema capta automaticamente a data do dia para preencher o campo `data_pagamento`.

### 5. Extratos e Relatórios (A Grande Unificação)

* **Design Consolidado (5 Abas)**: Removemos a antiga aba separada de "Extrato" e unificamos tudo em um super **Relatório Consolidado** (`RelatoriosList.jsx`). O menu lateral foi simplificado e atualizado.
* **Filtros Combinados**: A tela de relatórios agora suporta o cruzamento de múltiplos filtros simultâneos:
  * Período Específico (Data Inicial e Data Final).
  * Status Financeiro (Todos, Em Aberto, Pago, Glosa).
  * Tipo de Procedimento (Todos, Enteral, Parenteral, Ambas).
  * Médico Visitador (Lista gerada dinamicamente).
* **Otimização para Impressão e Auditoria**: Implementamos regras de CSS específicas para impressão (`@media print`). Ao clicar no botão **"Imprimir / Salvar PDF"**, o sistema oculta todos os elementos de interface não essenciais (barra lateral, botões, filtros) e gera um layout limpo, com cabeçalho oficial, totalizadores e espaço reservado para assinatura e carimbo do responsável.
