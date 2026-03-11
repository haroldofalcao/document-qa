# Guia Ciclo 7: Dashboard Financeiro com Filtros

**Data:** 14/01/2026
**Foco:** Criação de um Dashboard interativo para filtrar pagamentos por período.

---

## 1. Banco de Dados (Google Sheets)

1.  Crie uma nova aba (página) na sua planilha chamada `Filtros`.
2.  Na primeira linha, crie os cabeçalhos:
    *   `ID_Filtro`
    *   `Data_Inicio`
    *   `Data_Fim`
    *   `Status_Filtro`
3.  **IMPORTANTE:** Adicione **uma única linha** de dados logo abaixo para começar (ex: ID=1, Data=01/01/2026...). O filtro funcionará editando sempre essa mesma linha.

---

## 2. Dados (AppSheet)

1.  Vá em **Data**.
2.  Clique no **+** para adicionar Table. Selecione a aba `Filtros` da planilha.
3.  Configure as colunas da tabela `Filtros`:
    *   `ID_Filtro`: Key, Text, Hidden (não precisa aparecer).
    *   `Data_Inicio`: Date.
    *   `Data_Fim`: Date.
    *   `Status_Filtro`: Enum (Valores: `Todos`, `Em aberto`, `Pago`, `Glosa`).
    *   **Dica:** Em todas essas colunas, ative a opção "Quick Edit" se possível, ou vamos habilitar na View.

---

## 3. Slice Filtrado

Vamos criar um Slice da tabela **Visitas** que "escuta" o que está na tabela **Filtros**.

1.  Vá em **Data > Slices > New Slice**.
2.  **Table**: `Visitas`
3.  **Slice Name**: `Slice_Relatorio_Pagamentos`
4.  **Row Filter Condition**:
    Cole esta fórmula (ela verifica se a data da visita está entre as datas do filtro):

    ```excel
    AND(
      [Data_Pagamento] >= ANY(Filtros[Data_Inicio]),
      [Data_Pagamento] <= ANY(Filtros[Data_Fim]),
      OR(
        ANY(Filtros[Status_Filtro]) = "Todos",
        [Status_Pagamento] = ANY(Filtros[Status_Filtro])
      )
    )
    ```

---

## 4. Views (Visualização)

Precisamos de duas peças para montar o dashboard.

### Peça A: O Painel de Controle (Filtros)
1.  Vá em **UX > Views > New View**.
2.  **Name**: `Filtro_Detail`
3.  **For this data**: `Filtros`
4.  **View Type**: `Detail`
5.  **Quick Edit Columns**: Adicione `Data_Inicio`, `Data_Fim`, `Status_Filtro`. (Isso permite editar direto na tela sem abrir formulário).

### Peça B: O Relatório (Tabela de Resultados)
1.  Vá em **UX > Views > New View**.
2.  **Name**: `Relatorio_Table`
3.  **For this data**: `Slice_Relatorio_Pagamentos` (O Slice que criamos no passo 3).
4.  **View Type**: `Table`.
5.  **Group By**: `Status_Pagamento` (Opcional).
6.  **Column Order**: Data, Paciente, Valor (se tiver), Status.

---

## 5. Montando o Dashboard

Agora juntamos tudo.

1.  Vá em **UX > Views > New View**.
2.  **Name**: `Dashboard Financeiro`
3.  **View Type**: `Dashboard`.
4.  **View Entries**: Adicione:
    *   `Filtro_Detail`
    *   `Relatorio_Table`
5.  **Display Mode**: Use "Interactive Mode" (se disponível) ou "Tiled".
6.  **Position**: Coloque no Menu Navigation ou onde preferir.

**Como usar:**
Ao abrir o Dashboard, você muda a data no topo ("Filtro_Detail") e a tabela de baixo ("Relatorio_Table") deve atualizar automaticamente mostrando apenas o que está naquele período.

---

## 6. Troubleshooting e Acabamento Visual (Dashboard e Exportação)

Durante o uso do Extrato (Dashboard Financeiro), algumas limitações da interface clássica do AppSheet podem surgir. Abaixo estão as resoluções:

### 6.1. Corrigindo Nomes de Pacientes Ocultos (Códigos de ID)
Se a tabela do Extrato começar a mostrar códigos aleatórios (ex: `779b914e`) em vez do nome do paciente:
1. Vá na tabela `Pacientes` (`Data > Columns`).
2. Adicione uma **Virtual Column** chamada `Label_Paciente` com a fórmula: `[Registro] & " - " & [Nome]`.
3. Marque a caixinha **Label** apenas para essa nova coluna virtual. Isso garantirá que o App inteiro mostre o número e o nome corretamente.

### 6.2. Ordem de Exibição e Colunas
Para que o Extrato fique limpo e ordenado:
1. Na View `Relatorio_Table`, desative o "Group By" (se houver).
2. Na seção **Sort By**, adicione:
   * 1º regra: `Data_Hora` (Descending - Mais recentes primeiro)
   * 2º regra: `ID_Paciente` (Ascending - Ordem alfabética para desempatar o mesmo dia).
3. Na seção **Column Order**, selecione manualmente apenas `Data_Hora`, `ID_Paciente` e `Status_Pagamento`. Remova colunas de sistema como `ID_Visita`.

### 6.3. O Botão de Download (Exportar para CSV) Não Aparece
O AppSheet possui uma limitação conhecida onde **botões de exportação (Overlay) são ocultados quando a visualização está dentro de um Dashboard**.
* **Solução**: Vá em **UX > Views** e abra a sua `Relatorio_Table`. Mude a **Position** dela de `ref` para `Last` ou `Right`. 
* **Resultado**: A tabela base será enviada para o menu inferior do celular, ao lado do Extrato. Use o Extrato visualmente para filtrar. Quando precisar baixar o CSV, clique na aba da tabela ao lado, onde o filtro já estará aplicado e o botão nativo de Download estará visível.
* **Solução Definitiva (Gerencial)**: Para relatórios complexos e geração de PDFs diretos da base do AppSheet, recomenda-se integrar a base de dados com o **Google Looker Studio**.
