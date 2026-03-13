// ============================================================
// RELATÓRIO DIÁRIO DE VISITAS MÉDICAS — Google Apps Script
// Projeto Firebase: gestao-de-visitas-1
// Remetente: haroldofalcao@gmail.com
// ============================================================
// CONFIGURAÇÃO (via Propriedades do Script):
//   SERVICE_ACCOUNT_KEY  → JSON stringify da chave da Service Account
//   SENDER_NAME          → "Sistema de Visitas Médicas" (opcional)
// ============================================================

var FIREBASE_PROJECT = 'gestao-de-visitas-1';
var FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents';
var SENDER_NAME = 'Sistema de Visitas Médicas';

// ─── FUNÇÃO PRINCIPAL (agendada para 23h BRT) ───────────────
function enviarRelatorioVisitasDiarias() {
  try {
    var token = getAccessToken();
    var hoje = getHojeBRT(); // "YYYY-MM-DD" no fuso de Brasília

    Logger.log('Gerando relatório para: ' + hoje);

    // 1. Carregar dados do Firestore
    var visitas = getVisitasDoDia(token, hoje);

    if (visitas.length === 0) {
      Logger.log('Nenhuma visita registrada hoje. E-mail não enviado.');
      return;
    }

    var internacoes = getColecaoCompleta(token, 'internacoes');
    var pacientes   = getColecaoCompleta(token, 'pacientes');
    var config      = getDocumento(token, 'email_report/config');

    // 2. Montar mapas para join
    var intsMap = {};
    internacoes.forEach(function(i) {
      intsMap[i.id] = i;
    });
    var pacsMap = {};
    pacientes.forEach(function(p) {
      pacsMap[p.id] = p;
    });

    // 3. Resolver destinatários
    var destinatarios = (config && config.destinatarios) ? config.destinatarios : [];
    if (destinatarios.length === 0) {
      Logger.log('ERRO: Nenhum destinatário configurado em config/email_report');
      return;
    }

    // CC: emails únicos dos médicos que visitaram hoje
    var emailsMedicos = [];
    visitas.forEach(function(v) {
      if (v.email_medico && emailsMedicos.indexOf(v.email_medico) === -1) {
        emailsMedicos.push(v.email_medico);
      }
    });

    // 4. Montar HTML do e-mail
    var html = buildEmailHtml(visitas, intsMap, pacsMap, hoje);

    // 5. Enviar e-mail
    var toStr = destinatarios.join(', ');
    var ccStr = emailsMedicos.join(', ');
    var dataFormatada = formatarData(hoje);

    GmailApp.sendEmail(
      toStr,
      'Relatório de Visitas Médicas — ' + dataFormatada,
      'Relatório disponível apenas em e-mail com suporte a HTML.',
      {
        name: SENDER_NAME,
        cc: ccStr || undefined,
        htmlBody: html,
        noReply: false
      }
    );

    Logger.log('E-mail enviado com sucesso para: ' + toStr + (ccStr ? ' | CC: ' + ccStr : ''));

  } catch (e) {
    Logger.log('ERRO CRÍTICO: ' + e.toString());
    // Notifica o remetente em caso de falha
    GmailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      '[ERRO] Falha no Relatório Diário de Visitas',
      'Detalhes do erro:\n\n' + e.toString()
    );
  }
}

// ─── FUNÇÃO DE TESTE MANUAL ─────────────────────────────────
// Selecione esta função e clique em "Executar" para testar
function testarEnvioManual() {
  enviarRelatorioVisitasDiarias();
}

// ─── HELPERS: FIRESTORE ──────────────────────────────────────

function getVisitasDoDia(token, dataHoje) {
  // Busca todas as visitas e filtra pelo dia (Firestore REST não suporta filtro por substring de data)
  var todasVisitas = getColecaoCompleta(token, 'visitas');
  return todasVisitas.filter(function(v) {
    if (!v.data_hora) return false;
    // data_hora está em UTC ISO; ajusta para BRT (UTC-3) para comparar
    var dt = new Date(v.data_hora);
    dt.setHours(dt.getHours() - 3); // converte UTC → BRT
    var yyyy = dt.getFullYear();
    var mm   = String(dt.getMonth() + 1).padStart(2, '0');
    var dd   = String(dt.getDate()).padStart(2, '0');
    return (yyyy + '-' + mm + '-' + dd) === dataHoje;
  });
}

function getColecaoCompleta(token, colecao) {
  var url = FIRESTORE_BASE + '/' + colecao + '?pageSize=1000';
  var resp = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var json = JSON.parse(resp.getContentText());
  if (!json.documents) return [];

  return json.documents.map(function(doc) {
    var id = doc.name.split('/').pop();
    return Object.assign({ id: id }, firestoreToJs(doc.fields));
  });
}

function getDocumento(token, path) {
  var url = FIRESTORE_BASE + '/' + path;
  var resp = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var json = JSON.parse(resp.getContentText());
  if (json.error || !json.fields) return null;
  return firestoreToJs(json.fields);
}

