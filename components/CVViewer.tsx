import React from 'react';
import { CV } from '../types';

/**
 * CVViewer
 * Muestra un CV en formato legible y consistente, sin lógica de edición.
 * Props:
 * - cv: Objeto CV con datos personales, educación, experiencia, proyectos, skills e idiomas.
 * - className?: clases adicionales para el contenedor.
 */
interface CVViewerProps {
  cv: CV;
  className?: string;
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="section-title">{title}</h2>
);

const CVViewer: React.FC<CVViewerProps> = ({ cv, className }) => {
  return (
    <div className={className || ''}>
      {/* Personal */}
      <div className="card">
        <SectionTitle title="Información personal" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Nombre</div>
            <div className="font-medium">{cv.personal.firstName} {cv.personal.lastName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Email</div>
            <div className="font-medium">{cv.personal.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Teléfono</div>
            <div className="font-medium">{cv.personal.phone}</div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="card">
        <SectionTitle title="Enlaces profesionales" />
        <div className="space-y-2">
          {cv.links?.linkedin && <div><span className="text-sm text-gray-600">LinkedIn: </span><a href={cv.links.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{cv.links.linkedin}</a></div>}
          {cv.links?.github && <div><span className="text-sm text-gray-600">GitHub: </span><a href={cv.links.github} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{cv.links.github}</a></div>}
          {cv.links?.portfolio && <div><span className="text-sm text-gray-600">Portafolio: </span><a href={cv.links.portfolio} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{cv.links.portfolio}</a></div>}
        </div>
      </div>

      {/* Education */}
      <div className="card">
        <SectionTitle title="Formación académica" />
        <div className="space-y-3">
          {(cv.education || []).map((ed, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{ed.institution}</div>
              <div className="text-gray-600">— {ed.degree}</div>
              <div className="text-gray-500">({ed.start} - {ed.end})</div>
            </div>
          ))}
          {(!cv.education || cv.education.length === 0) && (
            <div className="text-gray-500 text-sm">Sin elementos</div>
          )}
        </div>
      </div>

      {/* Experience */}
      <div className="card">
        <SectionTitle title="Experiencia laboral" />
        <div className="space-y-3">
          {(cv.experience || []).map((ex, idx) => (
            <div key={idx} className="space-y-1">
              <div className="font-medium">{ex.company} — {ex.role}</div>
              {ex.responsibilities && <div className="text-gray-700 text-sm">{ex.responsibilities}</div>}
              <div className="text-gray-500 text-sm">{ex.start} - {ex.end}</div>
            </div>
          ))}
          {(!cv.experience || cv.experience.length === 0) && (
            <div className="text-gray-500 text-sm">Sin elementos</div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="card">
        <SectionTitle title="Proyectos" />
        <div className="space-y-3">
          {(cv.projects || []).map((p, idx) => (
            <div key={idx} className="space-y-1">
              <div className="font-medium">{p.title}</div>
              <div className="text-gray-700 text-sm">{p.description}</div>
              {Array.isArray(p.technologies) && p.technologies.length > 0 && (
                <div className="text-gray-600 text-sm">Tech: {p.technologies.join(', ')}</div>
              )}
              {p.link && <a href={p.link} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Ver proyecto</a>}
            </div>
          ))}
          {(!cv.projects || cv.projects.length === 0) && (
            <div className="text-gray-500 text-sm">Sin elementos</div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="card">
        <SectionTitle title="Habilidades" />
        <div className="flex flex-wrap gap-2">
          {(cv.skills || []).map((s, idx) => (
            <span key={idx} className="inline-block bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">{s.name} (nivel {s.level ?? ''})</span>
          ))}
          {(!cv.skills || cv.skills.length === 0) && (
            <div className="text-gray-500 text-sm">Sin elementos</div>
          )}
        </div>
      </div>

      {/* Languages */}
      <div className="card">
        <SectionTitle title="Idiomas" />
        <div className="flex flex-wrap gap-2">
          {(cv.languages || []).map((l, idx) => (
            <span key={idx} className="inline-block bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">{l.name} (Escrito: {l.written} / Oral: {l.spoken})</span>
          ))}
          {(!cv.languages || cv.languages.length === 0) && (
            <div className="text-gray-500 text-sm">Sin elementos</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVViewer;