document.addEventListener('DOMContentLoaded', () => {
  const qtdInput = document.getElementById('qtdMatriculas');
  const container = document.getElementById('matriculasContainer');
  const baixarBtn = document.getElementById('baixar');
  const mensagem = document.getElementById('mensagem');
  const erro = document.getElementById('erro');

  // Atualiza campos de matrícula conforme quantidade
  function atualizarCampos() {
    container.innerHTML = '';
    const qtd = Number(qtdInput.value);
    for (let i = 1; i <= qtd; i++) {
      const div = document.createElement('div');
      div.innerHTML = `
        <h4>Matrícula ${i}</h4>
        <input type="text" class="matricula" placeholder="Matrícula (números)">
        <input type="text" class="inicio" placeholder="Período Inicial (MM/AAAA)">
        <input type="text" class="fim" placeholder="Período Final (MM/AAAA)">
      `;
      container.appendChild(div);
    }
  }

  qtdInput.addEventListener('change', atualizarCampos);
  atualizarCampos();

  // Função para parsear período
  function parsePeriodo(str) {
    const [mes, ano] = str.split('/').map(Number);
    return { mes, ano };
  }

  // Função gerar períodos
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

  // Função baixar PDF
  async function baixarEPDF(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
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
        const inicio = parsePeriodo(inicioElems[i].value.trim());
        const fim = parsePeriodo(fimElems[i].value.trim());

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