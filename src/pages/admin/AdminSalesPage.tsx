import React from 'react';
import jsPDF from 'jspdf';
import AdminLayout from './AdminLayout';
import { salesService, type FulfilmentUpdateRow } from '@/services/salesService';
import type { CheckoutOrder } from '@/services/cartService';

type SalesItem = {
  id?: number;
  productId: string;
  name: string;
  sku: string;
  imageReference: string;
  unitPrice: number;
  quantity: number;
  fulfilmentStatus?: FulfilmentUpdateRow['status'];
  fulfilmentNote?: string;
  shippedAt?: string | null;
  updatedAt?: string | null;
};

type SalesOrder = Omit<CheckoutOrder, 'items'> & {
  fulfilmentStatus: string;
  items: SalesItem[];
};

const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

const statusOptions: FulfilmentUpdateRow['status'][] = ['pending', 'sent', 'back-order', 'manual-update', 'cancelled'];

const AdminSalesPage: React.FC = () => {
  const [orders, setOrders] = React.useState<SalesOrder[]>([]);
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<'date' | 'order' | 'customer' | 'status'>('date');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [savingItemId, setSavingItemId] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    const loaded = (await salesService.listOrdersWithFallback()) as SalesOrder[];
    setOrders(loaded);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filteredSortedOrders = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = orders.filter((o) => {
      if (!term) return true;
      return (
        o.id.toLowerCase().includes(term) ||
        o.customer.fullName.toLowerCase().includes(term) ||
        o.customer.email.toLowerCase().includes(term) ||
        o.simulatedTransactionId.toLowerCase().includes(term) ||
        o.items.some((i) => i.sku.toLowerCase().includes(term) || i.name.toLowerCase().includes(term))
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let av = '';
      let bv = '';
      if (sortKey === 'date') {
        av = a.createdAt;
        bv = b.createdAt;
      } else if (sortKey === 'order') {
        av = a.id;
        bv = b.id;
      } else if (sortKey === 'customer') {
        av = a.customer.fullName;
        bv = b.customer.fullName;
      } else {
        av = a.fulfilmentStatus;
        bv = b.fulfilmentStatus;
      }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [orders, search, sortDir, sortKey]);

  const outstanding = filteredSortedOrders.filter((o) => o.fulfilmentStatus !== 'fulfilled');

  const updateLocalItem = (itemId: number, patch: Partial<SalesItem>) => {
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        items: o.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      })),
    );
  };

  const saveItemStatus = async (item: SalesItem) => {
    if (!item.id) return;
    setSavingItemId(item.id);
    setMessage('');
    try {
      await salesService.updateItemStatus(item.id, item.fulfilmentStatus ?? 'pending', item.fulfilmentNote ?? '');
      setMessage(`Saved fulfilment update for ${item.sku}.`);
      await load();
    } catch {
      setMessage(`Unable to save fulfilment update for ${item.sku}.`);
    } finally {
      setSavingItemId(null);
    }
  };

  const exportCsv = () => {
    const rows = [
      [
        'orderId',
        'date',
        'transactionId',
        'customerName',
        'customerEmail',
        'customerPhone',
        'orderStatus',
        'sku',
        'itemName',
        'qty',
        'unitPrice',
        'lineTotal',
        'itemStatus',
        'itemNote',
        'shippedAt',
      ].join(','),
    ];

    filteredSortedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const row = [
          order.id,
          order.createdAt,
          order.simulatedTransactionId,
          order.customer.fullName,
          order.customer.email,
          order.customer.phone,
          order.fulfilmentStatus,
          item.sku,
          item.name,
          String(item.quantity),
          String(item.unitPrice),
          String(item.unitPrice * item.quantity),
          item.fulfilmentStatus ?? 'pending',
          item.fulfilmentNote ?? '',
          item.shippedAt ?? '',
        ].map((cell) => `"${String(cell).replaceAll('"', '""')}"`);
        rows.push(row.join(','));
      });
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 28;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = 36;

    const ensureSpace = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - margin) {
        doc.addPage();
        y = 36;
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Sales Fulfilment Ledger', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(`Generated: ${new Date().toLocaleString('en-AU')}`, margin, y);
    y += 16;
    doc.setTextColor(0, 0, 0);

    filteredSortedOrders.forEach((order) => {
      const rowHeight = Math.max(24, order.items.length * 18 + 16);
      const blockHeight = 34 + rowHeight + 28;
      ensureSpace(blockHeight + 10);

      // Header strip
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(210, 210, 210);
      doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Order: ${order.id}`, margin + 8, y + 14);
      doc.text(`Status: ${order.fulfilmentStatus.toUpperCase()}`, margin + 8, y + 27);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleString('en-AU')}`, margin + 180, y + 14);
      doc.text(`Txn: ${order.simulatedTransactionId}`, margin + 180, y + 27);
      doc.text(`Customer: ${order.customer.fullName}`, margin + 370, y + 14);
      doc.text(`Total: ${currency.format(order.totals.total)}`, margin + 370, y + 27);
      y += 34;

      // Main ledger row box
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, y, contentWidth, rowHeight);

      // Column layout
      const c1 = margin + 8; // sku
      const c2 = margin + 86; // item
      const c3 = margin + 285; // qty
      const c4 = margin + 325; // amount
      const c5 = margin + 390; // fulfilment
      const c6 = margin + 468; // checkbox
      const c7 = margin + 500; // signature area

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('SKU', c1, y + 11);
      doc.text('ITEM', c2, y + 11);
      doc.text('QTY', c3, y + 11);
      doc.text('AMOUNT', c4, y + 11);
      doc.text('STATUS', c5, y + 11);
      doc.text('DONE', c6, y + 11);
      doc.text('SIGN', c7, y + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let itemY = y + 24;
      order.items.forEach((item) => {
        doc.text(item.sku, c1, itemY);
        doc.text(item.name.slice(0, 34), c2, itemY);
        doc.text(String(item.quantity), c3 + 8, itemY, { align: 'right' });
        doc.text(currency.format(item.unitPrice * item.quantity), c4 + 40, itemY, { align: 'right' });
        doc.text((item.fulfilmentStatus ?? 'pending').toUpperCase(), c5, itemY);

        // Tick box per line
        doc.rect(c6, itemY - 7, 10, 10);

        // Signature / comment line per line
        doc.setDrawColor(170, 170, 170);
        doc.line(c7, itemY + 2, margin + contentWidth - 8, itemY + 2);
        itemY += 18;
      });

      y += rowHeight;

      // Bottom manual confirmation strip
      doc.setFillColor(252, 252, 252);
      doc.setDrawColor(215, 215, 215);
      doc.rect(margin, y, contentWidth, 28, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Manager completion sign-off', margin + 8, y + 11);
      doc.setFont('helvetica', 'normal');
      doc.text('Name / Signature:', margin + 8, y + 22);
      doc.line(margin + 78, y + 22, margin + 260, y + 22);
      doc.text('Date:', margin + 280, y + 22);
      doc.line(margin + 305, y + 22, margin + 390, y + 22);
      doc.text('Notes:', margin + 405, y + 22);
      doc.line(margin + 435, y + 22, margin + contentWidth - 8, y + 22);

      y += 38;
    });

    doc.save(`sales-ledger-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const importStatusesFromCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;

    const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const orderIdIdx = header.findIndex((h) => h.toLowerCase() === 'orderid');
    const skuIdx = header.findIndex((h) => h.toLowerCase() === 'sku');
    const statusIdx = header.findIndex((h) => h.toLowerCase() === 'status');
    const noteIdx = header.findIndex((h) => h.toLowerCase() === 'note');
    if (orderIdIdx < 0 || skuIdx < 0 || statusIdx < 0) {
      setMessage('CSV must contain columns: orderId, sku, status (optional note).');
      return;
    }

    const updates: FulfilmentUpdateRow[] = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const status = (cols[statusIdx] ?? 'pending') as FulfilmentUpdateRow['status'];
      if (!statusOptions.includes(status)) continue;
      updates.push({
        orderId: cols[orderIdIdx] ?? '',
        sku: cols[skuIdx] ?? '',
        status,
        note: noteIdx >= 0 ? cols[noteIdx] ?? '' : '',
      });
    }

    await salesService.bulkImportStatuses(updates);
    setMessage(`Imported ${updates.length} fulfilment updates.`);
    await load();
  };

  return (
    <AdminLayout title="Sales">
      <div className="space-y-5">
        <section className="border border-gray-800 bg-gray-950 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Search orders / customer / sku</label>
              <input
                className="w-full bg-black border border-gray-700 px-3 py-2 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sort column</label>
              <select className="w-full bg-black border border-gray-700 px-3 py-2 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
                <option value="date">Date</option>
                <option value="order">Order</option>
                <option value="customer">Customer</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sort direction</label>
              <select className="w-full bg-black border border-gray-700 px-3 py-2 text-sm" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs px-3 py-2" onClick={exportCsv}>Download CSV</button>
              <button className="btn-secondary text-xs px-3 py-2" onClick={exportPdf}>Download PDF</button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-sm">
            <label className="text-gray-300">Import status CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void importStatusesFromCsv(file);
                e.currentTarget.value = '';
              }}
            />
            <span className="text-xs text-gray-500">Columns: orderId, sku, status, note</span>
          </div>
          {message ? <p className="text-xs text-motorsport-yellow mt-2">{message}</p> : null}
        </section>

        <section className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-1">Active Fulfilment Queue</h2>
          <p className="text-sm text-gray-400 mb-4">Outstanding sales with manager override controls.</p>
          <p className="text-xs text-gray-500 mb-4">Showing {outstanding.length} active order(s).</p>

          {outstanding.length === 0 ? (
            <p className="text-sm text-gray-400">No outstanding fulfilment orders.</p>
          ) : (
            <div className="space-y-4">
              {outstanding.map((order) => (
                <div key={order.id} className="border border-gray-800 bg-black p-3">
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <p className="font-semibold text-white">{order.id}</p>
                    <p className="text-motorsport-yellow font-semibold">{currency.format(order.totals.total)}</p>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{order.customer.fullName} · {order.customer.email}</p>

                  <div className="overflow-x-auto border border-gray-800">
                    <table className="w-full text-xs min-w-[940px]">
                      <thead className="bg-gray-900 text-gray-300">
                        <tr>
                          <th className="text-left p-2">SKU</th>
                          <th className="text-left p-2">Item</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Line Total</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Manual Note</th>
                          <th className="text-left p-2">Shipped Toggle</th>
                          <th className="text-left p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id ?? `${order.id}-${item.sku}`} className="border-t border-gray-800">
                            <td className="p-2">{item.sku}</td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{currency.format(item.unitPrice * item.quantity)}</td>
                            <td className="p-2">
                              <select
                                className="bg-black border border-gray-700 px-2 py-1"
                                value={item.fulfilmentStatus ?? 'pending'}
                                onChange={(e) => updateLocalItem(item.id ?? -1, { fulfilmentStatus: e.target.value as FulfilmentUpdateRow['status'] })}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                className="bg-black border border-gray-700 px-2 py-1 w-full"
                                value={item.fulfilmentNote ?? ''}
                                onChange={(e) => updateLocalItem(item.id ?? -1, { fulfilmentNote: e.target.value })}
                                placeholder="manual update note"
                              />
                            </td>
                            <td className="p-2">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={(item.fulfilmentStatus ?? 'pending') === 'sent'}
                                  onChange={(e) => updateLocalItem(item.id ?? -1, { fulfilmentStatus: e.target.checked ? 'sent' : 'pending' })}
                                />
                                <span>{(item.fulfilmentStatus ?? 'pending') === 'sent' ? 'Shipped' : 'Not shipped'}</span>
                              </label>
                            </td>
                            <td className="p-2">
                              <button
                                className="btn-secondary text-xs px-2 py-1"
                                disabled={!item.id || savingItemId === item.id}
                                onClick={() => void saveItemStatus(item)}
                              >
                                {savingItemId === item.id ? 'Saving...' : 'Save'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-1">Banking / Transaction Ledger</h2>
          <p className="text-sm text-gray-400 mb-4">All transactions with indexed columns and item-level details.</p>

          {filteredSortedOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto border border-gray-800">
              <table className="w-full text-sm min-w-[980px]">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Order</th>
                    <th className="text-left p-2">Transaction</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Order Status</th>
                    <th className="text-left p-2">Items (SKU:status)</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedOrders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-800 align-top">
                      <td className="p-2 text-gray-300">{new Date(order.createdAt).toLocaleString('en-AU')}</td>
                      <td className="p-2 text-white">{order.id}</td>
                      <td className="p-2 text-gray-300">{order.simulatedTransactionId}</td>
                      <td className="p-2 text-gray-300">{order.customer.fullName}<div className="text-xs text-gray-500">{order.customer.email}</div></td>
                      <td className="p-2 text-gray-300">{order.fulfilmentStatus}</td>
                      <td className="p-2 text-xs text-gray-400">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.sku}-${item.id ?? 'x'}`}>{item.sku}: {item.fulfilmentStatus ?? 'pending'}</div>
                        ))}
                      </td>
                      <td className="p-2 text-right text-motorsport-yellow font-semibold">{currency.format(order.totals.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminSalesPage;
