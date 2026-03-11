# Guia: Ajustes na aba "Registro Pag"

Para resolver essas duas questões na aba "Registro Pag" do AppSheet, usaremos os recursos nativos de Slices (para ocultar itens) e configurações da View (para ordenação).

---

## 1. Apagar/Ocultar quando for marcado "Pago"

Para que os itens desapareçam automaticamente quando você muda o status, essa view não pode ler a tabela toda. Ela precisa ler de um "Slice" (Filtro) que esconde o que já está pago.

**Passo a passo:**
1. No editor do AppSheet, vá em **Data > Slices**.
2. Procure o Slice que alimenta a view de pagamentos (ex: `Slice_Repasses` que criamos no Ciclo 6, ou crie um novo se ainda usa a tabela raiz).
3. No campo **Row Filter Condition** desse Slice, coloque a seguinte fórmula:
   ```excel
   [Status_Pagamento] = "Em aberto"
   ```
   *(Ou se tiver mais status como Glosa, use: `[Status_Pagamento] <> "Pago"` que significa "Diferente de Pago")*.
4. Vá em **UX > Views**, encontre sua aba **Registro Pag**.
5. Em **For this data**, certifique-se de que está selecionado este Slice que você acabou de filtrar (e não a tabela pura).

---

## 2. Mostrar os nomes em Ordem Alfabética

Para organizar a lista em ordem alfabética:

**Passo a passo:**
1. Vá em **UX > Views**.
2. Clique na view da sua aba **Registro Pag**.
3. Role as configurações para baixo até encontrar a opção **Sort by** (Ordenar por).
4. Clique em **Add** (Adicionar).
5. No primeiro campo, selecione a coluna que contém os nomes que você quer ordenar (ex: `Nome_Medico` ou `Paciente`).
6. No segundo botão, escolha **Ascending** (Crescente).
7. Salve as alterações clicando em **Save** no topo do editor.

Dessa forma, os pagamentos pendentes aparecerão de A a Z e, assim que você trocar o status para "Pago", eles sumirão da tela atual instantaneamente.
