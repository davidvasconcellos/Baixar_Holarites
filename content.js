/*!
 * Autor: David Vasconcellos
 * Email: davidvasconcellos16@gmail.com
 * Direitos autorais reservados - 2025
 */
// Script executável em todas as páginas para verificar se contém o URL do sistema de contracheque e enviar mensagem para o popup (se ele estiver aberto).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "verificarURL") {
    const estaNoRH = window.location.href.includes("rhbahia.ba.gov.br");
    sendResponse({ ativa: estaNoRH });
  }
});
