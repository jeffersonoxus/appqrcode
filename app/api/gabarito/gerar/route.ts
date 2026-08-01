import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import {
  MM_PARA_PT,
  PAGINA,
  ANCORA,
  QRCODE,
  GRID,
  gerarCoordenadasBolhas } from '../../../lib/gabaritoLayout';

function mmParaPt(mm: number) {
  return mm * MM_PARA_PT;
}

export async function POST(req: NextRequest) {
  const { alunoId, provaId, versao } = await req.json();

  // 1. Cria o documento PDF em tamanho A4
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([
    mmParaPt(PAGINA.larguraMm),
    mmParaPt(PAGINA.alturaMm),
  ]);
  const alturaPaginaPt = mmParaPt(PAGINA.alturaMm);

  // Função auxiliar: no PDF, o eixo Y cresce de baixo pra cima.
  // Nosso layout pensa em Y crescendo de cima pra baixo (como no papel visualmente).
  // Por isso invertemos aqui.
  function converterY(yMm: number) {
    return alturaPaginaPt - mmParaPt(yMm);
  }

  // 2. Desenha as 4 âncoras (quadrados pretos sólidos nos cantos)
  const tamanhoAncoraPt = mmParaPt(ANCORA.tamanhoMm);
  const margemPt = mmParaPt(ANCORA.margemMm);

  const posicoesAncoras = [
    { x: margemPt, y: alturaPaginaPt - margemPt - tamanhoAncoraPt }, // superior esquerda
    { x: mmParaPt(PAGINA.larguraMm) - margemPt - tamanhoAncoraPt, y: alturaPaginaPt - margemPt - tamanhoAncoraPt }, // superior direita
    { x: margemPt, y: margemPt }, // inferior esquerda
    { x: mmParaPt(PAGINA.larguraMm) - margemPt - tamanhoAncoraPt, y: margemPt }, // inferior direita
  ];

  posicoesAncoras.forEach(({ x, y }) => {
    page.drawRectangle({
      x,
      y,
      width: tamanhoAncoraPt,
      height: tamanhoAncoraPt,
      color: rgb(0, 0, 0),
    });
  });

  // 3. Gera e insere o QR Code
  const conteudoQr = `aluno_id:${alunoId};prova_id:${provaId};versao:${versao}`;
  const qrDataUrl = await QRCode.toDataURL(conteudoQr, { margin: 0 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  const qrTamanhoPt = mmParaPt(QRCODE.tamanhoMm);
  page.drawImage(qrImage, {
    x: mmParaPt(QRCODE.xMm),
    y: converterY(QRCODE.yMm) - qrTamanhoPt,
    width: qrTamanhoPt,
    height: qrTamanhoPt,
  });

  // 4. Desenha o grid de bolhas
  const coordenadas = gerarCoordenadasBolhas();
  const raioPt = mmParaPt(GRID.raioBolhaMm);

  coordenadas.forEach(({ xMm, yMm, alternativa, questao }) => {
    const xPt = mmParaPt(xMm);
    const yPt = converterY(yMm);

    // círculo (bolha) vazio, com contorno
    page.drawCircle({
      x: xPt,
      y: yPt,
      size: raioPt,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // letra da alternativa dentro da bolha (opcional, ajuda o aluno)
    page.drawText(alternativa, {
      x: xPt - 2.5,
      y: yPt - 3,
      size: 7,
      color: rgb(0, 0, 0),
    });

    // número da questão, só na primeira alternativa (A) de cada linha
    if (alternativa === "A") {
      page.drawText(String(questao), {
        x: mmParaPt(GRID.inicioXMm) - mmParaPt(12),
        y: yPt - 3,
        size: 9,
        color: rgb(0, 0, 0),
      });
    }
  });

  // 5. Retorna o PDF como resposta
  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gabarito-${alunoId}.pdf"`,
    },
  });
}