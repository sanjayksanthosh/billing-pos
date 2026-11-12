import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { SaleInvoice } from '../types';

export async function exportInvoicesToCsv(invoices: SaleInvoice[]): Promise<boolean> {
  if (!invoices || invoices.length === 0) {
    throw new Error('No invoices to export');
  }

  const headers = [
    'Invoice Number',
    'Date',
    'Time',
    'Payment Method',
    'Customer Name',
    'Customer Phone',
    'Items Count',
    'Item Summary',
    'Subtotal',
    'Discount Amount',
    'Tax Amount',
    'Grand Total',
    'Cash Received',
    'Change Due'
  ];

  const rows = invoices.map((inv) => {
    const d = new Date(inv.createdAt);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0];
    const itemSummary = inv.items
      .map((it) => `${it.product.name} (x${it.quantity})`)
      .join('; ');

    return [
      escapeCsvField(inv.invoiceNumber),
      escapeCsvField(dateStr),
      escapeCsvField(timeStr),
      escapeCsvField(inv.paymentMethod),
      escapeCsvField(inv.customer?.name || ''),
      escapeCsvField(inv.customer?.phone || ''),
      inv.items.reduce((acc, it) => acc + it.quantity, 0),
      escapeCsvField(itemSummary),
      inv.subtotal.toFixed(2),
      inv.discountAmount.toFixed(2),
      inv.taxAmount.toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.amountReceived.toFixed(2),
      inv.changeDue.toFixed(2)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  if (Platform.OS === 'web') {
    // Web download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `POS_Sales_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  // Native iOS / Android via File and Paths
  const fileName = `POS_Sales_${new Date().toISOString().slice(0, 10)}_${Date.now()}.csv`;
  const file = new File(Paths.cache, fileName);
  file.create();
  file.write(csvContent);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Sales CSV',
      UTI: 'public.comma-separated-values-text',
    });
    return true;
  } else {
    return false;
  }
}

function escapeCsvField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return `"${val}"`;
}
