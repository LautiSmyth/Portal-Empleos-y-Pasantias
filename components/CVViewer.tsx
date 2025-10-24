import React from 'react';
import { CV, SkillLevel } from '../types';

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

const stripParens = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, '').trim();

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
            <div className="text-sm text-gray-600">D.N.I</div>
            <div className="font-medium">{cv.personal.dni}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Teléfono</div>
            <div className="font-medium">{cv.personal.phone}</div>
          </div>
          {cv.personal.birthDate && (
            <div>
              <div className="text-sm text-gray-600">Fecha de nacimiento</div>
              <div className="font-medium">{cv.personal.birthDate}</div>
            </div>
          )}
          {cv.personal.locality && (
            <div>
              <div className="text-sm text-gray-600">Localidad</div>
              <div className="font-medium">{cv.personal.locality}</div>
            </div>
          )}
        </div>
      </div>

      {cv.profileSummary && (
        <div className="card">
          <SectionTitle title="Descripción del perfil" />
          <p className="text-gray-700 whitespace-pre-line">{cv.profileSummary}</p>
        </div>
      )}

      {cv.careerObjectives && (
        <div className="card">
          <SectionTitle title="Objetivos laborales" />
          <p className="text-gray-700 whitespace-pre-line">{cv.careerObjectives}</p>
        </div>
      )}

      {/* Links */}
      <div className="card">
        <SectionTitle title="Enlaces profesionales" />
        <div className="space-y-2">
          {cv.links?.linkedin && <div><span className="text-sm text-gray-600">LinkedIn: </span><a href={cv.links.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{cv.links.linkedin}</a></div>}
          {cv.links?.github && <div><span className="text-sm text-gray-600">GitHub: </span><a href={cv.links.github} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{cv.links.github}</a></div>}
          {cv.links?.portfolio && <div><span className="text-sm text-gray-600">Portafolio: </span><a href={cv.links.portfolio} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{cv.links.portfolio}</a></div>}
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

      {/* University Education */}
      {cv.universityEducation && cv.universityEducation.length > 0 && (
        <div className="card">
          <SectionTitle title="Formación universitaria" />
          <div className="space-y-3">
            {cv.universityEducation.map((edu, idx) => (
              <div key={idx} className="space-y-1">
                <div className="font-medium">{edu.career}</div>
                <div className="text-gray-700">{edu.university}</div>

                <div className="text-gray-600 text-sm">
                  Materias: {edu.approvedSubjects}/{edu.totalSubjects} | Año de ingreso: {edu.startYear} | Año de egreso: {edu.graduationYear}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complementary Knowledge */}
      {cv.complementaryKnowledge && cv.complementaryKnowledge.length > 0 && (
        <div className="card">
          <SectionTitle title="Características personales" />
          <div className="flex flex-wrap gap-2">
            {cv.complementaryKnowledge.map((knowledge, idx) => (
              <span key={idx} className="chip chip--blue">
                {stripParens(knowledge.name)} (nivel {knowledge.level})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {cv.technicalSkills && (
        <div className="card">
          <SectionTitle title="Conocimientos técnicos" />
          
          {/* Office Skills */}
          {cv.technicalSkills.office && cv.technicalSkills.office.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Software de Ofimática</h3>
              <div className="flex flex-wrap gap-2">
                {cv.technicalSkills.office.map((skill, idx) => (
                  <span key={idx} className="chip chip--blue">
                    {skill.name} ({skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Language Skills */}
          {cv.technicalSkills.languages && cv.technicalSkills.languages.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Idiomas</h3>
              <div className="flex flex-wrap gap-2">
                {cv.technicalSkills.languages.map((lang, idx) => (
                  <span key={idx} className="chip chip--green">
                    {lang.language} ({lang.level})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Design Skills */}
          {cv.technicalSkills.design && cv.technicalSkills.design.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Software de Diseño</h3>
              <div className="flex flex-wrap gap-2">
                {cv.technicalSkills.design.map((skill, idx) => (
                  <span key={idx} className="chip chip--purple">
                    {stripParens(skill.name)} ({skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Programming Skills */}
          {cv.technicalSkills.programming && cv.technicalSkills.programming.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Programación y Mecatrónica</h3>
              <div className="flex flex-wrap gap-2">
                {cv.technicalSkills.programming.map((skill, idx) => (
                  <span key={idx} className="chip chip--red">
                    {stripParens(skill.name)} ({skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Management Systems */}
          {cv.technicalSkills.managementSystems && cv.technicalSkills.managementSystems.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Sistemas de Gestión</h3>
              <div className="flex flex-wrap gap-2">
                {cv.technicalSkills.managementSystems.map((skill, idx) => (
                  <span key={idx} className="chip chip--yellow">
                    {stripParens(skill.name)} ({skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training Courses */}
      {cv.trainingCourses && cv.trainingCourses.length > 0 && (
        <div className="card">
          <SectionTitle title="Cursos de capacitación" />
          <div className="space-y-3">
            {cv.trainingCourses.map((course, idx) => (
              <div key={idx} className="space-y-1 border-b border-gray-200 pb-3 last:border-b-0">
                <div className="font-medium">{course.name}</div>
                <div className="text-gray-700 text-sm">{course.institution}</div>
                <div className="text-gray-600 text-sm">
                  {course.duration} horas | {course.year} 
                  {course.certified && <span className="ml-2 text-green-600">✓ Certificado</span>}
                </div>
                {course.description && (
                  <div className="text-gray-700 text-sm">{course.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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


    </div>
  );
};

export default CVViewer;