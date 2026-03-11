# Topologia do Aplicativo: Gestão de Visitas Médicas

Este diagrama ilustra o fluxo de informações, desde o banco de dados principal (Google Sheets) até as telas interativas (UX) que os usuários visualizam no AppSheet. Ele serve como referência rápida para o suporte e evolução da arquitetura do projeto.

## Diagrama da Arquitetura

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'darkMode': false, 'background': '#ffffff'}}}%%
graph TD
    %% Estilos Personalizados
    classDef sheet fill:#0f9d58,stroke:#fff,stroke-width:2px,color:#fff;
    classDef table fill:#4285f4,stroke:#fff,stroke-width:2px,color:#fff;
    classDef slice fill:#f4b400,stroke:#fff,stroke-width:2px,color:#fff;
    classDef view fill:#db4437,stroke:#fff,stroke-width:2px,color:#fff;
    classDef script fill:#673ab7,stroke:#fff,stroke-width:2px,color:#fff;

    subgraph "1. Fonte de Dados (Database)"
        GS["Google Sheets <br>(Gestao_Visitas_Medicas)"]:::sheet
    end

    subgraph "2. Tabelas Base (AppSheet Data)"
        TB_P["Tabela: Pacientes"]:::table
        TB_V["Tabela: Visitas"]:::table
        TB_F["Tabela: Filtros <br>(Apoio Relatórios)"]:::table
        
        GS --> TB_P
        GS --> TB_V
        GS --> TB_F
    end

    subgraph "3. Filtros e Regras (AppSheet Slices)"
        SL_PA["Slice_Pacientes_Ativos <br>[Status='Ativo']"]:::slice
        SL_VD["Slice_Visitas_Diarias <br>(Oculta Financeiro)"]:::slice
        SL_VA["Slice_Visitas_Anteriores"]:::slice
        SL_R["Slice_Repasses <br>(Mostra Financeiro)"]:::slice
        
        TB_P --> SL_PA
        TB_V --> SL_VD
        TB_V --> SL_VA
        TB_V --> SL_R
    end

    subgraph "4. Telas do Usuário (AppSheet UX)"
        VW_P["View: Pacientes <br>(Deck/List)"]:::view
        VW_V["View: Visitas <br>(Form/Deck)"]:::view
        VW_VA["View: V. Antigas"]:::view
        VW_RP["View: Registro Pag <br>(Controle Financeiro)"]:::view
        VW_EX["View: Extrato / Dashboard"]:::view
        
        SL_PA -.-> VW_P
        SL_VD -.-> VW_V
        SL_VA -.-> VW_VA
        SL_R -.-> VW_RP
        TB_F -.-> VW_EX
        TB_V -.-> VW_EX
    end
    
    subgraph "5. Automações e Ações (Actions/Bots)"
        ACT_A["Action: Dar Alta <br>(Muda Status)"]:::script
        BOT_E["Apps Script (Code.gs)<br>Email Diário"]:::script
        
        VW_P --> ACT_A
        ACT_A --> TB_P
        GS --> BOT_E
    end
```

## Resumo das Camadas

1. **Fonte de Dados:** Todo o armazenamento central e definitivo reside no Google Sheets.
2. **Tabelas Base:** O AppSheet espelha o modelo de dados e define os tipos, como obrigatoriedade, fórmulas iniciais (`UNIQUEID()`, `NOW()`) e relacionamentos (Ex: `ID_Paciente` sendo um *Ref*).
3. **Slices:** Camada de segurança e negócios. Os Slices garantem que a tela de visitas do dia a dia omita dados de faturamento financeiro e que a tela de pacientes só liste quem não recebeu alta.
4. **Telas (UX):** A interface final amarrada aos Slices. As mudanças feitas aqui alteram *como* a informação aparece, mas a regra vem das camadas de cima.
5. **Automações:** Ações que desencadeiam eventos, como o clique do botão "Dar Alta" ou o agrupamento de informações para envio de email do relatório pelo Google Apps Script.
