# Extensão Baixar Contracheques

Extensão do Google Chrome para baixar contracheques de forma prática e automatizada. Permite selecionar múltiplas matrículas, períodos e tipos de contracheques, gerando um PDF final consolidado para cada matrícula.

---

## Funcionalidades

- Inserção de múltiplas matrículas.
- Seleção de períodos de forma dinâmica (início e fim).
- Tipos de contracheques:
  1. Meses de janeiro a dezembro (essa opção baixa apenas os contracheques dos respectivos meses, ignorando os demais como 13° salário, férias, prêmio, etc).
  2. Meses de janeiro a dezembro + adicionais (essa opção baixa todos os tipos de contracheque mapeados; caso encontre algum ainda não mapeado, entrar em contato com o desenvolvedor).
  3. Apenas adicionais (opção para baixar somente as folhas adicionais, como 13° salário, férias, prêmio, etc).
- Download automático de PDFs.
- Consolidação de todos os PDFs de cada matrícula em um único arquivo por matrícula.
- Validação de matrícula (apenas 8 dígitos) e período (formato `MM/AAAA`).
- Salvamento do progresso no preenchimento para evitar perda de dados ao minimizar ou fechar o popup.

---

## Instalação

1. Baixe o repositório pelo link abaixo:  
   [Baixar como .zip](https://github.com/davidvasconcellos/Baixar_Holarites/archive/refs/heads/main.zip)
2. Descompacte o arquivo `.zip`.
3. Abra o Google Chrome e vá para **Extensões > Gerenciar extensões**.
4. Ative o **Modo de desenvolvedor** no canto superior direito.
5. Clique em **Carregar sem compactação**.
6. Selecione a pasta baixada e descompactada (vide item 2).
7. Ative a extensão e fixe-a na barra de favoritos.
8. ******DESATIVE O MODO DO DESENVOLVEDOR******
9. Abra o site de holerites, clique na extensão e preencha as informações que deseja.

---

## Uso

1. Clique no ícone da extensão.
2. Insira a quantidade de matrículas e os dados de cada uma (matrícula, período inicial e final).
3. Selecione o tipo de contracheques.
4. Clique em **Baixar PDFs**.
5. Aguarde a finalização. Cada matrícula terá um PDF consolidado gerado.

---

## Licença

© 2025 David Vasconcellos. Todos os direitos reservados. 
Permissão de uso apenas. Não é permitido modificar ou redistribuir este código sem autorização do autor.

Versão 2.0.1 – 18/08/2025
