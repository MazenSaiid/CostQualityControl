import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class ExportService {

  toExcel(sheets: { name: string; data: Record<string, any>[] }[], filename: string): void {
    const wb = XLSX.utils.book_new();
    for (const sheet of sheets) {
      const ws = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
    }
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  toPdf(
    title: string,
    sections: { heading: string; columns: string[]; rows: (string | number)[][] }[],
    filename: string
  ): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.setTextColor(26, 35, 126);
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120, 144, 156);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    let y = 28;
    for (const section of sections) {
      if (section.heading) {
        doc.setFontSize(11);
        doc.setTextColor(40, 53, 147);
        doc.text(section.heading, 14, y);
        y += 4;
      }
      autoTable(doc, {
        startY: y,
        head: [section.columns],
        body: section.rows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => { y = (data.cursor?.y ?? y) + 6; }
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.save(`${filename}.pdf`);
  }
}
