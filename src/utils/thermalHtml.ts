import { SaleInvoice, StoreSettings } from '../types';

export function generateThermalReceiptHtml(
  invoice: SaleInvoice,
  settings: StoreSettings
): string {
  const is80 = settings.paperWidth === '80mm';
  const widthPx = is80 ? '72mm' : '54mm';
  const sym = settings.currencySymbol || '₹';
  const dateFormatted = new Date(invoice.createdAt).toLocaleString();

  const upiPayString = settings.upiVpa
    ? `upi://pay?pa=${encodeURIComponent(settings.upiVpa)}&am=${invoice.grandTotal.toFixed(2)}&pn=${encodeURIComponent(settings.storeName)}&tn=Bill-${invoice.invoiceNumber}`
    : '';

  // Quick QR code API link for thermal receipt footer
  const qrCodeUrl = upiPayString
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiPayString)}`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${invoice.invoiceNumber}</title>
  <style>
    @page {
      size: ${is80 ? '80mm auto' : '58mm auto'};
      margin: 0;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${is80 ? '13px' : '11px'};
      line-height: 1.25;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: ${is80 ? '8px 6px' : '6px 4px'};
      width: ${widthPx};
      max-width: ${widthPx};
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .store-title {
      font-size: ${is80 ? '17px' : '14px'};
      font-weight: 900;
      margin-bottom: 3px;
      letter-spacing: 0.5px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: monospace;
      font-size: inherit;
    }
    th, td {
      padding: 2px 0;
      vertical-align: top;
    }
    .total-row {
      font-size: ${is80 ? '15px' : '13px'};
      font-weight: bold;
    }
    .qr-container {
      margin-top: 8px;
      text-align: center;
    }
    .qr-container img {
      width: 100px;
      height: 100px;
    }
    .footer {
      font-size: 10px;
      text-align: center;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="store-title">${escapeHtml(settings.storeName)}</div>
    ${settings.addressLine1 ? `<div>${escapeHtml(settings.addressLine1)}</div>` : ''}
    ${settings.addressLine2 ? `<div>${escapeHtml(settings.addressLine2)}</div>` : ''}
    ${settings.phone ? `<div>Tel: ${escapeHtml(settings.phone)}</div>` : ''}
    ${settings.gstNumber ? `<div>GSTIN: ${escapeHtml(settings.gstNumber)}</div>` : ''}
  </div>

  <div class="divider"></div>

  <table>
    <tr>
      <td class="bold">INV: ${invoice.invoiceNumber}</td>
      <td class="text-right">${invoice.paymentMethod}</td>
    </tr>
    <tr>
      <td colspan="2" style="font-size: 10px;">${dateFormatted}</td>
    </tr>
    ${
      invoice.customer && invoice.customer.name
        ? `<tr><td colspan="2">Customer: <b>${escapeHtml(invoice.customer.name)}</b> (${invoice.customer.phone || 'N/A'})</td></tr>`
        : ''
    }
  </table>

  <div class="divider"></div>

  <table>
    <thead>
      <tr style="border-bottom: 1px solid #000;">
        <th class="text-left">ITEM</th>
        <th class="text-right" style="width: 30px;">QTY</th>
        <th class="text-right" style="width: 48px;">RATE</th>
        <th class="text-right" style="width: 55px;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map(
          (item) => `
        <tr>
          <td colspan="4" class="bold" style="padding-top: 4px;">${escapeHtml(item.product.name)}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
          <td style="font-size: 10px; color: #444;">SKU: ${item.product.sku}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${sym}${item.unitPrice.toFixed(2)}</td>
          <td class="text-right bold">${sym}${item.lineTotal.toFixed(2)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <table>
    <tr>
      <td>Subtotal:</td>
      <td class="text-right">${sym}${invoice.subtotal.toFixed(2)}</td>
    </tr>
    ${
      invoice.discountAmount > 0
        ? `<tr>
            <td>Discount (${invoice.discountType === 'PERCENT' ? invoice.discountValue + '%' : 'Flat'}):</td>
            <td class="text-right">-${sym}${invoice.discountAmount.toFixed(2)}</td>
          </tr>`
        : ''
    }
    ${
      invoice.taxAmount > 0
        ? `<tr>
            <td>GST/Tax (${invoice.taxPercent}%):</td>
            <td class="text-right">+${sym}${invoice.taxAmount.toFixed(2)}</td>
          </tr>`
        : ''
    }
  </table>

  <div class="double-divider"></div>

  <table class="total-row">
    <tr>
      <td>GRAND TOTAL:</td>
      <td class="text-right">${sym}${invoice.grandTotal.toFixed(2)}</td>
    </tr>
  </table>

  <div class="double-divider"></div>

  ${
    invoice.paymentMethod === 'CASH'
      ? `<table>
          <tr><td>Cash Received:</td><td class="text-right">${sym}${invoice.amountReceived.toFixed(2)}</td></tr>
          <tr><td>Change Returned:</td><td class="text-right bold">${sym}${invoice.changeDue.toFixed(2)}</td></tr>
        </table>
        <div class="divider"></div>`
      : ''
  }

  ${
    qrCodeUrl
      ? `<div class="qr-container">
          <img src="${qrCodeUrl}" alt="UPI QR" />
          <div style="font-size: 10px; margin-top: 2px;">Scan to Pay via UPI</div>
        </div>`
      : ''
  }

  <div class="footer">
    <div>*** THANK YOU! VISIT AGAIN ***</div>
    <div>Goods once sold cannot be returned</div>
  </div>
</body>
</html>
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
