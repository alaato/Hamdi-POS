import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { Sale, CartItem } from '../types';

// FIX: The module augmentation for 'jspdf' was causing a build error,
// likely due to missing @types/jspdf or a project configuration issue.
// The augmentation has been commented out, and type assertions `(doc as any)`
// are used below to bypass the type check for `lastAutoTable`.
/*
// Extend the jsPDF interface for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}
*/

const placeholderImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAWSURBVDhPY/z//z8DbsAEpAYSAwD29g4g3wLqRAAAAABJRU5ErkJggg==';

// Base64 encoded SVG logo for "POS Glass"
const logoBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyODNFNTEiIHJ4PSI4IiByeT0iOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iI0ZGRkZGRiIgZm9udC13ZWlnaHQ9ImJvbGQiPlBPUzx0c3BhbiBmaWxsPSIjNEI3OUExIj4gR2xhc3M8L3RzcGFuPjwvdGV4dD48L3N2Zz4=';


const urlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } else {
                resolve(placeholderImg);
            }
        };
        img.onerror = () => {
            resolve(placeholderImg);
        };
        img.src = url;
    });
};

// PDF Export for Sales Report
export const exportSalesToPDF = async (sales: Sale[], settings: { currency: string }, dateRange: { start: string, end: string }) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    const getSaleProfit = (sale: Sale): number => {
        const totalCost = sale.items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
        return sale.finalTotal - totalCost;
    };

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalTotal, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + getSaleProfit(sale), 0);
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const numberOfTransactions = sales.length;
    
    const saleItems = sales.flatMap(sale =>
        sale.items.map(item => ({
            ...item,
            date: sale.date,
            user: sale.user,
        }))
    );
    
    const [logoPngBase64, ...images] = await Promise.all([
        urlToBase64(logoBase64),
        ...saleItems.map(item => item.image ? urlToBase64(item.image) : Promise.resolve(placeholderImg))
    ]);

    const body = saleItems.map(item => [
        '', // Image placeholder
        item.name,
        new Date(item.date).toLocaleString(),
        item.user,
        item.quantity,
        `${settings.currency}${item.price.toFixed(2)}`,
        `${settings.currency}${(item.price * item.quantity).toFixed(2)}`,
        `${settings.currency}${((item.price * item.quantity) - ((item.cost || 0) * item.quantity)).toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['', 'Product', 'Date', 'User', 'Qty', 'Price', 'Total', 'Profit']],
        body: body,
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 0) {
                const imgData = images[data.row.index];
                if (imgData) {
                    const imgProps = doc.getImageProperties(imgData);
                    const imgWidth = 10;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                    const x = data.cell.x + (data.cell.width - imgWidth) / 2;
                    const y = data.cell.y + (data.cell.height - imgHeight) / 2;
                    doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                }
            }
        },
        didDrawPage: (data) => {
            // Header
            doc.addImage(logoPngBase64, 'PNG', 14, 12, 35, 12);

            doc.setFontSize(22);
            doc.setTextColor('#4B79A1'); // Accent color
            doc.text("Sales Report", pageWidth - 14, 22, { align: 'right' });

            doc.setFontSize(9);
            doc.setTextColor(100);
            const dateRangeText = `Date Range: ${dateRange.start || 'Start of records'} to ${dateRange.end || 'Today'}`;
            doc.text(dateRangeText, pageWidth - 14, 28, { align: 'right' });
            
            // Summary (only on the first page)
            if (data.pageNumber === 1) {
                doc.setFontSize(12);
                doc.setTextColor('#283E51');
                doc.text("Report Summary", 14, 45);
                doc.setDrawColor('#4B79A1'); // Accent color for line
                doc.setLineWidth(0.5);
                doc.line(14, 47, pageWidth - 14, 47);

                doc.setFontSize(10);
                doc.setTextColor(40);
                const summaryY = 55;
                const summaryText = `Total Revenue: ${settings.currency}${totalRevenue.toFixed(2)}  |  Total Profit: ${settings.currency}${totalProfit.toFixed(2)}  |  Items Sold: ${totalItemsSold}  |  Transactions: ${numberOfTransactions}`;
                doc.text(summaryText, 14, summaryY, { maxWidth: pageWidth - 28 });
            }

            // Footer
            const pageCount = doc.getNumberOfPages ? doc.getNumberOfPages() : 1;
            doc.setDrawColor('#4B79A1'); // Accent color for line
            doc.setLineWidth(0.2);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, pageHeight - 10);
        },
        startY: 70,
        theme: 'grid',
        tableLineColor: [224, 229, 236], // Corresponds to 'primary' color
        styles: { minCellHeight: 15, valign: 'middle', fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' }
        },
        headStyles: {
            fillColor: '#4B79A1',
            textColor: '#FFFFFF',
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: '#F5F7FA'
        },
        margin: { top: 35, bottom: 20 }
    });
    
    const pageCount = doc.getNumberOfPages ? doc.getNumberOfPages() : 1;
    if (pageCount > 1) {
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    }

    doc.save('sales-report.pdf');
};

// Excel Export for Sales Report
export const exportSalesToExcel = (sales: Sale[], settings: { currency: string }) => {
    const worksheetData = sales.flatMap(sale =>
        sale.items.map(item => ({
            'Product': item.name,
            'Date': new Date(sale.date).toLocaleString(),
            'User': sale.user,
            'Quantity': item.quantity,
            'Price': item.price,
            'Total': item.price * item.quantity,
            'Profit': (item.price - (item.cost || 0)) * item.quantity,
        }))
    );
    const worksheet = utils.json_to_sheet(worksheetData);

    // Add currency formatting
    worksheet['!cols'] = [ {wch:25}, {wch:20}, {wch:15}, {wch:10}, {wch:10}, {wch:10}, {wch:10} ];
    worksheetData.forEach((_row, index) => {
        const i = index + 2; // +1 for 1-based index, +1 for header row
        const priceCell = `E${i}`;
        const totalCell = `F${i}`;
        const profitCell = `G${i}`;
        if(worksheet[priceCell]) worksheet[priceCell].z = `"${settings.currency}"#,##0.00`;
        if(worksheet[totalCell]) worksheet[totalCell].z = `"${settings.currency}"#,##0.00`;
        if(worksheet[profitCell]) worksheet[profitCell].z = `"${settings.currency}"#,##0.00`;
    });

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sales by Item");
    writeFile(workbook, "sales-report-by-item.xlsx");
};


