import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
	slugifyFilePart,
	toDateInputValue,
	type StatusReportPayload
} from './status-report';

/** Capture the report DOM node and download a multi-page A4 PDF. */
export async function downloadStatusReportPdf(
	element: HTMLElement,
	report: StatusReportPayload
) {
	const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		backgroundColor: '#ffffff',
		logging: false,
		windowWidth: element.scrollWidth
	});

	const imgData = canvas.toDataURL('image/png');
	const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const margin = 8;
	const contentWidth = pageWidth - margin * 2;
	const contentHeight = (canvas.height * contentWidth) / canvas.width;

	let heightLeft = contentHeight;
	let position = margin;

	pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
	heightLeft -= pageHeight - margin * 2;

	while (heightLeft > 0) {
		position = margin - (contentHeight - heightLeft);
		pdf.addPage();
		pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
		heightLeft -= pageHeight - margin * 2;
	}

	const datePart = toDateInputValue(new Date(report.generatedAt));
	const name = `status-report-${slugifyFilePart(report.project.name) || 'projeto'}-${datePart}.pdf`;
	pdf.save(name);
}
