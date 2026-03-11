# Plano de Implementação - Ciclo 3 (Visualização Diária e Relatório Limpo)

## Objetivo
1.  Garantir que a lista de visitas no App mostre apenas as visitas do dia atual (reset diário).
2.  Garantir que o relatório por e-mail ignore registros incompletos.

## Mudanças Propostas

### 1. AppSheet (Slice de Visitas Diárias)
Criaremos um filtro (Slice) para que a visualização de "Visitas" carregue apenas os dados onde a data é igual a data de hoje.

*   **Novo Slice:** `Visitas_De_Hoje`
*   **Filtro:** `DATE([Data_Hora]) = TODAY()`
*   **Ação:** Alterar a View principal para ler deste Slice.

### 2. Google Apps Script (Filtro de Relatório)
Atualizaremos o script `Code.gs` para validar se os campos essenciais (Médico, Paciente, Tipo) estão preenchidos antes de adicionar a visita ao relatório.

## Arquivos Afetados
*   `Guia_Ciclo_3.md` (Instruções passo a passo)
*   `Script_Email.gs` (Lógica de validação)
