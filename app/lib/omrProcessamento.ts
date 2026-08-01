import { GRID, gerarCoordenadasBolhas } from "./gabaritoLayout";

// Tamanho da imagem "corrigida" (depois de endireitar a perspectiva).
// Usamos uma proporção A4 em pixels, arbitrária mas consistente.
export const LARGURA_CORRIGIDA = 800;
export const ALTURA_CORRIGIDA = Math.round((297 / 210) * LARGURA_CORRIGIDA); // proporção A4

type Ponto = { x: number; y: number };

// 1. Encontra contornos que parecem ser as âncoras (quadrados pretos sólidos)
export function encontrarAncoras(cv: any, matCinza: any): Ponto[] {
  const binaria = new cv.Mat();
  cv.threshold(matCinza, binaria, 80, 255, cv.THRESH_BINARY_INV);

  const contornos = new cv.MatVector();
  const hierarquia = new cv.Mat();
  cv.findContours(binaria, contornos, hierarquia, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const candidatos: { ponto: Ponto; area: number }[] = [];

  for (let i = 0; i < contornos.size(); i++) {
    const contorno = contornos.get(i);
    const area = cv.contourArea(contorno);
    const rect = cv.boundingRect(contorno);
    const aspecto = rect.width / rect.height;

    // âncoras são quadrados sólidos: área razoável e aspecto ~1:1
    if (area > 300 && area < 8000 && aspecto > 0.7 && aspecto < 1.3) {
      candidatos.push({
        ponto: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
        area,
      });
    }
    contorno.delete();
  }

  binaria.delete();
  contornos.delete();
  hierarquia.delete();

  if (candidatos.length < 4) return [];

  // pega os 4 maiores candidatos (mais confiáveis)
  candidatos.sort((a, b) => b.area - a.area);
  const quatroMaiores = candidatos.slice(0, 4).map((c) => c.ponto);

  return ordenarPontosCantos(quatroMaiores);
}

// Ordena 4 pontos na ordem: superior-esquerda, superior-direita, inferior-direita, inferior-esquerda
function ordenarPontosCantos(pontos: Ponto[]): Ponto[] {
  const somaXY = pontos.map((p) => p.x + p.y);
  const difXY = pontos.map((p) => p.x - p.y);

  const supEsq = pontos[somaXY.indexOf(Math.min(...somaXY))];
  const infDir = pontos[somaXY.indexOf(Math.max(...somaXY))];
  const supDir = pontos[difXY.indexOf(Math.max(...difXY))];
  const infEsq = pontos[difXY.indexOf(Math.min(...difXY))];

  return [supEsq, supDir, infDir, infEsq];
}

// 2. Corrige a perspectiva usando as 4 âncoras como referência
export function corrigirPerspectiva(cv: any, matOriginal: any, cantos: Ponto[]): any {
  const origem = cv.matFromArray(4, 1, cv.CV_32FC2, [
    cantos[0].x, cantos[0].y,
    cantos[1].x, cantos[1].y,
    cantos[2].x, cantos[2].y,
    cantos[3].x, cantos[3].y,
  ]);

  const destino = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    LARGURA_CORRIGIDA, 0,
    LARGURA_CORRIGIDA, ALTURA_CORRIGIDA,
    0, ALTURA_CORRIGIDA,
  ]);

  const matrizTransformacao = cv.getPerspectiveTransform(origem, destino);
  const corrigida = new cv.Mat();
  const tamanho = new cv.Size(LARGURA_CORRIGIDA, ALTURA_CORRIGIDA);

  cv.warpPerspective(matOriginal, corrigida, matrizTransformacao, tamanho);

  origem.delete();
  destino.delete();
  matrizTransformacao.delete();

  return corrigida;
}

// 3. Lê o preenchimento de cada bolha, comparando as coordenadas do layout
//    (convertidas de mm para pixels da imagem já corrigida)
export function lerRespostas(cv: any, matBinaria: any): Record<number, string | null> {
  const coordenadas = gerarCoordenadasBolhas();
  const respostas: Record<number, string | null> = {};

  // fator de conversão: mm do papel A4 -> pixels da imagem corrigida
  const fatorX = LARGURA_CORRIGIDA / 210; // 210mm = largura A4
  const fatorY = ALTURA_CORRIGIDA / 297; // 297mm = altura A4
  const raioPx = Math.round(GRID.raioBolhaMm * fatorX * 0.8); // um pouco menor que o desenho, pra não pegar a borda

  const valoresPorQuestao: Record<number, { alt: string; pixels: number }[]> = {};

  coordenadas.forEach(({ questao, alternativa, xMm, yMm }) => {
    const cx = Math.round(xMm * fatorX);
    const cy = Math.round(yMm * fatorY);

    const mascara = cv.Mat.zeros(matBinaria.rows, matBinaria.cols, cv.CV_8UC1);
    cv.circle(mascara, new cv.Point(cx, cy), raioPx, new cv.Scalar(255), -1);

    const resultado = new cv.Mat();
    cv.bitwise_and(matBinaria, matBinaria, resultado, mascara);
    const pixelsPreenchidos = cv.countNonZero(resultado);

    if (!valoresPorQuestao[questao]) valoresPorQuestao[questao] = [];
    valoresPorQuestao[questao].push({ alt: alternativa, pixels: pixelsPreenchidos });

    mascara.delete();
    resultado.delete();
  });

  const LIMIAR_MINIMO = 40; // ajuste conforme testes reais

  Object.entries(valoresPorQuestao).forEach(([questaoStr, alternativas]) => {
    const questao = Number(questaoStr);
    const maiorValor = Math.max(...alternativas.map((a) => a.pixels));

    if (maiorValor < LIMIAR_MINIMO) {
      respostas[questao] = null; // em branco
    } else {
      const marcada = alternativas.find((a) => a.pixels === maiorValor);
      respostas[questao] = marcada?.alt ?? null;
    }
  });

  return respostas;
}