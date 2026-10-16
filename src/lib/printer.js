export async function printReceipt(order) {
  if (!navigator.bluetooth) {
    alert('Browser ini tidak mendukung Web Bluetooth API. Gunakan Chrome di Android, Windows, atau macOS.');
    return;
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard ESC/POS Service UUID
        { namePrefix: 'MPT' },
        { namePrefix: 'MTP' },
        { namePrefix: 'RPP' },
        { namePrefix: 'Printer' }
      ],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    const encoder = new TextEncoder();
    
    // ESC/POS Commands
    const ESC = "\x1B";
    const GS = "\x1D";
    const INIT = ESC + "@";
    const ALIGN_CENTER = ESC + "a" + "\x01";
    const ALIGN_LEFT = ESC + "a" + "\x00";
    const BOLD_ON = ESC + "E" + "\x01";
    const BOLD_OFF = ESC + "E" + "\x00";
    const CUT = GS + "V" + "\x41" + "\x00";
    
    let receiptText = "";
    receiptText += INIT;
    receiptText += ALIGN_CENTER + BOLD_ON + "WEB POS CAFE\n" + BOLD_OFF;
    receiptText += "Jl. Contoh Alamat No. 123\n\n";
    receiptText += ALIGN_LEFT;
    receiptText += `Order ID: ${order.id.substring(0,8).toUpperCase()}\n`;
    receiptText += `Meja: ${order.tableNo}\n`;
    receiptText += `Nama: ${order.customerName}\n`;
    receiptText += `Waktu: ${new Date(order.createdAt).toLocaleString('id-ID')}\n`;
    receiptText += "--------------------------------\n";
    
    order.items.forEach(item => {
      receiptText += `${item.name}\n`;
      receiptText += `${item.qty} x ${item.price.toLocaleString('id-ID')} = ${(item.qty * item.price).toLocaleString('id-ID')}\n`;
    });
    
    receiptText += "--------------------------------\n";
    receiptText += BOLD_ON + `TOTAL: Rp ${order.total.toLocaleString('id-ID')}\n` + BOLD_OFF;
    receiptText += "--------------------------------\n";
    receiptText += ALIGN_CENTER + "Terima Kasih!\n\n\n\n\n";
    receiptText += CUT;

    // Send data in chunks of 512 bytes (common MTU limit)
    const data = encoder.encode(receiptText);
    const chunkSize = 512;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
    }
    
    device.gatt.disconnect();
    return true;

  } catch (error) {
    console.error('Print failed:', error);
    if (error.name !== 'NotFoundError') {
      alert('Gagal mencetak: ' + error.message);
    }
    return false;
  }
}
