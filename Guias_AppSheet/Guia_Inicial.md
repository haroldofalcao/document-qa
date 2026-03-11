# Guia de Configuração do AppSheet

Este guia vai te levar do zero ao aplicativo funcionando.

## Passo 1: Preparar os Dados
1. Crie a planilha no Google Sheets conforme o arquivo `database_schema.md`.
   - **Abas**: `Pacientes` e `Visitas`.
   - **Colunas Pacientes**: `ID_Paciente`, `Prontuario`, `Nome`, `RG`, `Status`.
   - **Colunas Visitas**: `ID_Visita`, `Data_Hora`, `Nome_Medico_Visitador`, `ID_Paciente`, `Tipo_Visita`.
2. Insira pelo menos 1 paciente de teste na aba **Pacientes** (ex: ID=1, Prontuario=100, Nome=Teste, RG=123, Status=Ativo).

## Passo 2: Criar o App
1. No Google Sheets, vá em **Extensões > AppSheet > Criar um aplicativo**.
2. O AppSheet vai ler seus dados. Ele deve adicionar automaticamente as tabelas `Pacientes` e `Visitas`.
   - Se não adicionar, vá em **Data** e adicione as tabelas manualmente.

## Passo 3: Ajustar as Colunas (Data > Columns)
Vá na aba **Data**, selecione a tabela e clique em **View Columns**.

### Tabela: Pacientes
**ATENÇÃO: Adicionando Prontuário e RG**
Se você adicionou colunas novas na planilha agora, clique em **Regenerate Structure** antes de continuar.

- **ID_Paciente**:
  - Key: ✅ | Show: ⬜
  - Initial Value: `UNIQUEID()`
  - *Nota: É automático. Não mude para Number, deixe como Text.*
- **Prontuario**:
  - Type: `Text` (ou `Number`).
  - Search: ✅
  - **Valid If**: `NOT(IN([_THIS], SELECT(Pacientes[Prontuario], [ID_Paciente] <> [_THISROW].[ID_Paciente])))`
  - *Isso impede que você cadastre dois pacientes com o mesmo Prontuário. Nomes iguais podem, Prontuários não.*
- **Nome**:
  - Search: ✅
- **RG**:
  - Search: ✅
- **Status**:
  - Type: `Enum`.
  - Values: `Ativo`, `Alta`.

**Configurando o Rótulo (Nome + RG):**
Para aparecer "Maria - RG 123" na lista:
1. Clique em **Add Virtual Column** (botão azul).
2. **Column Name**: `Rotulo_Completo`.
3. **App Formula**: `[Nome] & " - RG: " & [RG]`
4. Clique em Done.
5. **IMPORTANTE**: Marque a caixinha **Label** nesta nova coluna `Rotulo_Completo`.

### Tabela: Visitas
- **ID_Visita**: Key, Hidden. Initial Value: `UNIQUEID()`.
- **Data_Hora**: Type `DateTime`. Initial Value: `NOW()`.
- **Nome_Medico_Visitador**: Type `Text`. Initial Value: `USEREMAIL()`.
- **ID_Paciente**:
  - Type: **`Ref`** (Isso é crucial!).
  - Source Table: `Pacientes`.
  - *Se estiver como Text, você verá o código feio. Se estiver como Ref, verá o Rótulo (Nome - RG).*
- **Tipo_Visita**: Type `Enum`. Values: `E`, `P`, `EP`. Input Mode: `Buttons`.

## Passo 4: Criar a "Lista de Ativos" (Data > Slices)
1. Vá em **Data**. Se não achar "Slices", procure na lupa ou no menu superior.
2. **New Slice**.
3. Name: `Slice_Pacientes_Ativos`.
4. Source Table: `Pacientes`.
5. Row Filter Condition: `[Status] = "Ativo"`.

## Passo 5: Criar as Telas (App > Views)
1. **Tela de Registro (Visitas)**
   - Nova View: "Registrar Visita".
   - Data: `Visitas`.
   - Type: `Form`.
   - Column order: `ID_Paciente`, `Tipo_Visita`.

2. **Tela de Lista de Pacientes**
   - Edite a view "Pacientes" existente.
   - **For this data**: `Slice_Pacientes_Ativos`.
   - Type: `Deck`.
   - Position: `middle` ou `first`.
   - **Sort by**: Clique em Add e selecione `Nome` (Ascending). Assim a lista fica sempre em ordem alfabética.

## Passo 6: Botão de Alta (Actions)
1. **Actions** > **New Action**.
2. Name: `Dar Alta`.
3. Table: `Pacientes`.
4. Do this: `Data: set the values of some columns in this row`.
5. Set these columns:
   - Column: `Status`.
   - Value: `"Alta"`.
   - *Se der erro de coluna vazia, apague a linha e adicione de novo.*

## Passo 7: Automação de E-mail
1. Configure o script `Code.gs` no Google Sheets.
2. Configure o Acionador (Trigger) no Apps Script:
   - Função: `enviarRelatorioDiario`.
   - Evento: `Baseado no tempo` > `Contador de dias`.
   - Hora: `17h às 18h`.

## Passo 8: Testar
1. Abra o app.
2. Tente registrar uma visita. Verifique se aparece "Nome - RG" na seleção.
3. Dê alta e veja se o paciente some.

## Passo 9: Compartilhar (Users)
1. Clique no ícone de **Pessoas (+)**.
2. Adicione os e-mails dos médicos.

## Passo 10: Importar em Massa
1. Cole os dados na planilha Google Sheets.
2. **Crie IDs manuais** na coluna `ID_Paciente` (1, 2, 3...) para não deixar vazio.

## Solução de Problemas (Troubleshooting)
**Problema: Dei alta mas o paciente continua na lista!**
Isso acontece porque sua View está olhando para a Tabela inteira, e não para o Filtro (Slice).
1. Vá em **App > Views**.
2. Clique na view **Pacientes**.
3. Olhe o campo **For this data**.
4. Se estiver escrito `Pacientes`, **está errado**.
5. Mude para **`Slice_Pacientes_Ativos`**.
6. Salve. Agora quem tiver "Alta" vai sumir.

**Problema: Na hora de visitar, aparece o código feio (ID) e não o Nome!**
Se já está como `Ref`, então o problema é o **Rótulo (Label)** na tabela de Pacientes.
1. Vá em **Data > Columns > Pacientes**.
2. Procure a coluna `Nome` (ou `Rotulo_Completo` se você criou).
3. Olhe para a direita e encontre a caixinha **Label**.
4. **ELA TEM QUE ESTAR MARCADA!** ✅
5. Verifique se a coluna `ID_Paciente` está com a caixinha Label **DESMARCADA**.
   - *O AppSheet só permite UM Label por tabela. Se o ID estiver marcado, ele ganha.*
6. Salve e recarregue a página do navegador (F5) para garantir.

**Problema: Aparece só o número (Prontuário) na lista, e não o Nome!**
Isso acontece porque a caixinha **Label** está marcada na coluna `Prontuario` (ou ID).
1. Vá em **Data > Columns > Pacientes**.
2. Desmarque a caixinha **Label** da coluna `Prontuario`.
3. Desmarque a caixinha **Label** da coluna `ID_Paciente`.
4. Marque a caixinha **Label** APENAS na coluna `Rotulo_Completo` (aquela virtual que criamos) ou na coluna `Nome`.
5. Salve. A lista agora vai mostrar o que estiver marcado.
