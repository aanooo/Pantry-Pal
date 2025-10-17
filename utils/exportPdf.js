import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (elementId, filename = 'pantry-report.pdf') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const generateInventoryReport = (items) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Pantry Inventory Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  doc.text(`Total Items: ${items.length}`, 20, 40);
  
  let yPos = 50;
  items.forEach((item, index) => {
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(`${index + 1}. ${item.name} - ${item.quantity} ${item.unit}`, 20, yPos);
    yPos += 10;
  });
  
  doc.save('inventory-report.pdf');
};