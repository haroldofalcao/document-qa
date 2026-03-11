# Estrutura do Banco de Dados (Google Sheets)

Crie uma nova planilha no Google Sheets chamada **"Gestao_Visitas_Medicas"**.
Crie duas abas (páginas) na parte inferior: **Pacientes** e **Visitas**.

## Aba 1: Pacientes
Esta tabela armazena o cadastro mestre dos pacientes.

| Coluna (Cabeçalho) | Tipo de Dado (AppSheet) | Descrição |
| :--- | :--- | :--- |
| **ID_Paciente** | Text (UNIQUEID) | Identificador único do paciente (Chave Primária - Sistema). |
| **Prontuario** | Text / Number | Número do prontuário (Digitado manualmente). |
| **Nome** | Name | Nome completo do paciente. |
| **RG** | Text | RG para confirmação de identidade. |
| **Status** | Enum (Ativo, Alta) | Define se o paciente deve aparecer na lista de visitas. |

> **Dica:** Ao cadastrar as colunas no AppSheet, defina o "Initial Value" de `ID_Paciente` como `UNIQUEID()`.

---

## Aba 2: Visitas
Esta tabela armazena o histórico de todas as visitas realizadas.

| Coluna (Cabeçalho) | Tipo de Dado (AppSheet) | Descrição |
| :--- | :--- | :--- |
| **ID_Visita** | Text (UNIQUEID) | Identificador único da visita (Chave Primária). |
| **Data_Hora** | DateTime | Data e hora exata do registro da visita. |
| **Nome_Medico_Visitador** | Text / Email | Nome ou e-mail do médico que realizou a visita. |
| **ID_Paciente** | Ref (Pacientes) | Vínculo com a tabela de Pacientes. |
| **Tipo_Visita** | Enum (E, P, EP) | Tipo do atendimento realizado. |
| **Status_Pagamento** | Enum (Em aberto, Pago, Glosa) | Status financeiro da visita. |
| **Data_Pagamento** | Date | Data em que o pagamento foi realizado. |
| **Obs_Pagamento** | LongText | Observações sobre o pagamento ou glosa. |

> **Configuração Importante no AppSheet:**
> *   **Data_Hora**: Defina "Initial Value" como `NOW()`.
> *   **Nome_Medico_Visitador**: Defina "Initial Value" como `USEREMAIL()` para capturar automaticamente quem está logado.
> *   **ID_Paciente**: Marque como "Is a part of?" se quiser ver o histórico dentro do cadastro do paciente (opcional, mas recomendado).

---

## Aba 3: Filtros (Para Relatórios)
Esta tabela auxiliar serve apenas para "guardar" as escolhas de filtro do usuário no Dashboard. Ela terá apenas UMA linha.

| Coluna (Cabeçalho) | Tipo de Dado (AppSheet) | Descrição |
| :--- | :--- | :--- |
| **ID_Filtro** | Text | Identificador (Pode ser fixo, ex: "1"). |
| **Data_Inicio** | Date | Data inicial do filtro. |
| **Data_Fim** | Date | Data final do filtro. |
| **Status_Filtro** | Enum (Todos, Em aberto, Pago, Glosa) | Filtro opcional por status. |
