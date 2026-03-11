/**
 * Script de Automação para Relatório Diário de Visitas Médicas
 * Atualizado em: Ciclo 3 (Filtro de Incompletos)
 */

// --- CONFIGURAÇÃO ---
const EMAIL_DESTINO = "admin@exemplo.com"; // <--- ALTERE AQUI se necessário
const NOME_ABA_VISITAS = "Visitas";
const NOME_ABA_PACIENTES = "Pacientes";
// --------------------

function enviarRelatorioDiario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaVisitas = ss.getSheetByName(NOME_ABA_VISITAS);
  const abaPacientes = ss.getSheetByName(NOME_ABA_PACIENTES);
  
  if (!abaVisitas || !abaPacientes) {
    Logger.log("Erro: Abas não encontradas. Verifique os nomes.");
    return;
  }

  // Pegar dados
  const dadosVisitas = abaVisitas.getDataRange().getValues();
  const dadosPacientes = abaPacientes.getDataRange().getValues();
  
  // Mapear Pacientes (ID -> {Nome, Prontuario})
  const mapaPacientes = {};
  for (let i = 1; i < dadosPacientes.length; i++) {
    const id = dadosPacientes[i][0]; 
    if (!id) continue;
    const prontuario = dadosPacientes[i][1]; 
    const nome = dadosPacientes[i][2]; 
    mapaPacientes[id] = { nome: nome, prontuario: prontuario };
  }

  // Filtrar visitas de HOJE
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  const visitasHoje = [];
  
  for (let i = 1; i < dadosVisitas.length; i++) {
    const linha = dadosVisitas[i];
    
    // -- NOVA VALIDAÇÃO (Ciclo 3) --
    // Verifica se campos essenciais estão vazios
    // Colunas (base 0): 0=ID, 1=Data, 2=Medico, 3=ID_Paciente, 4=Tipo
    const medico = linha[2];
    const idPaciente = linha[3];
    const tipo = linha[4];

    // Se qualquer um desses for vazio ou indefinido, pula para o próximo
    if (!medico || !idPaciente || !tipo) {
      continue; 
    }
    // -----------------------------

    const dataVisita = new Date(linha[1]); 
    dataVisita.setHours(0,0,0,0);
    
    if (dataVisita.getTime() === hoje.getTime()) {
      visitasHoje.push({
        medico: medico,
        idPaciente: idPaciente,
        tipo: tipo,
        hora: new Date(linha[1]).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
      });
    }
  }

  if (visitasHoje.length === 0) {
    Logger.log("Nenhuma visita completa registrada hoje.");
    return; 
  }

  // Agrupar por Médico
  const agrupadoPorMedico = {};
  visitasHoje.forEach(v => {
    if (!agrupadoPorMedico[v.medico]) {
      agrupadoPorMedico[v.medico] = [];
    }
    agrupadoPorMedico[v.medico].push(v);
  });

  // Montar HTML do E-mail
  let htmlBody = "<h2>Relatório Diário de Visitas Médicas</h2>";
  htmlBody += `<p>Data: ${hoje.toLocaleDateString('pt-BR')}</p><hr>`;

  for (const medico in agrupadoPorMedico) {
    htmlBody += `<h3>Médico: ${medico}</h3>`;
    htmlBody += "<table border='1' cellpadding='5' style='border-collapse: collapse; width: 100%;'>";
    htmlBody += "<tr style='background-color: #f2f2f2;'><th>Hora</th><th>Prontuário</th><th>Paciente</th><th>Tipo</th></tr>";
    
    agrupadoPorMedico[medico].forEach(v => {
      const dadosPac = mapaPacientes[v.idPaciente] || { nome: "Desconhecido", prontuario: "-" };
      htmlBody += `<tr>
        <td>${v.hora}</td>
        <td>${dadosPac.prontuario}</td>
        <td>${dadosPac.nome}</td>
        <td style='text-align: center;'><b>${v.tipo}</b></td>
      </tr>`;
    });
    
    htmlBody += "</table><br>";
  }

  // Enviar E-mail
  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: `Relatório de Visitas - ${hoje.toLocaleDateString('pt-BR')}`,
    htmlBody: htmlBody
  });
  
  Logger.log("E-mail enviado com sucesso.");
}
