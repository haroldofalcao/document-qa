# Diagnóstico: Campo de Paciente Sumiu do Formulário

**Problema:** Na tela de "Nova Visita" (Formulário), os campos `Data_Hora`, `Nome_Medico_Visitador`, `Tipo_Visita` e `ID_Visita` aparecem, mas o campo de escolher o Paciente (provavelmente `ID_Paciente`) **sumiu**. Sem ele, não é possível lançar visitas.

Com base nas configurações recentes feitas no Projeto (especialmente no **Ciclo 6**), existem três principais suspeitos para esse problema. Verifique-os na seguinte ordem no Editor do AppSheet:

## 1. Verifique as Colunas do Slice (Principal Suspeito 🕵️)

No Ciclo 6, criamos o **`Slice_Visitas_Diarias`** para esconder as informações financeiras. Se o campo de Paciente ficou de fora das colunas desse Slice, ele somirá de todas as telas que usam o Slice (inclusive o Formulário).

1. Vá no menu lateral esquerdo em **Data > Slices**.
2. Clique no Slice **`Slice_Visitas_Diarias`**.
3. Desça até a seção **Slice Columns**.
4. Certifique-se de que a opção está como **Custom** (para podermos escolher o que aparece).
5. **Verifique se o campo `ID_Paciente` está na lista.** Se não estiver, clique em **Add** e adicione-o.
6. A lista correta deve conter: `ID_Visita`, `Data_Hora`, `Nome_Medico_Visitador`, `ID_Paciente`, e `Tipo_Visita`.
7. Salve e teste.

## 2. Verifique a Ordem das Colunas no Formulário (UX)

Se a view (tela) do formulário estiver forçando uma ordem específica de colunas e o `ID_Paciente` não estiver na lista, ele não aparecerá.

1. Vá no menu lateral esquerdo em **UX > Views**.
2. Procure a View que você usa para registrar a visita (pode se chamar *Form*, *Registrar Visita*, ou *Visitas_Form*). Esta view geralmente fica na seção "Ref Views" se foi criada automaticamente.
3. Clique nela e desça até a seção **View Options**.
4. Encontre o campo **Column order**.
5. Se houver colunas listadas lá, garanta que o **`ID_Paciente`** foi adicionado à lista. Se não tiver nada listado, o AppSheet tentará mostrar todas, o que nos leva ao Passo 1.
6. Salve e teste.

## 3. Verifique a Configuração da Coluna na Tabela Base

Pode ser que a coluna tenha sido ocultada acidentalmente na própria tabela.

1. Vá em **Data > Columns**.
2. Expanda a tabela **Visitas**.
3. Procure a linha referente a **`ID_Paciente`**.
4. Verifique a coluna **Show?**. A caixinha deve estar **marcada (✅)** com um *check*.
5. (Opcional) Verifique se o **Type** continua como `Ref` apontando para a tabela `Pacientes`.

Siga esses passos. Em 90% das vezes em mudanças do AppSheet, quando uma coluna específica some de uma tela que usa Slices, o problema está no Passo 1!
