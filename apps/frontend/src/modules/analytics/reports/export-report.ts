import jsPDF from 'jspdf'

export function exportPdfReport() {
  const doc = new jsPDF()

  doc.setFontSize(24)

  doc.text(
    'SteelTrack Executive Report',
    20,
    20
  )

  doc.setFontSize(12)

  doc.text(
    'Smart Factory Operational Analytics',
    20,
    35
  )

  doc.save('steeltrack-report.pdf')
}
