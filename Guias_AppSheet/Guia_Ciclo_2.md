# Guia de Implementação - Ciclo 2

Siga estes passos na ordem para aplicar as melhorias solicitadas.

## Parte 1: Atualizar a Planilha Google

1.  Abra sua planilha Google `Medical Visits App`.
2.  Vá para a aba **Pacientes**.
3.  Adicione duas novas colunas no cabeçalho (primeira linha):
    *   `Data Inicio`
    *   `Data Alta`
4.  (Opcional) Você pode formatar essas colunas como "Data" no Google Sheets para garantir a consistência visual.

## Parte 2: Atualizar Colunas no AppSheet

1.  Abra o editor do AppSheet.
2.  Vá para **Data** > **Columns**.
3.  Clique na tabela **Pacientes**.
4.  Clique no botão **Regenerate Structure** (ícone de recarregar/atualizar) no topo da lista de colunas.
5.  Confirme a regeneração.
6.  Localize as novas colunas e configure:
    *   **Data Inicio**:
        *   Type: `Date`
        *   Initial Value: `=TODAY()` (Isso preenche automaticamente a data de hoje ao criar).
        *   Require?: Marque a caixa (Obrigatório).
    *   **Data Alta**:
        *   Type: `Date`
        *   Searchable?: Marque a caixa.

## Parte 3: Restringir Cadastro na Tela de Visitas

Para impedir que usuários criem pacientes incompletos pela tela de visitas, vamos mudar a fonte de dados do menu suspenso.

1.  Vá para **Data** > **Slices**.
2.  Clique em **New Slice**.
3.  Configure o Slice:
    *   **Slice Name:** `Pacientes_Somente_Leitura`
    *   **Source Table:** `Pacientes`
    *   **Row Filter Condition:** `true` (Isso inclui todos os pacientes).
    *   **Slice Actions:** Deixe como está (auto).
    *   **Update Mode:** Selecione **Updates_Only** (Isso é o segredo! Desmarque "Adds" e "Deletes").
4.  Salve o Slice.
5.  Vá para **Data** > **Columns**.
6.  Clique na tabela **Visitas**.
7.  Edite a coluna **Paciente**.
8.  Em **Source Table**, mude de `Pacientes` para `Pacientes_Somente_Leitura` (o Slice que você acabou de criar).
9.  Clique em **Done**.

## Parte 4: Automação para Data de Alta

Para preencher a `Data Alta` automaticamente quando o status mudar para "Alta".

1.  Vá para **Automation** (ícone de robô).
2.  Clique em **New Bot**.
3.  Dê um nome, ex: `Definir Data de Alta`.
4.  Clique em **Configure Event**.
    *   **Event Name:** `Paciente Teve Alta`
    *   **Table:** `Pacientes`
    *   **Data Change Type:** `Updates_Only`
    *   **Condition:** `AND([Status] = "Alta", [_THISROW_BEFORE].[Status] <> "Alta")`
        *   *Explicação:* Isso garante que só rode quando o status *mudar* para Alta, e não se você editar outra coisa num paciente que já está de alta.
5.  Clique em **Add a Step**.
    *   **Step Name:** `Gravar Data`
    *   **Type:** `Run a data action`
    *   **Action:** `Set row values`
    *   **Set these columns:**
        *   Selecione `Data Alta`.
        *   Valor: `=TODAY()`
6.  Salve o App.

## Verificação Final

1.  **Teste do Menu:** Vá para adicionar uma Visita. Clique no dropdown de Paciente. O botão "New" (ou "Novo") deve ter sumido.
2.  **Teste de Cadastro:** Vá na aba Pacientes. Crie um novo. Veja se a `Data Inicio` já vem preenchida com hoje.
3.  **Teste de Alta:** Edite esse paciente, mude o Status para "Alta" e Salve. Aguarde a sincronização. Verifique se a `Data Alta` foi preenchida.
