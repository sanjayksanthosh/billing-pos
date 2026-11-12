import { SaleInvoice, StoreSettings } from '../types';

export class EscPosBuilder {
  private buffer: number[] = [];
  private cols: number;

  constructor(paperWidth: '58mm' | '80mm' = '58mm') {
    this.cols = paperWidth === '80mm' ? 48 : 32;
    this.init();
  }

  init() {
    this.buffer.push(0x1B, 0x40); // ESC @ Initialize
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  alignRight() {
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean) {
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
    return this;
  }

  doubleSize(enable: boolean) {
    this.buffer.push(0x1D, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 0x3F); // ASCII or fallback '?'
    }
    return this;
  }

  line(str: string = '') {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  divider(char: string = '-') {
    this.line(char.repeat(this.cols));
    return this;
  }

  doubleDivider() {
    return this.divider('=');
  }

  // Two column text aligned left and right
  twoColumn(left: string, right: string) {
    const spaceCount = Math.max(1, this.cols - left.length - right.length);
    this.line(left + ' '.repeat(spaceCount) + right);
    return this;
  }

  feed(lines: number = 3) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  cut() {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, 0x41, 0x00); // GS V A 0 Full cut
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  getHexString(): string {
    return this.buffer.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

export function generateEscPosReceipt(
  invoice: SaleInvoice,
  settings: StoreSettings
): Uint8Array {
  const p = new EscPosBuilder(settings.paperWidth);
  const sym = settings.currencySymbol || 'Rs.';

  p.alignCenter()
    .doubleSize(true)
    .bold(true)
    .line(settings.storeName.toUpperCase())
    .doubleSize(false)
    .bold(false);

  if (settings.addressLine1) p.line(settings.addressLine1);
  if (settings.addressLine2) p.line(settings.addressLine2);
  if (settings.phone) p.line(`Phone: ${settings.phone}`);
  if (settings.gstNumber) p.line(`GSTIN: ${settings.gstNumber}`);

  p.divider();
  p.alignLeft();
  p.twoColumn(`INV: ${invoice.invoiceNumber}`, new Date(invoice.createdAt).toLocaleDateString());
  p.twoColumn(`MODE: ${invoice.paymentMethod}`, new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  if (invoice.customer && invoice.customer.name) {
    p.line(`Cust: ${invoice.customer.name} (${invoice.customer.phone || 'N/A'})`);
  }

  p.divider();
  p.twoColumn('ITEM (QTY x RATE)', 'TOTAL');
  p.divider();

  invoice.items.forEach((item) => {
    p.bold(true).line(item.product.name.slice(0, settings.paperWidth === '80mm' ? 40 : 26));
    p.bold(false);
    const qtyRate = ` ${item.quantity} ${item.product.unit || 'pcs'} x ${sym}${item.unitPrice.toFixed(2)}`;
    const lineTot = `${sym}${item.lineTotal.toFixed(2)}`;
    p.twoColumn(qtyRate, lineTot);
  });

  p.divider();
  p.twoColumn('Subtotal:', `${sym}${invoice.subtotal.toFixed(2)}`);

  if (invoice.discountAmount > 0) {
    p.twoColumn(`Discount (${invoice.discountType === 'PERCENT' ? invoice.discountValue + '%' : 'Flat'}):`, `-${sym}${invoice.discountAmount.toFixed(2)}`);
  }

  if (invoice.taxAmount > 0) {
    p.twoColumn(`GST/Tax (${invoice.taxPercent}%):`, `+${sym}${invoice.taxAmount.toFixed(2)}`);
  }

  p.doubleDivider();
  p.bold(true).doubleSize(true);
  p.twoColumn('GRAND TOTAL:', `${sym}${invoice.grandTotal.toFixed(2)}`);
  p.doubleSize(false).bold(false);
  p.doubleDivider();

  if (invoice.paymentMethod === 'CASH') {
    p.twoColumn('Cash Paid:', `${sym}${invoice.amountReceived.toFixed(2)}`);
    p.twoColumn('Change Due:', `${sym}${invoice.changeDue.toFixed(2)}`);
  }

  p.divider();
  p.alignCenter();
  p.line('THANK YOU! VISIT AGAIN');
  if (settings.upiVpa) {
    p.line(`UPI Pay: ${settings.upiVpa}`);
  }
  p.line('*** Powered by Fast POS ***');
  p.cut();

  return p.getBytes();
}
