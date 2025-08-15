// File: backend/src/services/signatureService.js
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

// Recibe la ruta local del PDF (pdfPath)
// xRatio, yRatio son proporciones (0 a 1) de la posición seleccionada respecto al ancho/alto del PDF renderizado en frontend
const applySignatureToPDF = async (pdfPath, signatureBuffer, xRatio = 0.15, yRatio = 0.15) => {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Cargar imagen de firma
    const signatureImage = await pdfDoc.embedPng(signatureBuffer);

    // Obtener la primera página
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Dimensiones de la firma (ajusta si lo deseas)
    const signatureWidth = 150;
    const signatureHeight = 75;

    // Tamaño real de la página PDF
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    // Calcula coordenadas reales en puntos usando proporción
    // El punto elegido es el centro del recuadro, así que hay que centrar la imagen de la firma en ese punto
    const centerX = xRatio * pageWidth;
    const centerY = pageHeight - (yRatio * pageHeight);

    // El origen en pdf-lib es la esquina inferior izquierda, así que
    // para que el centro del recuadro coincida con el centro de la firma:
    const x = centerX - signatureWidth / 2;
    const y = centerY - signatureHeight / 2;

    // Agregar firma
    firstPage.drawImage(signatureImage, {
      x,
      y,
      width: signatureWidth,
      height: signatureHeight,
    });

    // Guardar PDF modificado
    const newPdfBytes = await pdfDoc.save();
    return Buffer.from(newPdfBytes);

  } catch (error) {
    console.error('Error al aplicar firma:', error);
    throw new Error('Error al procesar la firma en el PDF');
  }
};

module.exports = {
  applySignatureToPDF
};