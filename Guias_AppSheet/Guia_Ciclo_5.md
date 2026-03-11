# Guia Ciclo 5: Visualização de Histórico e Dashboard

**Data:** 28/12/2025
**Foco:** Melhoria na UX, Correção de Visibilidade, Dashboard e Ajustes de Validação.

Este documento registra as alterações feitas no AppSheet e a configuração do Looker Studio.

---

## 1. AppSheet: Nova Funcionalidade "Visitas Anteriores"
Criamos uma aba específica para consultar visitas de dias passados.
*   **Slice:** `Slice_Visitas_Anteriores` (Filtra `DATE < TODAY` e `IN(Pacientes)`).
*   **View:** `Visitas Anteriores` (Group By: None).

---

## 2. AppSheet: Manutenção e Validações (Reinternações)

Para permitir que pacientes sejam reinternados (mesmo registro, nova data):

### A. Coluna REGISTRO
Alteramos as configurações para evitar bloqueios indevidos:
1.  **Tipo de Dados:** Mudado de `Number` para **`Text`** (Evita pontos automáticos e conflitos de formatação).
2.  **Unicidade:** Removemos a fórmula em **Valid If** (`NOT(IN...)`) para permitir que o mesmo Nº de Prontuário apareça em múltiplas linhas (múltiplas internações).
3.  **Restrição de Tamanho:** Removemos **Minimum/Maximum Length** para aceitar números antigos (curtos) ou novos (longos).

### B. Pacientes "Invisíveis"
*   Filtros de Segurança (`Security Filters`) foram limpos.
*   Garantimos que o Status seja preenchido ("Ativo").

---

## 3. Looker Studio: Configuração do Dashboard

Para criar gráficos que mostram o Nome do Paciente (vindo da tabela Pacientes) junto com os dados da Visita, usamos **Combinação de Dados (Data Blending)**.

### Receita da Combinação (Blend)
1.  **Tabela 1 (Esquerda):** `Visitas`
    *   Dimensões: `ID_Paciente`, `Data_Hora`, `Tipo_Visita`, `Nome_Medico_Visitador`.
2.  **Tabela 2 (Direita):** `Pacientes`
    *   Dimensões: `ID_Paciente`, `Nome`.
3.  **Join:** `ID_Paciente` = `ID_Paciente` (Left Outer).

### Dicas de Visualização
*   **Dados Faltando?** Verifique o **Filtro de Data** no canto do relatório (ex: mude para "Este Ano").
*   **Erro na Visualização?** Se mudar a planilha, vá em `Recurso > Gerenciar fontes > Editar > Atualizar Campos`.