// Converte campos do formato Firestore REST para JS simples
function firestoreToJs(fields) {
  if (!fields) return {};
  var obj = {};
  Object.keys(fields).forEach(function(key) {
    var val = fields[key];
    if (val.stringValue  !== undefined) obj[key] = val.stringValue;
    else if (val.integerValue !== undefined) obj[key] = Number(val.integerValue);
    else if (val.doubleValue  !== undefined) obj[key] = val.doubleValue;
    else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
    else if (val.timestampValue !== undefined) obj[key] = val.timestampValue;
    else if (val.arrayValue !== undefined) {
      obj[key] = (val.arrayValue.values || []).map(function(v) {
        return v.stringValue || v.integerValue || v.booleanValue || '';
      });
    } else obj[key] = null;
  });
  return obj;
}

// ─── HELPERS: AUTENTICAÇÃO ───────────────────────────────────

function getAccessToken() {
  var props = PropertiesService.getScriptProperties();
  var keyJson = props.getProperty('SERVICE_ACCOUNT_KEY');
  if (!keyJson) throw new Error('Propriedade SERVICE_ACCOUNT_KEY não configurada.');

  var key = JSON.parse(keyJson);
  var now = Math.floor(Date.now() / 1000);

  var header  = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));

  var signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(header + '.' + payload, key.private_key)
  );

  var jwt = header + '.' + payload + '.' + signature;

  var resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    payload: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
  });

  return JSON.parse(resp.getContentText()).access_token;
}

// ─── HELPERS: DATA / FORMATAÇÃO ─────────────────────────────

function getHojeBRT() {
  // Retorna "YYYY-MM-DD" no horário de Brasília (UTC-3)
  var agora = new Date();
  agora.setHours(agora.getHours() - 3);
  var yyyy = agora.getFullYear();
  var mm   = String(agora.getMonth() + 1).padStart(2, '0');
  var dd   = String(agora.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function formatarData(isoDate) {
  var parts = isoDate.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function getTipoVisitaLabel(tipo) {
  if (tipo === 'E')  return 'Enteral (E)';
  if (tipo === 'P')  return 'Parenteral (P)';
  if (tipo === 'EP') return 'Enteral + Parenteral (EP)';
  return tipo || '-';
}

// ─── HELPERS: HTML DO E-MAIL ─────────────────────────────────

function buildEmailHtml(visitas, intsMap, pacsMap, dataHoje) {
  var dataFormatada = formatarData(dataHoje);
  var total = visitas.length;

  var linhas = visitas.map(function(v) {
    var int = intsMap[v.internacaoId] || {};
    var pac = pacsMap[int.pacienteId] || {};
    var nomePaciente  = pac.nome || 'Desconhecido';
    var numRegistro   = int.numero_registro || '-';
    var medico        = v.nome_medico || '-';
    var tipoLabel     = getTipoVisitaLabel(v.tipo_visita);

    var corTipo = v.tipo_visita === 'E' ? '#2563eb' : v.tipo_visita === 'P' ? '#7c3aed' : '#0891b2';

    return '<tr>' +
      '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:600;">' + nomePaciente + '</td>' +
      '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-family:monospace;">' + numRegistro + '</td>' +
      '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;">' + medico + '</td>' +
      '<td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">' +
        '<span style="background:' + corTipo + '1a;color:' + corTipo + ';padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:700;">' + tipoLabel + '</span>' +
      '</td>' +
    '</tr>';
  }).join('');

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">' +
    '<tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">' +

    // Cabeçalho
    '<tr><td style="background:linear-gradient(135deg,#1e40af,#0369a1);padding:32px 40px;">' +
    '<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Relatório de Visitas Médicas</h1>' +
    '<p style="margin:8px 0 0;color:#bfdbfe;font-size:15px;">' + dataFormatada + ' &mdash; ' + total + ' visita(s) registrada(s)</p>' +
    '</td></tr>' +

    // Tabela
    '<tr><td style="padding:32px 40px;">' +
    '<table width="100%" cellpadding="0" cellspacing="0">' +
    '<thead><tr style="background:#f9fafb;">' +
    '<th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;letter-spacing:.05em;">Paciente</th>' +
    '<th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;letter-spacing:.05em;">Registro</th>' +
    '<th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;letter-spacing:.05em;">Médico</th>' +
    '<th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;letter-spacing:.05em;">Tipo</th>' +
    '</tr></thead>' +
    '<tbody>' + linhas + '</tbody>' +
    '</table>' +
    '</td></tr>' +

    // Rodapé
    '<tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">' +
    '<p style="margin:0;color:#9ca3af;font-size:12px;">Gerado automaticamente pelo Sistema de Gestão de Visitas Médicas &bull; ' + dataFormatada + '</p>' +
    '</td></tr>' +

    '</table>' +
    '</td></tr></table>' +
    '</body></html>';
}
