# Plano de Implementação - Ciclo 4 (Edição de Registros do Dia)

## Objetivo
Permitir que os usuários corrijam erros de lançamento (ex: tipo de visita errado, paciente errado) **apenas no dia da visita**. Registros passados devem permanecer bloqueados para manter a integridade do histórico.

## Mudanças Propostas

### 1. AppSheet (Permissões de Tabela e Slice)
*   **Tabela `Visitas`**: Verificar se permite atualizações ("Updates").
*   **Slice `Visitas_De_Hoje`**: Habilitar a permissão de "Update" neste Slice.
    *   *Por que no Slice?* Porque é a tela principal que o usuário usa.

### 2. Regra de Segurança (Editable_If) - Opcional mas Recomendado
Para garantir que ninguém edite uma visita antiga (caso acessem por outro lugar), adicionaremos uma condição na tabela `Visitas`.

*   **Expressão `Editable_If`:** `DATE([Data_Hora]) = TODAY()`
    *   Isso trava qualquer edição se a data do registro não for hoje.

## Arquivos Afetados
*   `Guia_Ciclo_4.md` (Novo guia passo a passo).
