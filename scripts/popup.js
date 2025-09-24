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
  const ausentesSalvos = JSON.parse(localStorage.getItem('ausentes')) || [];

  // Mostrar alertas salvos
  criarAlertas(ausentesSalvos);

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
  indicador.style.position = 'absolute';
  indicador.style.top = '15px';
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

  // Função para limpar alertas e mensagem de sucesso
  function limparAlertasEMensagem() {
    // Remove alertas e listas de períodos ausentes
    localStorage.removeItem('ausentes');
    document.querySelectorAll('.alerta-periodos, .lista-periodos').forEach(el => el.remove());

    // Limpa a mensagem de sucesso
    localStorage.removeItem('mensagemSucesso');
    mensagem.textContent = ''; // <-- limpa o texto
    mensagem.classList.add('hidden'); // <-- esconde a div
  }

  // Função para criar alertas persistentes
  function criarAlertas(ausentes) {
    // Remove alertas existentes
    document.querySelectorAll('.alerta-periodos, .lista-periodos').forEach(e => e.remove());
    if (!ausentes || ausentes.length === 0) return;

    // Criar alerta principal
    const alerta = document.createElement('div');
    alerta.innerHTML = '⚠️ Períodos não encontrados <span style="font-size:0.8em; opacity:0.7;">(clique para detalhes)</span>';
    alerta.className = 'alerta-periodos';
    alerta.style.cursor = 'pointer';
    alerta.style.padding = '10px 35px';
    alerta.style.border = '1px solid #f5c542';
    alerta.style.backgroundColor = '#fff3cd';
    alerta.style.borderRadius = '8px';
    alerta.style.display = 'inline-block';
    alerta.style.transition = 'all 0.3s';
    alerta.addEventListener('mouseover', () => alerta.style.backgroundColor = '#ffe8a1');
    alerta.addEventListener('mouseout', () => alerta.style.backgroundColor = '#fff3cd');
    document.body.insertBefore(alerta, document.getElementById('progresso').nextSibling);

    // Criar lista detalhada
    const lista = document.createElement('div');
    lista.className = 'lista-periodos';
    lista.style.display = 'none';
    lista.style.backgroundColor = '#f8f9fa';
    lista.style.border = '1px solid #dee2e6';
    lista.style.borderRadius = '8px';
    lista.style.padding = '10px 15px';
    lista.style.marginTop = '5px';
    lista.style.maxHeight = '300px';
    lista.style.overflowY = 'auto';
    lista.style.transition = 'all 0.3s';

    const fechar = document.createElement('span');
    fechar.textContent = '✖';
    fechar.style.cursor = 'pointer';
    fechar.style.float = 'right';
    lista.appendChild(fechar);

    const ul = document.createElement('ul');
    ul.style = 'list-style:none; padding-left:5px; margin-top:15px;';

    // Configuração de cores e ícones
    const tiposConfig = {
      'Normal': { color: '#007bff', icon: '📄' },
      'Folha Adicional': { color: '#28a745', icon: '➕' },
      'Prêmio': { color: '#ffc107', icon: '🏆', textColor: '#000' },
      '1a. Parc. 13Sal.': { color: '#17a2b8', icon: '1️⃣' },
      '2a. Parc. 13Sal.': { color: '#6f42c1', icon: '2️⃣' }
    };

    // Função para agrupar períodos contíguos
    function agruparPeriodos(periodos) {
      if (!periodos || periodos.length === 0) return [];
      const ord = periodos.sort((a, b) => {
        const [ma, aa] = a.split('/').map(Number);
        const [mb, ab] = b.split('/').map(Number);
        return aa === ab ? ma - mb : aa - ab;
      });
      const agrupados = [];
      let inicio = ord[0], fim = ord[0];
      for (let i = 1; i < ord.length; i++) {
        const [mF, aF] = fim.split('/').map(Number);
        const [mC, aC] = ord[i].split('/').map(Number);
        if ((aC === aF && mC === mF + 1) || (aC === aF + 1 && mF === 12 && mC === 1)) {
          fim = ord[i];
        } else {
          agrupados.push({ inicio, fim });
          inicio = fim = ord[i];
        }
      }
      agrupados.push({ inicio, fim });
      return agrupados;
    }

    // Processar cada matrícula
    const matriculasMap = {}; // agrupando por matrícula
    ausentes.forEach(a => {
      const match = a.match(/Matrícula: (\d+) \[Período ausente: ([0-9/]+)\] - (.+)/);
      if (!match) return;
      const [, matricula, periodo, tiposStr] = match;
      if (!matriculasMap[matricula]) matriculasMap[matricula] = {};
      const tipos = tiposStr.split(',').map(t => t.trim());
      tipos.forEach(tipo => {
        if (!matriculasMap[matricula][tipo]) matriculasMap[matricula][tipo] = [];
        matriculasMap[matricula][tipo].push(periodo);
      });
    });

    // Criar itens da lista
    for (const matricula in matriculasMap) {
      const liMat = document.createElement('li');
      liMat.style.marginBottom = '8px';
      liMat.innerHTML = `<strong>Matrícula:</strong> ${matricula}`;
      const tiposDiv = document.createElement('div');
      tiposDiv.style.marginTop = '3px';

      for (const tipo in matriculasMap[matricula]) {
        const periodos = agruparPeriodos(matriculasMap[matricula][tipo]);
        periodos.forEach(p => {
          const span = document.createElement('span');
          span.style.backgroundColor = tiposConfig[tipo].color;
          span.style.color = tiposConfig[tipo].textColor || '#fff';
          span.style.padding = '3px 6px';
          span.style.borderRadius = '4px';
          span.style.display = 'inline-block';
          span.style.marginRight = '5px';
          span.style.marginTop = '3px';
          span.textContent = `${tiposConfig[tipo].icon} ${tipo} [${p.inicio === p.fim ? p.inicio : p.inicio + '-' + p.fim}]`;
          tiposDiv.appendChild(span);
        });
      }

      liMat.appendChild(tiposDiv);
      ul.appendChild(liMat);
    }

    lista.appendChild(ul);
    document.body.insertBefore(lista, alerta.nextSibling);

    // Eventos
    alerta.addEventListener('click', () => {
      lista.style.display = lista.style.display === 'none' ? 'block' : 'none';
    });
    fechar.addEventListener('click', () => lista.style.display = 'none');
  }

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
      // Adiciona animação de remoção
      div.classList.add('remover');

      div.addEventListener('animationend', () => {
        // Remove o bloco
        div.remove();
        // Salva progresso atualizado
        salvarProgresso();
        // Limpa alertas e mensagem de sucesso
        limparAlertasEMensagem();
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
    if (!/^\d{8}$/.test(matricula)) return ' Matrícula deve ter 8 dígitos numéricos!';
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(periodo)) return '📆 Período deve estar no formato MM/AAAA';
    return null;
  }

  // Evento de download
  baixarBtn.addEventListener('click', async () => {
    mensagem.classList.add('hidden');
    erro.classList.add('hidden');

    const ausentes = []; // array para armazenar períodos ausentes

    const blocos = container.querySelectorAll('.matricula-box');
    if (blocos.length === 0) {
      erro.textContent = '🚨 Adicione pelo menos uma matrícula!';
      erro.classList.remove('hidden');
      return;
    }

    let tipos = [];
    const nomesTipos = {
      '1': 'Normal',
      'ZADC': 'Folha Adicional',
      'ZPDP': 'Prêmio',
      '131P': '1a. Parc. 13Sal.',
      '1313': '2a. Parc. 13Sal.'
    };
    if (tipoSelect.value === '1') tipos = ['1'];
    else if (tipoSelect.value === '2') tipos = ['1', 'ZADC', 'ZPDP', '131P', '1313'];
    else if (tipoSelect.value === '3') tipos = ['ZADC', 'ZPDP', '131P', '1313'];
    /* 
    1 - Normal;
    ZADC - Folha Adicional
    ZPDP - Prêmio
    131P - 1a. Parc. 13Sal.
    1313 - 2a. Parc. 13Sal.
    */
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

        // Agrupa tipos ausentes por período
        const ausentesPorPeriodo = {}; // chave = `${mes}/${ano}`, valor = array de nomes de tipos

        for (let j = 0; j < resultados.length; j++) {
          const pdfBytes = resultados[j];
          const { mes, ano, tipo } = downloads[j];

          if (!pdfBytes || pdfBytes.byteLength === 0) {
            const chave = `${mes}/${ano}`;
            if (!ausentesPorPeriodo[chave]) ausentesPorPeriodo[chave] = [];
            ausentesPorPeriodo[chave].push(nomesTipos[tipo]);
            continue;
          }

          const pdf = await PDFDocument.load(pdfBytes);
          const pages = await pdfFinal.copyPages(pdf, pdf.getPageIndices());
          pages.forEach(p => pdfFinal.addPage(p));
        }

        // Adiciona ao array ausentes agrupando tipos por período
        for (const periodo in ausentesPorPeriodo) {
          const tiposAusentes = ausentesPorPeriodo[periodo].join(', ');
          ausentes.push(`Matrícula: ${matricula} [Período ausente: ${periodo}] - ${tiposAusentes}`);
        }

        const finalBytes = await pdfFinal.save();
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `contracheques-${matricula}.pdf`;
        link.click();

        progresso.style.width = `${((i + 1) / blocos.length) * 100}%`;
      }

      if (ausentes.length > 0) {
        // Salva os períodos ausentes no localStorage para persistência
        localStorage.setItem('ausentes', JSON.stringify(ausentes));

        // Cria os alertas na tela usando a função já criada
        criarAlertas(ausentes);
      } else {
        // Remove alertas antigos se não houver períodos ausentes
        localStorage.removeItem('ausentes');
      }

      const textoSucesso = '✔️ Contracheques baixados com sucesso!';
      mensagem.textContent = textoSucesso;
      mensagem.classList.remove('hidden');

      // salva no localStorage para persistir
      localStorage.setItem('mensagemSucesso', textoSucesso);

    } catch (e) {
      erro.textContent = 'Ocorreu um erro ➡️ ' + (e.message || e);
      erro.classList.remove('hidden');
    } finally {
      setTimeout(() => {
        baixarBtn.disabled = false;
        progresso.style.opacity = '0';
      }, 1000);
    }
  });

  // Carregar mensagem de sucesso salva
  const mensagemSalva = localStorage.getItem('mensagemSucesso');
  if (mensagemSalva) {
    mensagem.textContent = mensagemSalva;
    mensagem.classList.remove('hidden');
  }

  [addBtn, clearAllBtn, baixarBtn].forEach(btn => {
    btn.addEventListener('click', () => {
      limparAlertasEMensagem();
    });
  });

  // Também ao remover uma matrícula individual
  container.addEventListener('click', e => {
    if (e.target.classList.contains('remove')) {
      limparAlertasEMensagem();
    }
  });

  carregarProgresso();
});
