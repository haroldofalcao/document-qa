# Guia de Implementação - Ciclo 4

Este guia ensina como permitir a edição de registros de visita, mas restringindo essa permissão apenas para o dia atual.

## Passo 1: Habilitar Edição na Tabela Principal

1.  Abra o editor do **AppSheet**.
2.  Vá para o menu **Data** (Dados) no lado esquerdo.
3.  Selecione a tabela **Visitas**.
4.  **IMPORTANTE:** Olhe para o **topo** da lista de colunas. Você verá uma barra de ferramentas com alguns ícones pequenos.
5.  Clique no ícone de **Engrenagem** ou **Lápis** (dependendo da versão, o nome é "Table Settings").
6.  Isso abrirá uma janela de configurações. Agora procure a opção **Are updates allowed?** (Updates allowed?).
7.  Certifique-se de que **Updates** está marcado (junto com Adds).

## Passo 2: Habilitar Edição no Slice "Visitas_De_Hoje"

Como criamos um Slice ("filtro") no Ciclo 3, precisamos dizer que ele também aceita edições.

1.  Vá para **Data** > **Slices**.
2.  Clique no slice **Visitas_De_Hoje**.
3.  Em **Update Mode** (Modo de Atualização), marque a caixa **Updates**.
    *   Agora você deve ter `Updates` e `Adds` marcados.

## Passo 3: Restringir Edição Apenas para Hoje (Regra de Segurança)

Para evitar que alguém edite uma visita da semana passada acidentalmente, vamos colocar uma trava.

1.  Vá para **Data** > **Columns**.
2.  Expanda a tabela **Visitas**.
3.  Não precisamos colocar a fórmula em cada coluna. Podemos colocar na tabela ou, mais fácil, usar o Slice como guardião (o Slice já filtra `TODAY`, então se o usuário só usa o Slice, ele só vê e edita hoje).
4.  **Método Mais Seguro (Recomendado):**
    *   Vá para **Data** > **Tables** > **Visitas**.
    *   **Importante:** A imagem que você mandou é da seção "Security". O campo que procuramos fica **ACIMA** dessa seção, ou na seção **Settings** (logo no topo da janela).
    *   Procure por **Are updates allowed?** (perto onde você marcou "Updates" anteriormente).
    *   Lá deve ter um pequeno ícone de **Funil** (<i class="material-icons">filter_list</i>) ou um input box.
    *   Se não encontrar o campo para colocar fórmula na tabela, **USE O "MÉTODO SIMPLES" ABAIXO**, que funciona igual e é mais fácil de achar.

    **Método Simples (Na Coluna Chave):**
    *   Feche as configurações da tabela.
    *   Vá para a lista de colunas (**Data** > **Columns** > **Visitas**).
    *   Clique no **Lápis** ao lado da primeira coluna (`ID_Visita` ou `Row Number`).
    *   Role para baixo e abra a seção **Update Behavior** (Comportamento de Atualização).
    *   Procure o campo **Editable?** (Editável?).
    *   Clique no ícone de "Funil" ou na caixinha de fórmula e cole:
        ```
        DATE([Data_Hora]) = TODAY()
        ```
    *   Clique em **Done**.

## Passo 4: Verificar a "Action" de Edição

Às vezes, o botão de editar (lápis) some se não houver permissão.

1.  Vá para **App** > **Actions**.
2.  Procure a ação **Edit** na tabela `Visitas` (geralmente gerada pelo sistema).
3.  Verifique se em **Behavior** > **Only if this condition is true**, está vazio ou `true`.

## Passo 5: Salvar e Testar

1.  Salve o App.
2.  Tente editar uma visita que você fez **hoje**. (Deve funcionar).
3.  Se tiver uma visita de **ontem**, tente editá-la. (Não deve conseguir salvar ou os campos estarão bloqueados, dependendo do método usado).
