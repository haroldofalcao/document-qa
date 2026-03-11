# Guia Ciclo 6: Controle de Repasses e Reorganização do Menu

**Data:** 14/01/2026
**Foco:** Implementação do Controle Financeiro e Reorganização das Abas.

Este guia descreve o passo a passo para adicionar a funcionalidade de controle de pagamentos e reorganizar o menu do aplicativo.

---

## 1. Banco de Dados (Google Sheets)

1.  Abra a planilha `Gestao_Visitas_Medicas`.
2.  Vá na aba **Visitas**.
3.  Adicione as seguintes colunas no final (cabeçalhos):
    *   `Status_Pagamento`
    *   `Data_Pagamento`
    *   `Obs_Pagamento`
4.  No AppSheet, vá em **Data > Columns** e clique em **Regenerate Structure** na tabela `Visitas`.

---

## 2. Configuração das Colunas (AppSheet)

Configure as novas colunas na tabela `Visitas`:

*   **Status_Pagamento**:
    *   **Type**: `Enum`
    *   **Values**: `Em aberto`, `Pago`, `Glosa`
    *   **Initial Value**: `"Em aberto"` (com aspas)
*   **Data_Pagamento**:
    *   **Type**: `Date`
*   **Obs_Pagamento**:
    *   **Type**: `LongText`

---

## 3. Criação de Slices (Filtros)

Vamos criar dois Slices para separar o que é "Visita Médica" do que é "Controle Financeiro".

### A. Slice: `Slice_Visitas_Diarias` (Para a aba Visitas)
Este slice serve para esconder os dados financeiros dos médicos no dia a dia.

1.  Vá em **Data > Slices > New Slice**.
2.  **Table**: `Visitas`
3.  **Slice Name**: `Slice_Visitas_Diarias`
4.  **Row Filter Condition**: `TRUE` (ou mantenha o filtro de data se já houver)
5.  **Slice Columns**: Selecione TODAS as colunas, **EXCETO**: `Status_Pagamento`, `Data_Pagamento`, `Obs_Pagamento`.
6.  **Update Mode**: `Updates`, `Adds`, `Deletes` (conforme desejado).

### B. Slice: `Slice_Repasses` (Para a aba Controle de Repasses)
Este slice foca no financeiro.

1.  Vá em **Data > Slices > New Slice**.
2.  **Table**: `Visitas`
3.  **Slice Name**: `Slice_Repasses`
4.  **Row Filter Condition**: `TRUE` (Pode filtrar apenas visitas "Em aberto" se quiser: `[Status_Pagamento] = "Em aberto"`)
5.  **Slice Columns**: Selecione as colunas relevantes para identificar a visita (Data, Paciente, Médico) **E** as colunas de pagamento (`Status_Pagamento`, `Data_Pagamento`, `Obs_Pagamento`).
6.  **Actions**: Adicione ações de edição se necessário.

---

## 4. Configuração das Views (UX)

Agora vamos configurar as 4 abas solicitadas.

### 1. Pacientes (Já existe)
*   Mantenha como está.

### 2. Visitas (Alteração)
*   Vá em **UX > Views > Visitas**.
*   **For this data**: Mude de `Visitas` (Tabela) para `Slice_Visitas_Diarias` (Slice criado acima).
*   Isso fará com que os campos de pagamento sumam desta tela.

### 3. Visitas Anteriores (Já existe)
*   Mantenha como está.

### 4. Controle de Repasses (NOVA)
*   Vá em **UX > Views > New View**.
*   **View Name**: `Controle de Repasses`
*   **For this data**: `Slice_Repasses`
*   **View type**: `Deck` ou `Table` (Table costuma ser melhor para financeiro).
*   **Group by**: `Status_Pagamento` (Sugestão).
*   **Position**: `Right` (ou selecione a posição para ser a 4ª aba).
*   **Icon**: Escolha um ícone de dinheiro (ex: `attach_money`).

---

## 5. Reorganização do Menu

Para garantir a ordem exata (Pacientes, Visitas, Visitas Anteriores, Controle de Repasses):

1.  Vá em **UX > Views**.
2.  Na seção **Primary Views**, arraste as views para a ordem desejada:
    1.  Pacientes
    2.  Visitas
    3.  Visitas Anteriores
    4.  Controle de Repasses

Salvel suas alterações!
