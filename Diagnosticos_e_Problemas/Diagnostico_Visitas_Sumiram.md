# Diagnóstico: Visitas não aparecem no App

**Problema:** As visitas lançadas não aparecem na aba "Visitas" nem na aba "Visitas Antigas" (ou Anteriores).

Como o AppSheet filtra os dados em várias camadas, o problema pode estar em um destes 3 pontos. Por favor, verifique na ordem:

## 1. Verifique o "Security Filter" (Filtro de Segurança)

Se houver um filtro de segurança na tabela, os dados que não correspondem ao filtro nem sequer chegam ao aplicativo. Isso explica por que somem de *todas* as abas.

1. No Editor do AppSheet, vá em **Security > Security Filters**.
2. Procure a tabela **Visitas**.
3. Verifique se existe alguma fórmula escrita lá.
    * **Cenário Comum:** A fórmula é `[Nome_Medico_Visitador] = USEREMAIL()`.
    * **Teste:** Se o e-mail que você está logado no App for *diferente* (mesmo que por uma letra maiúscula/minúscula) do e-mail salvo na coluna `Nome_Medico_Visitador`, a visita some para você.
    * **Solução:** Temporariamente, apague a fórmula do Security Filter e salve. Se as visitas aparecerem, o problema é a inconsistência do e-mail.

## 2. Verifique o Filtro do Slice (Slice_Visitas_Diarias)

No **Guia Ciclo 6**, alteramos a aba "Visitas" para olhar para o Slice `Slice_Visitas_Diarias`.

1. Vá em **Data > Slices**.
2. Clique em **`Slice_Visitas_Diarias`**.
3. Olhe o campo **Row Filter Condition**.
    * **O que deve estar:** `TRUE` (para mostrar tudo) ou um filtro de data correto (ex: `[Data_Hora] >= TODAY()`).
    * **O erro:** Se estiver filtrando algo como `[Status_Pagamento] = "Em aberto"` e você não estiver preenchendo esse campo, ou se houver um erro na data.
    * **Teste:** Mude a fórmula para `TRUE` e salve.

## 3. Verifique a View "Visitas"

Confirme se a visualização está apontando para o lugar certo.

1. Vá em **UX > Views**.
2. Clique na view **Visitas**.
3. Verifique o campo **For this data**.
    * Deve ser **`Slice_Visitas_Diarias`** (conforme Ciclo 6).
    * Se for **`Visitas`** (a tabela pura), verifique se o Security Filter (Passo 1) não está bloqueando.

---

**Resumo para correção rápida:**
Geralmente, quando o dado some de *toda parte*, é o **Security Filter**. Verifique lá primeiro!