// PDF Export for a single receipt
export const exportReceiptPDF = (sale: Sale, settings: { currency: string }) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [80, 297] // Thermal receipt paper width
    });

    const leftMargin = 5;
    let y = 10;

    doc.setFontSize(12);
    doc.text("Store Receipt", 40, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(8);
    doc.text(`Sale ID: ${sale.id}`, leftMargin, y);
    y += 5;
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`, leftMargin, y);
    y += 5;
    doc.text(`Cashier: ${sale.user}`, leftMargin, y);
    y += 7;

    autoTable(doc, {
        startY: y,
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: sale.items.map((item: CartItem) => [
            item.name,
            item.quantity,
            item.price.toFixed(2),
            (item.quantity * item.price).toFixed(2),
        ]),
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1 },
        headStyles: { fontStyle: 'bold' },
        margin: { left: leftMargin },
        tableWidth: 70
    });

    // FIX: Use type assertion to access `lastAutoTable` which is added by the jspdf-autotable plugin.
    y = (doc as any).lastAutoTable.finalY + 7;

    const summary: (string[])[] = [
        ['Subtotal:', `${settings.currency}${sale.total.toFixed(2)}`],
    ];
    
    summary.push(
        ['Discount:', `${settings.currency}${sale.discount.toFixed(2)}`],
        ['TOTAL:', `${settings.currency}${sale.finalTotal.toFixed(2)}`],
    );
    
    autoTable(doc, {
        startY: y,
        body: summary,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold' },
            1: { halign: 'right' },
        },
        margin: { left: leftMargin },
        tableWidth: 70
    });
    
    // FIX: Use type assertion to access `lastAutoTable` which is added by the jspdf-autotable plugin.
    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text("Thank you for your purchase!", 40, y, { align: 'center' });

    doc.save(`receipt-${sale.id}.pdf`);
};