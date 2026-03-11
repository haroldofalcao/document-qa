O problema da data invertida (formato americano Mês/Dia/Ano em vez do brasileiro Dia/Mês/Ano) é um dos mais comuns no AppSheet e pode ser resolvido garantindo o *Locale* (Localidade) correto em dois lugares:**

### Passo 1: Configurar a Localidade no AppSheet

1. No editor do AppSheet, vá no menu lateral esquerdo em **Data** > **Tables**.
2. Clique na tabela onde essas datas estão sendo puxadas (provavelmente a tabela `Visitas`).
3. Logo abaixo do nome da tabela, procure a opção chamada **Table settings** (um ícone de engrenagem) e clique nela.
   *Em versões mais novas do menu, você pode precisar clicar em cima do nome da tabela na lista e depois ir na aba superior direita "Table Settings".*
4. Na janela que abrir, procure pela configuração **Locale**.
5. Mude a localidade de "English (United States)" para **"Portuguese (Brazil)"**.
6. Clique em **Done** e depois **Save** no topo do editor.

---

### Passo 2: Configurar a Localidade na Planilha Google (Google Sheets)

O AppSheet "herda" muitas configurações do seu banco de dados. Se a sua planilha estiver configurada como Estados Unidos, o AppSheet continuará forçando essa formatação na hora em que novos dados entrarem.

1. Abra a sua planilha base no Google Sheets (`Gestao_Visitas_Medicas`).
2. No menu superior, clique em **Arquivo** (File) > **Configurações** (Settings).
3. Na janela que abrir (aba "Geral"), procure a opção **Localidade** (Locale).
4. Mude para **Brasil** (Brazil).
5. Clique em **Salvar e recarregar** (Save and reload).

✅ **Importante:** Após fazer esses dois ajustes, faça um **Regenerate Structure** da sua tabela no AppSheet (em `Data > Columns`, abra a tabela `Visitas` e clique no botão `Regenerate Structure` no canto superior direito) para que o sistema force a atualização da visualização por completo.
