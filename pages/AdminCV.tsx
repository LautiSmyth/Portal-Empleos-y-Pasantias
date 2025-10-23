import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Role, CV } from '../types';
import CVViewer from '../components/CVViewer';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Pequeño contenedor para añadir acciones de exportación sobre el visor reutilizado
const AdminCV: React.FC = () => {
  const auth = useContext(AuthContext);
  if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) {
    return <div className="text-center text-red-600">Debes iniciar sesión como ADMIN.</div>;
  }

  const userId = auth.currentUser.id;
  const storageKey = `cv_${userId}`;
  const raw = localStorage.getItem(storageKey);
  const cv: CV | null = raw ? JSON.parse(raw) as CV : null;

  const handleExportPDF = () => {
    try {
      const data = cv;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      let y = 40;
      doc.setFontSize(16);
      doc.text('Currículum (ADMIN)', 40, y);
      doc.setFontSize(11);
      y += 24;
      if (data?.personal) {
        doc.text(`Nombre: ${data.personal.firstName || ''} ${data.personal.lastName || ''}`, 40, y); y += 18;
        doc.text(`Email: ${data.personal.email || ''}`, 40, y); y += 18;
        doc.text(`Teléfono: ${data.personal.phone || ''}`, 40, y); y += 24;
      }
      doc.text('Educación', 40, y); y += 16;
      (data?.education || []).forEach((ed: any) => {
        doc.text(`• ${ed.institution || ''} - ${ed.degree || ''} (${ed.start || ''} - ${ed.end || ''})`, 50, y); y += 16;
      });
      y += 8;
      doc.text('Experiencia', 40, y); y += 16;
      (data?.experience || []).forEach((ex: any) => {
        doc.text(`• ${ex.company || ''} - ${ex.role || ''} (${ex.start || ''} - ${ex.end || ''})`, 50, y); y += 16;
      });
      y += 8;
      doc.text('Proyectos', 40, y); y += 16;
      (data?.projects || []).forEach((p: any) => {
        doc.text(`• ${p.title || ''} - ${p.description || ''}`, 50, y); y += 16;
      });
      y += 8;
      doc.text('Habilidades', 40, y); y += 16;
      (data?.skills || []).forEach((s: any) => {
        doc.text(`• ${s.name || ''} (nivel ${s.level ?? ''})`, 50, y); y += 16;
      });
      y += 8;
      doc.text('Idiomas', 40, y); y += 16;
      (data?.languages || []).forEach((l: any) => {
        doc.text(`• ${l.name || ''} (Escrito: ${l.written || ''} / Oral: ${l.spoken || ''})`, 50, y); y += 16;
      });
      doc.save('CV_ADMIN.pdf');
    } catch (e) {
      alert('No se pudo exportar a PDF');
    }
  };

  const handleExportDocx = async () => {
    try {
      const data = cv;
      const children: Paragraph[] = [];
      children.push(new Paragraph({ children: [new TextRun({ text: 'Currículum (ADMIN)', bold: true, size: 28 })] }));
      children.push(new Paragraph(''));
      if (data?.personal) {
        children.push(new Paragraph(`Nombre: ${data.personal.firstName || ''} ${data.personal.lastName || ''}`));
        children.push(new Paragraph(`Email: ${data.personal.email || ''}`));
        children.push(new Paragraph(`Teléfono: ${data.personal.phone || ''}`));
        children.push(new Paragraph(''));
      }
      children.push(new Paragraph({ children: [new TextRun({ text: 'Educación', bold: true })] }));
      (data?.education || []).forEach((ed: any) => {
        children.push(new Paragraph(`• ${ed.institution || ''} - ${ed.degree || ''} (${ed.start || ''} - ${ed.end || ''})`));
      });
      children.push(new Paragraph(''));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Experiencia', bold: true })] }));
      (data?.experience || []).forEach((ex: any) => {
        children.push(new Paragraph(`• ${ex.company || ''} - ${ex.role || ''} (${ex.start || ''} - ${ex.end || ''})`));
      });
      children.push(new Paragraph(''));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Proyectos', bold: true })] }));
      (data?.projects || []).forEach((p: any) => {
        children.push(new Paragraph(`• ${p.title || ''} - ${p.description || ''}`));
      });
      children.push(new Paragraph(''));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Habilidades', bold: true })] }));
      (data?.skills || []).forEach((s: any) => {
        children.push(new Paragraph(`• ${s.name || ''} (nivel ${s.level ?? ''})`));
      });
      children.push(new Paragraph(''));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Idiomas', bold: true })] }));
      (data?.languages || []).forEach((l: any) => {
        children.push(new Paragraph(`• ${l.name || ''} (Escrito: ${l.written || ''} / Oral: ${l.spoken || ''})`));
      });
      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CV_ADMIN.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('No se pudo exportar a DOCX');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CV del ADMIN</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="btn btn-primary">Descargar PDF</button>
          <button onClick={handleExportDocx} className="btn btn-primary">Descargar DOCX</button>
        </div>
      </div>
      {/* Visor reutilizable: muestra el CV si existe */}
      {cv ? (
        <CVViewer cv={cv} className="space-y-6" />
      ) : (
        <div className="card">
          <p className="text-gray-600">No se encontró CV para este usuario. Completa el CV desde el constructor.</p>
        </div>
      )}
    </div>
  );
};

export default AdminCV;