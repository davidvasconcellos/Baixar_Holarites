// Este script roda em todas as páginas
// Ele verifica se a URL contém "rhbahia.ba.gov.br"
// e envia uma mensagem para o popup (se ele estiver aberto).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "verificarURL") {
    const estaNoRH = window.location.href.includes("rhbahia.ba.gov.br");
    sendResponse({ ativa: estaNoRH });
  }
});