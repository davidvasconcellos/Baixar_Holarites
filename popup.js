/*!
 * Autor: David Vasconcellos
 * Email: davidvasconcellos16@gmail.com
 * Direitos autorais reservados - 2025
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('matriculasContainer');
  const baixarBtn = document.getElementById('baixar');
  const mensagem = document.getElementById('mensagem');
  const erro = document.getElementById('erro');
  const tipoSelect = document.getElementById('tipo');
  const addBtn = document.getElementById('addMatricula');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const progresso = document.getElementById('progresso');
  const temaToggle = document.getElementById('temaToggle');

  // Inicializa ícone conforme tema salvo
  if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark');
    temaToggle.textContent = '☀️';
  } else {
    temaToggle.textContent = '🌙';
  }

  // Alternar tema ao clicar
  temaToggle.addEventListener('click', () => {
    const escuro = document.body.classList.toggle('dark');
    localStorage.setItem('tema', escuro ? 'dark' : 'light');
    temaToggle.textContent = escuro ? '☀️' : '🌙';
  });

  // Indicador de site
  const indicador = document.createElement('div');
  indicador.style.width = '15px';
  indicador.style.height = '15px';
  indicador.style.borderRadius = '50%';
  indicador.style.position = 'fixed';
  indicador.style.top = '10px';
  indicador.style.left = '10px';
  indicador.style.zIndex = '1000';
  document.body.appendChild(indicador);

  function atualizarIndicador(ativa) {
    indicador.style.backgroundColor = ativa ? '#34e11a' : '#f70000';
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, "verificarURL", response => {
      if (response && typeof response.ativa !== 'undefined') {
        atualizarIndicador(response.ativa);
      } else {
        atualizarIndicador(false);
      }
    });
  });

  // Salvar e carregar progresso
  function salvarProgresso() {
    const dados = [];
    container.querySelectorAll('.matricula-box').forEach(bloco => {
      dados.push({
        matricula: bloco.querySelector('.matricula').value,
        inicio: bloco.querySelector('.inicio').value,
        fim: bloco.querySelector('.fim').value
      });
    });
    localStorage.setItem('progressoContracheque', JSON.stringify(dados));
  }

  function carregarProgresso() {
    const dados = JSON.parse(localStorage.getItem('progressoContracheque'));
    if (!dados) return;
    dados.forEach(item => criarBloco(item.matricula, item.inicio, item.fim));
  }

  // Criar bloco de matrícula
  function criarBloco(matriculaVal = '', inicioVal = '', fimVal = '') {
    const div = document.createElement('div');
    div.className = 'matricula-box';
    div.innerHTML = `
      <input type="text" class="matricula" placeholder="Matrícula (8 dígitos)" maxlength="8" value="${matriculaVal}">
      <input type="text" class="inicio" placeholder="Período Inicial (MM/AAAA)" maxlength="7" value="${inicioVal}">
      <input type="text" class="fim" placeholder="Período Final (MM/AAAA)" maxlength="7" value="${fimVal}">
      <button class="remove">REMOVER</button>
    `;
    container.appendChild(div);

    div.querySelector('.remove').addEventListener('click', () => {
      div.classList.add('remover');
      div.addEventListener('animationend', () => {
        div.remove();
        salvarProgresso();
      });
    });

    // seleciona os inputs
    const inicioInput = div.querySelector('.inicio');
    const fimInput = div.querySelector('.fim');

    // aplica formatação automática
    formatarPeriodo(inicioInput);
    formatarPeriodo(fimInput);

    div.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', salvarProgresso);
    });
  }

  //Função para formata o período automaticamente com "/"
  function formatarPeriodo(input) {
    input.addEventListener('input', () => {
      let valor = input.value.replace(/\D/g, ''); // remove tudo que não for número
      if (valor.length > 2) {
        valor = valor.slice(0, 2) + '/' + valor.slice(2, 6);
      }
      input.value = valor;
    });
  }

  addBtn.addEventListener('click', () => criarBloco());

  clearAllBtn.addEventListener('click', () => {
    // Remove todos os blocos de matrícula do container
    container.innerHTML = '';

    // Apaga o progresso salvo
    localStorage.removeItem('progressoContracheque');
  });

  // Funções auxiliares
  function parsePeriodo(str) {
    const [mes, ano] = str.split('/').map(Number);
    return { mes, ano };
  }

  function gerarPeriodos(inicio, fim) {
    const periodos = [];
    for (let ano = inicio.ano; ano <= fim.ano; ano++) {
      const mesInicio = ano === inicio.ano ? inicio.mes : 1;
      const mesFim = ano === fim.ano ? fim.mes : 12;
      for (let mes = mesInicio; mes <= mesFim; mes++) {
        periodos.push({ mes: mes.toString().padStart(2, '0'), ano: ano.toString() });
      }
    }
    return periodos;
  }

  async function baixarEPDF(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }

  function validarEntrada(matricula, periodo) {
    if (!/^\d{8}$/.test(matricula)) return 'Matrícula deve ter 8 dígitos';
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(periodo)) return 'Período deve estar no formato MM/AAAA';
    return null;
  }

  // Evento de download
  baixarBtn.addEventListener('click', async () => {
    mensagem.classList.add('hidden');
    erro.classList.add('hidden');

    const blocos = container.querySelectorAll('.matricula-box');
    if (blocos.length === 0) {
      erro.textContent = 'Adicione pelo menos uma matrícula';
      erro.classList.remove('hidden');
      return;
    }

    let tipos = [];
    if (tipoSelect.value === '1') tipos = ['1'];
    else if (tipoSelect.value === '2') tipos = ['1', 'ZADC', 'ZPDP', '131P', '1313'];
    else if (tipoSelect.value === '3') tipos = ['ZADC', 'ZPDP', '131P', '1313'];

    const { PDFDocument } = window.PDFLib;

    // Desabilita botão e mostra barra
    baixarBtn.disabled = true;
    progresso.style.width = '0%';
    progresso.style.opacity = '1';

    try {
      for (let i = 0; i < blocos.length; i++) {
        const bloco = blocos[i];
        const matricula = bloco.querySelector('.matricula').value.trim();
        const inicioStr = bloco.querySelector('.inicio').value.trim();
        const fimStr = bloco.querySelector('.fim').value.trim();

        // Valida entradas
        let erroMatricula = validarEntrada(matricula, '01/2000');
        if (erroMatricula) throw new Error(`Erro na matrícula ${i + 1}: ${erroMatricula}`);
        let erroInicio = validarEntrada('12345678', inicioStr);
        if (erroInicio) throw new Error(`Erro na matrícula ${i + 1}: ${erroInicio}`);
        let erroFim = validarEntrada('12345678', fimStr);
        if (erroFim) throw new Error(`Erro na matrícula ${i + 1}: ${erroFim}`);

        const inicio = parsePeriodo(inicioStr);
        const fim = parsePeriodo(fimStr);

        const pdfFinal = await PDFDocument.create();
        const periodos = gerarPeriodos(inicio, fim);
        const downloads = [];

        for (const { mes, ano } of periodos) {
          for (const tipo of tipos) {
            const url = `https://rhbahia.ba.gov.br/auditor/contracheque/file/pdf/${ano}/${mes}/${tipo}/${matricula}`;
            downloads.push({ mes, ano, tipo, promise: baixarEPDF(url) });
          }
        }

        const resultados = await Promise.all(downloads.map(d => d.promise));

        for (let j = 0; j < resultados.length; j++) {
          const pdfBytes = resultados[j];
          if (!pdfBytes || pdfBytes.byteLength === 0) continue;

          const pdf = await PDFDocument.load(pdfBytes);
          const pages = await pdfFinal.copyPages(pdf, pdf.getPageIndices());
          pages.forEach(p => pdfFinal.addPage(p));
        }

        const finalBytes = await pdfFinal.save();
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `contracheques-${matricula}.pdf`;
        link.click();

        progresso.style.width = `${((i + 1) / blocos.length) * 100}%`;
      }

      mensagem.textContent = 'Todos os PDFs finalizados com sucesso!';
      mensagem.classList.remove('hidden');
    } catch (e) {
      erro.textContent = 'Ocorreu um erro: ' + (e.message || e);
      erro.classList.remove('hidden');
    } finally {
      setTimeout(() => {
        baixarBtn.disabled = false;
        progresso.style.opacity = '0';
      }, 1000);
    }
  });

  carregarProgresso();
});
