// Todas as medidas em milímetros (mm), convertidas para pontos (pt) na hora de desenhar.
// 1mm = 2.8346 pt (padrão do PDF)

export const MM_PARA_PT = 2.8346;

export const PAGINA = {
  larguraMm: 210, // A4
  alturaMm: 297,
};

// Tamanho e posição das 4 âncoras (quadrados pretos sólidos nos cantos)
export const ANCORA = {
  tamanhoMm: 10,
  margemMm: 10, // distância da borda da página
};

// Posição do QR Code de identificação (canto superior direito, abaixo da âncora)
export const QRCODE = {
  tamanhoMm: 25,
  xMm: PAGINA.larguraMm - ANCORA.margemMm - ANCORA.tamanhoMm - 30, // um pouco à esquerda da âncora direita
  yMm: 15,
};

// Configuração do grid de bolhas
export const GRID = {
  numeroQuestoes: 20,
  alternativas: ["A", "B", "C", "D", "E"],
  raioBolhaMm: 2.2,
  espacamentoColunasMm: 8,   // distância entre uma bolha e outra (A -> B -> C...)
  espacamentoLinhasMm: 9,    // distância entre uma questão e a próxima
  inicioXMm: 25,             // posição X da primeira bolha (alternativa A da questão 1)
  inicioYMm: 60,             // posição Y da primeira linha (abaixo do QR/âncoras)
};

// Gera as coordenadas (em mm) de cada bolha, questão por questão
export function gerarCoordenadasBolhas() {
  const coordenadas: {
    questao: number;
    alternativa: string;
    xMm: number;
    yMm: number;
  }[] = [];

  for (let q = 0; q < GRID.numeroQuestoes; q++) {
    const yMm = GRID.inicioYMm + q * GRID.espacamentoLinhasMm;

    GRID.alternativas.forEach((alt, i) => {
      const xMm = GRID.inicioXMm + i * GRID.espacamentoColunasMm;
      coordenadas.push({
        questao: q + 1,
        alternativa: alt,
        xMm,
        yMm,
      });
    });
  }

  return coordenadas;
}