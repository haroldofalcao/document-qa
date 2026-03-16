const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

initializeApp();

const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");

exports.enviarRelatorioVisitas = onSchedule(
  {
    schedule: "50 23 * * *",
    timeZone: "America/Sao_Paulo",
    secrets: [GMAIL_USER, GMAIL_APP_PASSWORD],
  },
  async () => {
    const db = getFirestore();

    const configSnap = await db.collection("email_report").doc("config").get();
    if (!configSnap.exists) { console.error("email_report/config não encontrado."); return; }

    const destinatarios = configSnap.data().destinatarios || [];
    if (destinatarios.length === 0) { console.warn("Nenhum destinatário."); return; }

    // Calcula a data de hoje em BRT (America/Sao_Paulo)
    // "sv-SE" retorna YYYY-MM-DD, que é o mesmo formato gravado em data_hora
    const agora = new Date();
    const hojeStr = agora.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const amanhaBrt = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    const amanhaStr = amanhaBrt.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

    // Busca visitas do dia usando comparação de string (data_hora é "YYYY-MM-DD")
    // Suporta também registros legados com datetime completo ("YYYY-MM-DDTHH:mm")
    const visitasSnap = await db
      .collection("visitas")
      .where("data_hora", ">=", hojeStr)
      .where("data_hora", "<", amanhaStr)
      .orderBy("data_hora", "asc")
      .get();

    const visitas = visitasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Busca nomes dos pacientes (não são gravados diretamente na visita)
    const pacienteIds = [...new Set(visitas.map(v => v.pacienteId).filter(Boolean))];
    const pacientesMap = {};
    if (pacienteIds.length > 0) {
      const docs = await Promise.all(pacienteIds.map(id => db.collection("pacientes").doc(id).get()));
      docs.forEach(d => { if (d.exists) pacientesMap[d.id] = d.data(); });
    }

    const visitasEnriquecidas = visitas.map(v => ({
      ...v,
      paciente_nome: pacientesMap[v.pacienteId]?.nome || "—",
    }));

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() },
    });

    const dataFormatada = agora.toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
      timeZone: "America/Sao_Paulo",
    });

    await transporter.sendMail({
      from: `"Sistema de Visitas" <${GMAIL_USER.value()}>`,
      to: destinatarios.join(","),
      subject: `Relatório de Visitas — ${dataFormatada}`,
      html: gerarHtmlRelatorio(visitasEnriquecidas, dataFormatada, agora),
    });

    console.log(`Relatório enviado para ${destinatarios.length} destinatário(s). Visitas: ${visitas.length}`);
  }
);

function gerarHtmlRelatorio(visitas, dataFormatada, agora) {
  const linhasVisitas = visitas.length === 0
    ? `<tr><td colspan="4" style="text-align:center;padding:20px;color:#666;">Nenhuma visita registrada hoje.</td></tr>`
    : visitas.map((v, i) => {
        return `
        <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8f9fa"}">
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">${v.data_hora || "—"}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">${v.paciente_nome}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">${v.nome_medico || "—"}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">
            <span style="background:${statusCor(v.status_pagamento)};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;">${v.status_pagamento || "—"}</span>
          </td>
        </tr>`;
      }).join("");

  return `<!DOCTYPE html><html lang="pt-BR">
  <head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:30px 20px;">
        <table width="620" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1a73e8;padding:28px 32px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">RELATÓRIO DIÁRIO</p>
              <h1 style="margin:4px 0 0;color:#fff;font-size:22px;">Visitas Realizadas</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${dataFormatada}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 10px;">
              <table width="100%"><tr>
                <td style="background:#e8f0fe;border-radius:6px;padding:14px 20px;text-align:center;">
                  <p style="margin:0;font-size:32px;font-weight:bold;color:#1a73e8;">${visitas.length}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#555;">${visitas.length === 1 ? "visita realizada" : "visitas realizadas"}</p>
                </td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;">
              <table width="100%" style="border:1px solid #e9ecef;border-radius:6px;font-size:14px;">
                <thead><tr style="background:#f8f9fa;">
                  <th style="padding:10px 14px;text-align:left;color:#555;border-bottom:2px solid #dee2e6;">Data</th>
                  <th style="padding:10px 14px;text-align:left;color:#555;border-bottom:2px solid #dee2e6;">Paciente</th>
                  <th style="padding:10px 14px;text-align:left;color:#555;border-bottom:2px solid #dee2e6;">Médico</th>
                  <th style="padding:10px 14px;text-align:left;color:#555;border-bottom:2px solid #dee2e6;">Status</th>
                </tr></thead>
                <tbody>${linhasVisitas}</tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9fa;padding:16px 32px;border-top:1px solid #e9ecef;">
              <p style="margin:0;font-size:12px;color:#999;text-align:center;">
                Enviado automaticamente · ${agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function statusCor(status) {
  const cores = { "Pendente": "#ffc107", "Pago": "#28a745", "Glosa": "#dc3545" };
  return cores[status] || "#6c757d";
}
