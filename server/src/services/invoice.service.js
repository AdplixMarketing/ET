import PDFDocument from 'pdfkit';

export function generateInvoicePDF(invoice, user) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100; // 50px margin each side
    const rightCol = 350;

    // ─── Accent bar at top ───
    doc.rect(0, 0, pageWidth, 6).fill('#4A90E2');

    // ─── Header section ───
    const headerY = 40;

    // Business name (large, bold)
    doc.fontSize(22).fillColor('#1C1C1E')
      .text(user.business_name || 'My Business', 50, headerY);

    // Business email
    doc.fontSize(9).fillColor('#8E8E93')
      .text(user.email, 50, headerY + 28);

    // INVOICE label + number (right side)
    doc.fontSize(32).fillColor('#4A90E2')
      .text('INVOICE', rightCol, headerY, { align: 'right', width: contentWidth - rightCol + 50 });
    doc.fontSize(11).fillColor('#8E8E93')
      .text(invoice.invoice_number, rightCol, headerY + 38, { align: 'right', width: contentWidth - rightCol + 50 });

    // ─── Divider ───
    const dividerY = 100;
    doc.moveTo(50, dividerY).lineTo(pageWidth - 50, dividerY)
      .strokeColor('#E5E5EA').lineWidth(1).stroke();

    // ─── Bill To + Dates section ───
    const infoY = 118;

    // Bill To (left)
    doc.fontSize(8).fillColor('#4A90E2').font('Helvetica-Bold')
      .text('BILL TO', 50, infoY);
    doc.fontSize(13).fillColor('#1C1C1E').font('Helvetica-Bold')
      .text(invoice.client_name, 50, infoY + 16);
    if (invoice.client_email) {
      doc.fontSize(9).fillColor('#8E8E93').font('Helvetica')
        .text(invoice.client_email, 50, infoY + 34);
    }

    // Dates (right side, stacked)
    doc.fontSize(8).fillColor('#4A90E2').font('Helvetica-Bold')
      .text('ISSUE DATE', rightCol, infoY, { align: 'right', width: contentWidth - rightCol + 50 });
    doc.fontSize(10).fillColor('#1C1C1E').font('Helvetica')
      .text(formatDate(invoice.issue_date), rightCol, infoY + 14, { align: 'right', width: contentWidth - rightCol + 50 });

    doc.fontSize(8).fillColor('#4A90E2').font('Helvetica-Bold')
      .text('DUE DATE', rightCol, infoY + 34, { align: 'right', width: contentWidth - rightCol + 50 });
    doc.fontSize(10).fillColor('#1C1C1E').font('Helvetica')
      .text(formatDate(invoice.due_date), rightCol, infoY + 48, { align: 'right', width: contentWidth - rightCol + 50 });

    // Status badge
    const statusColors = { draft: '#8E8E93', sent: '#4A90E2', paid: '#34C759', overdue: '#FF3B30' };
    const statusColor = statusColors[invoice.status] || '#8E8E93';
    const statusText = invoice.status.toUpperCase();
    const statusY = infoY + 70;

    // Badge background
    const badgeWidth = doc.widthOfString(statusText) + 20;
    const badgeX = pageWidth - 50 - badgeWidth;
    doc.roundedRect(badgeX, statusY, badgeWidth, 20, 4).fill(statusColor);
    doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold')
      .text(statusText, badgeX, statusY + 7, { width: badgeWidth, align: 'center' });

    // ─── Line items table ───
    let tableY = 220;

    // Table header background
    doc.rect(50, tableY, contentWidth, 28).fill('#F8F9FB');

    // Table header text
    doc.fontSize(8).fillColor('#8E8E93').font('Helvetica-Bold');
    doc.text('DESCRIPTION', 62, tableY + 9, { width: 240 });
    doc.text('QTY', 310, tableY + 9, { width: 50, align: 'center' });
    doc.text('RATE', 370, tableY + 9, { width: 80, align: 'right' });
    doc.text('AMOUNT', 460, tableY + 9, { width: 80, align: 'right' });

    tableY += 34;

    // Table rows
    doc.font('Helvetica');
    let isAlt = false;
    for (const item of invoice.items) {
      // Alternating row background
      if (isAlt) {
        doc.rect(50, tableY - 4, contentWidth, 26).fill('#FAFBFC');
      }

      doc.fontSize(10).fillColor('#1C1C1E');
      doc.text(item.description, 62, tableY + 2, { width: 240 });
      doc.fillColor('#6B7280');
      doc.text(String(item.quantity), 310, tableY + 2, { width: 50, align: 'center' });
      doc.text(`$${parseFloat(item.rate).toFixed(2)}`, 370, tableY + 2, { width: 80, align: 'right' });
      doc.fillColor('#1C1C1E').font('Helvetica-Bold');
      doc.text(`$${parseFloat(item.amount).toFixed(2)}`, 460, tableY + 2, { width: 80, align: 'right' });
      doc.font('Helvetica');

      tableY += 26;
      isAlt = !isAlt;
    }

    // Bottom line under table
    doc.moveTo(50, tableY + 2).lineTo(pageWidth - 50, tableY + 2)
      .strokeColor('#E5E5EA').lineWidth(1).stroke();

    // ─── Totals section (right-aligned) ───
    tableY += 18;
    const totalsX = 370;
    const totalsValX = 460;
    const totalsW = 80;

    // Subtotal
    doc.fontSize(10).fillColor('#8E8E93').font('Helvetica')
      .text('Subtotal', totalsX, tableY, { width: totalsW, align: 'right' });
    doc.fillColor('#1C1C1E')
      .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, totalsValX, tableY, { width: totalsW, align: 'right' });

    // Tax
    if (parseFloat(invoice.tax_rate) > 0) {
      tableY += 22;
      doc.fillColor('#8E8E93')
        .text(`Tax (${invoice.tax_rate}%)`, totalsX, tableY, { width: totalsW, align: 'right' });
      doc.fillColor('#1C1C1E')
        .text(`$${parseFloat(invoice.tax_amount).toFixed(2)}`, totalsValX, tableY, { width: totalsW, align: 'right' });
    }

    // Total (highlighted)
    tableY += 28;
    const totalLabel = 'TOTAL';
    const totalValue = `$${parseFloat(invoice.total).toFixed(2)}`;
    doc.font('Helvetica-Bold');
    const labelWidth = doc.fontSize(12).widthOfString(totalLabel);
    const valueWidth = doc.fontSize(14).widthOfString(totalValue);
    const gap = 20;
    const padX = 16;
    const padY = 6;
    const totalTextWidth = labelWidth + gap + valueWidth;
    const totalBoxW = totalTextWidth + padX * 2;
    const totalBoxH = 16 + padY * 2;
    const totalBoxX = pageWidth - 50 - totalBoxW;
    const textY = tableY - 4 + (totalBoxH - 14) / 2 + 2;

    doc.roundedRect(totalBoxX, tableY - 4, totalBoxW, totalBoxH, 6).fill('#4A90E2');
    doc.fontSize(12).fillColor('#FFFFFF')
      .text(totalLabel, totalBoxX + padX, textY);
    doc.fontSize(14)
      .text(totalValue, totalBoxX + padX + labelWidth + gap, textY - 1);

    // ─── Notes ───
    if (invoice.notes) {
      tableY += 56;
      doc.fontSize(8).fillColor('#4A90E2').font('Helvetica-Bold')
        .text('NOTES', 50, tableY);
      doc.fontSize(9).fillColor('#6B7280').font('Helvetica')
        .text(invoice.notes, 50, tableY + 16, { width: 350, lineGap: 3 });
    }

    // ─── Footer ───
    const footerY = tableY + 40;

    doc.moveTo(50, footerY).lineTo(pageWidth - 50, footerY)
      .strokeColor('#E5E5EA').lineWidth(0.5).stroke();

    doc.fontSize(8).fillColor('#B0B7C3').font('Helvetica')
      .text('Thank you for your business.', 50, footerY + 8, { align: 'center', width: contentWidth });
    doc.fontSize(7).fillColor('#CCD0D7')
      .text('Generated with AddFi', 50, footerY + 20, { align: 'center', width: contentWidth });

    doc.end();
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
