document.addEventListener('DOMContentLoaded', () => {
  const qtdInput = document.getElementById('qtdMatriculas');
  const container = document.getElementById('matriculasContainer');
  const baixarBtn = document.getElementById('baixar');
  const mensagem = document.getElementById('mensagem');
  const erro = document.getElementById('erro');

  // Salva progresso no localStorage
  function salvarProgresso() {
    const dados = {
      qtd: qtdInput.value,
      matriculas: []
    };
    const matriculasElems = container.querySelectorAll('.matricula');
    const inicioElems = container.querySelectorAll('.inicio');
    const fimElems = container.querySelectorAll('.fim');

    matriculasElems.forEach((m, i) => {
      dados.matriculas.push({
        matricula: m.value,
        inicio: inicioElems[i].value,
        fim: fimElems[i].value
      });
    });

    localStorage.setItem('progressoContracheque', JSON.stringify(dados));
  }

  // Carrega progresso salvo
  function carregarProgresso() {
    const dados = JSON.parse(localStorage.getItem('progressoContracheque'));
    if (!dados) return;
    qtdInput.value = dados.qtd || 1;
    atualizarCampos();

    if (dados.matriculas && dados.matriculas.length > 0) {
      const matriculasElems = container.querySelectorAll('.matricula');
      const inicioElems = container.querySelectorAll('.inicio');
      const fimElems = container.querySelectorAll('.fim');

      dados.matriculas.forEach((m, i) => {
        if (matriculasElems[i]) matriculasElems[i].value = m.matricula;
        if (inicioElems[i]) inicioElems[i].value = m.inicio;
        if (fimElems[i]) fimElems[i].value = m.fim;
      });
    }
  }

  // Atualiza campos de matrícula
  function atualizarCampos() {
    container.innerHTML = '';
    const qtd = Number(qtdInput.value);
    for (let i = 1; i <= qtd; i++) {
      const div = document.createElement('div');
      div.innerHTML = `
        <h4>Matrícula ${i}</h4>
        <input type="text" class="matricula" placeholder="Matrícula (8 dígitos)" maxlength="8">
        <input type="text" class="inicio" placeholder="Período Inicial (MM/AAAA)" maxlength="7">
        <input type="text" class="fim" placeholder="Período Final (MM/AAAA)" maxlength="7">
      `;
      container.appendChild(div);
    }
  }

  qtdInput.addEventListener('change', () => {
    atualizarCampos();
    salvarProgresso();
  });

  container.addEventListener('input', salvarProgresso);

  carregarProgresso();

  // Função para parsear período
  function parsePeriodo(str) {
    const [mes, ano] = str.split('/').map(Number);
    return { mes, ano };
  }

  // Gera períodos entre início e fim
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

  // Função para baixar PDF
  async function baixarEPDF(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }

  // Validação de matrícula e período
  function validarEntrada(matricula, periodo) {
    if (!/^\d{8}$/.test(matricula)) return 'Matrícula deve ter 8 dígitos';
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(periodo)) return 'Período deve estar no formato MM/AAAA';
    return null;
  }

  // Evento do botão
  baixarBtn.addEventListener('click', async () => {
    mensagem.classList.add('hidden');
    erro.classList.add('hidden');
    const qtd = Number(qtdInput.value);
    const matriculasElems = container.querySelectorAll('.matricula');
    const inicioElems = container.querySelectorAll('.inicio');
    const fimElems = container.querySelectorAll('.fim');
    const tipoEscolha = document.getElementById('tipo').value;

    let tipos = [];
    if (tipoEscolha === '1') tipos = ['1'];
    else if (tipoEscolha === '2') tipos = ['1','ZADC','ZPDP','131P','1313'];
    else if (tipoEscolha === '3') tipos = ['ZADC','ZPDP','131P','1313'];

    const { PDFDocument } = window.PDFLib;

    try {
      for (let i = 0; i < qtd; i++) {
        const matricula = matriculasElems[i].value.trim();
        const inicioStr = inicioElems[i].value.trim();
        const fimStr = fimElems[i].value.trim();

        // Validação
        let erroMatricula = validarEntrada(matricula, '01/2000'); // só pra usar regex matrícula
        if (erroMatricula) throw new Error(`Erro na matrícula ${i+1}: ${erroMatricula}`);
        let erroInicio = validarEntrada('12345678', inicioStr);
        if (erroInicio) throw new Error(`Erro na matrícula ${i+1}: ${erroInicio}`);
        let erroFim = validarEntrada('12345678', fimStr);
        if (erroFim) throw new Error(`Erro na matrícula ${i+1}: ${erroFim}`);

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
          const { mes, ano, tipo } = downloads[j];
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
      }
      mensagem.textContent = 'Todos os PDFs finalizados com sucesso!';
      mensagem.classList.remove('hidden');
    } catch (e) {
      erro.textContent = 'Ocorreu um erro: ' + (e.message || e);
      erro.classList.remove('hidden');
    }
  });
});