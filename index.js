const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
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

    const agora = new Date();
    const inicioDia = new Date(agora); inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(agora); fimDia.setHours(23, 59, 59, 999);

    const visitasSnap = await db
      .collection("visitas")
      .where("data", ">=", Timestamp.fromDate(inicioDia))
      .where("data", "<=", Timestamp.fromDate(fimDia))
      .orderBy("data", "asc")
      .get();

    const visitas = visitasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() },
    });

    const dataFormatada = agora.toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

    await transporter.sendMail({
      from: `"Sistema de Visitas" <${GMAIL_USER.value()}>`,
      to: destinatarios.join(","),
      subject: `Relatório de Visitas — ${dataFormatada}`,
      html: gerarHtmlRelatorio(visitas, dataFormatada),
    });

    console.log(`Relatório enviado para ${destinatarios.length} destinatário(s). Visitas: ${visitas.length}`);
  }
);

function gerarHtmlRelatorio(visitas, dataFormatada) {
  const linhasVisitas = visitas.length === 0
    ? `<tr><td colspan="4" style="text-align:center;padding:20px;color:#666;">Nenhuma visita registrada hoje.</td></tr>`
    : visitas.map((v, i) => {
        const hora = v.data?.toDate
          ? v.data.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "--:--";
        return `
        <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8f9fa"}">
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">${hora}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">${v.paciente || "—"}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">${v.medico || "—"}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">
            <span style="background:${statusCor(v.status)};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;">${v.status || "—"}</span>
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
                  <th style="padding:10px 14px;text-align:left;color:#555;border-bottom:2px solid #dee2e6;">Horário</th>
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
                Enviado automaticamente · ${new Date().toLocaleString("pt-BR")}
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function statusCor(status) {
  const cores = { realizada: "#28a745", pendente: "#ffc107", cancelada: "#dc3545", agendada: "#17a2b8" };
  return cores[(status || "").toLowerCase()] || "#6c757d";
}
