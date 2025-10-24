import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CV, UniversityCareer, SkillLevel } from '../types';
import { fetchCVByOwnerId, saveCV } from '../services/cvService';
import TechnicalSkillSelector from './TechnicalSkillSelector';
import { 
  OFFICE_SOFTWARE_OPTIONS, 
  TECHNICAL_LANGUAGES_OPTIONS, 
  DESIGN_SOFTWARE_OPTIONS, 
  PROGRAMMING_MECHATRONICS_OPTIONS, 
  MANAGEMENT_SYSTEMS_OPTIONS,
  COMPLEMENTARY_KNOWLEDGE_OPTIONS
} from '../constants/technicalSkills';

type CVBuilderProps = {
  ownerId: string;
  title?: string;
  backLink?: string;
  defaultEmail?: string;
};

const CVBuilder: React.FC<CVBuilderProps> = ({ ownerId, title = 'Constructor de CV', backLink, defaultEmail = '' }) => {
  const storageKey = useMemo(() => `cv_${ownerId}`, [ownerId]);

  const [cv, setCv] = useState<CV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!storageKey || !ownerId) return;
      setLoading(true);
      setError(null);
      const { cv: dbCV } = await fetchCVByOwnerId(ownerId);
      if (dbCV) {
        const merged = {
          ...dbCV,
          personal: {
            firstName: dbCV.personal.firstName || '',
            lastName: dbCV.personal.lastName || '',
            email: dbCV.personal.email || defaultEmail || '',
            phone: dbCV.personal.phone || '',
            dni: dbCV.personal.dni || '',
          },
        } as CV;
        setCv(merged);
      } else {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) setCv(JSON.parse(raw));
          else setCv({
            ownerId,
            personal: { firstName: '', lastName: '', email: defaultEmail, phone: '', dni: '' },
            profileSummary: '',
            careerObjectives: '',
            links: {},
            education: [],
            experience: [],
            projects: [],
            languages: [],
          });
        } catch {
          setCv({
            ownerId,
            personal: { firstName: '', lastName: '', email: defaultEmail, phone: '', dni: '', birthDate: '', locality: '' },
            profileSummary: '',
            careerObjectives: '',
            links: {},
            education: [],
            universityEducation: [],
            experience: [],
            projects: [],
            languages: [],
            technicalSkills: {
              office: [],
              languages: [],
              design: [],
              programming: [],
              managementSystems: []
            },
            trainingCourses: [],
            complementaryKnowledge: [],
          });
        }
      }
      setLoading(false);
    };
    run();
  }, [storageKey, ownerId, defaultEmail]);

  if (loading) {
    return <div className="text-center text-gray-600">Cargando CV...</div>;
  }

  const update = (path: string, value: any) => {
    if (!cv) return;
    const next = { ...cv } as any;
    const keys = path.split('.');
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    setCv(next);
  };

  const addItem = (key: keyof CV | string) => {
    if (!cv) return;
    const next = { ...cv } as any;
    const defaults: any = {
        education: { institution: '', degree: '', start: '', end: '' },
        universityEducation: { 
          career: UniversityCareer.INGENIERIA_INDUSTRIAL, 
          university: '', 
          approvedSubjects: 0, 
          totalSubjects: 0, 
          startYear: new Date().getFullYear(),
          graduationYear: new Date().getFullYear()
        },
        experience: { company: '', role: '', responsibilities: '', start: '', end: '' },
        projects: { title: '', description: '', technologies: [], link: '' },
        languages: { name: '', written: 'Intermedio', spoken: 'Intermedio' },
        'technicalSkills.office': { name: '', level: SkillLevel.BASICO },
        'technicalSkills.languages': { language: '', level: SkillLevel.BASICO },
        'technicalSkills.design': { name: '', level: SkillLevel.BASICO },
        'technicalSkills.programming': { name: '', level: SkillLevel.BASICO },
        'technicalSkills.managementSystems': { name: '', level: SkillLevel.BASICO },
        trainingCourses: { 
          name: '', 
          institution: '', 
          duration: 0, 
          year: new Date().getFullYear(), 
          certified: false, 
          description: '' 
        },
      };
    
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      if (!next[parent]) next[parent] = {};
      if (!next[parent][child]) next[parent][child] = [];
      next[parent][child] = [...next[parent][child], defaults[key]];
    } else {
      next[key] = [...(next[key] || []), defaults[key]];
    }
    setCv(next);
  };

  const removeItem = (key: keyof CV | string, idx: number) => {
    if (!cv) return;
    const next = { ...cv } as any;
    
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      next[parent][child] = next[parent][child].filter((_: any, i: number) => i !== idx);
    } else {
      next[key] = next[key].filter((_: any, i: number) => i !== idx);
    }
    setCv(next);
  };

  // Función para validar fecha DD/MM/YYYY
  const validateDate = (date: string): boolean => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = date.match(regex);
    if (!match) return false;
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    return true;
  };

  const validateDni = (dni: string): boolean => {
    return /^\d{7,9}$/.test((dni || '').trim());
  };

  // Lista de localidades argentinas (muestra)
  const argentineLocalities = [
    'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán',
    'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Neuquén',
    'Santiago del Estero', 'Corrientes', 'Posadas', 'Bahía Blanca', 'Paraná',
    'Formosa', 'San Luis', 'La Rioja', 'Catamarca', 'Río Gallegos', 'Ushuaia'
  ];

  // Lista de universidades argentinas (muestra)
  const argentineUniversities = [
    'Universidad de Buenos Aires (UBA)', 'Universidad Nacional de Córdoba (UNC)',
    'Universidad Nacional de La Plata (UNLP)', 'Universidad Tecnológica Nacional (UTN)',
    'Universidad Nacional de Rosario (UNR)', 'Universidad Nacional de Cuyo (UNCuyo)',
    'Universidad Nacional del Litoral (UNL)', 'Universidad Nacional de Tucumán (UNT)',
    'Universidad Nacional del Sur (UNS)', 'Universidad Nacional de Mar del Plata (UNMdP)'
  ];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo excede 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCv((prev) => (prev ? { ...prev, pdfFileName: file.name, pdfDataUrl: reader.result as string } : prev));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!cv) return;
    setError(null);

    // Validación: DNI obligatorio y formato correcto
    if (!cv.personal?.dni || !validateDni(cv.personal.dni)) {
      setError('El DNI es obligatorio y debe tener entre 7 y 9 dígitos.');
      return;
    }

    // Validación: fechas de experiencia en formato MM/YYYY si están presentes
    const mmYYYY = /^(0[1-9]|1[0-2])\/\d{4}$/;
    const invalidExp = (cv.experience || []).find((ex) => {
      const start = (ex.start || '').trim();
      const end = (ex.end || '').trim();
      const startInvalid = start && !mmYYYY.test(start);
      const endInvalid = end && !mmYYYY.test(end);
      return startInvalid || endInvalid;
    });
    if (invalidExp) {
      setError('Fechas de experiencia deben estar en formato MM/YYYY.');
      return;
    }

    setSaving(true);
    const res = await saveCV(ownerId, cv);
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo guardar el CV');
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(cv));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {backLink && (
          <Link to={backLink} className="btn btn--outline btn--sm">← Volver</Link>
        )}
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {saved && <div className="text-green-600">CV guardado</div>}

      {cv && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Información personal</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Nombre</label>
                <input className="w-full border rounded p-2" value={cv.personal.firstName} onChange={(e) => update('personal.firstName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Apellidos</label>
                <input className="w-full border rounded p-2" value={cv.personal.lastName} onChange={(e) => update('personal.lastName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Email</label>
                <input type="email" className="w-full border rounded p-2" value={cv.personal.email} onChange={(e) => update('personal.email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">D.N.I (solo números)</label>
                <input 
                  className={`w-full border rounded p-2 ${cv.personal.dni && !validateDni(cv.personal.dni) ? 'border-red-500' : ''}`}
                  inputMode="numeric"
                  pattern="[0-9]{7,9}"
                  placeholder="########"
                  value={cv.personal.dni}
                  onChange={(e) => update('personal.dni', e.target.value)}
                />
                {(!cv.personal.dni || !validateDni(cv.personal.dni)) && (
                  <p className="text-red-500 text-xs mt-1">Ingrese un DNI válido (7 a 9 dígitos)</p>
                )}
              </div>
              <div>
                <label className="block text-sm">Teléfono</label>
                <input className="w-full border rounded p-2" value={cv.personal.phone} onChange={(e) => update('personal.phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Fecha de nacimiento (DD/MM/YYYY)</label>
                <input 
                  className={`w-full border rounded p-2 ${cv.personal.birthDate && !validateDate(cv.personal.birthDate || '') ? 'border-red-500' : ''}`}
                  placeholder="DD/MM/YYYY"
                  value={cv.personal.birthDate || ''} 
                  onChange={(e) => update('personal.birthDate', e.target.value)} 
                />
                {cv.personal.birthDate && !validateDate(cv.personal.birthDate) && (
                  <p className="text-red-500 text-xs mt-1">Formato inválido. Use DD/MM/YYYY</p>
                )}
              </div>
              <div>
                <label className="block text-sm">Localidad</label>
                <input 
                  className="w-full border rounded p-2" 
                  list="localities"
                  value={cv.personal.locality || ''} 
                  onChange={(e) => update('personal.locality', e.target.value)} 
                />
                <datalist id="localities">
                  {argentineLocalities.map((locality, idx) => (
                    <option key={idx} value={locality} />
                  ))}
                </datalist>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Descripción del perfil (opcional)</h2>
              <textarea
                className="w-full border rounded p-3 min-h-[140px]"
                placeholder="Escribe un resumen profesional, destacando tu experiencia, fortalezas y foco."
                value={cv.profileSummary || ''}
                onChange={(e) => update('profileSummary', e.target.value)}
                rows={6}
              />
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Objetivos laborales</h2>
              <textarea
                className="w-full border rounded p-3 min-h-[120px]"
                placeholder="Detalla tus metas profesionales, áreas de interés y tipo de rol deseado."
                value={cv.careerObjectives || ''}
                onChange={(e) => update('careerObjectives', e.target.value)}
                rows={5}
              />
            </section>
          </div>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Conocimientos Técnicos</h2>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
              {/* Conocimientos de Ofimática */}
              <div>
                <h3 className="text-md font-medium mb-3">Software de Ofimática</h3>
                <TechnicalSkillSelector
                  category="office"
                  predefinedOptions={OFFICE_SOFTWARE_OPTIONS}
                  selectedSkills={cv.technicalSkills?.office || []}
                  onSkillsChange={(skills) => {
                    setCv({ 
                      ...cv, 
                      technicalSkills: { 
                        ...cv.technicalSkills, 
                        office: skills 
                      } 
                    });
                  }}
                  placeholder="Buscar software de ofimática (Word, Excel, PowerPoint...)"
                />
              </div>

              {/* Conocimientos de Idiomas */}
              <div>
                <h3 className="text-md font-medium mb-3">Idiomas</h3>
                <TechnicalSkillSelector
                  category="languages"
                  predefinedOptions={TECHNICAL_LANGUAGES_OPTIONS}
                  selectedSkills={cv.technicalSkills?.languages?.map(lang => ({ 
                    name: lang.language, 
                    level: lang.level 
                  })) || []}
                  onSkillsChange={(skills) => {
                    setCv({ 
                      ...cv, 
                      technicalSkills: { 
                        ...cv.technicalSkills, 
                        languages: skills.map(skill => ({ 
                          language: skill.name, 
                          level: skill.level 
                        }))
                      } 
                    });
                  }}
                  placeholder="Buscar idiomas (Inglés, Francés, Alemán...)"
                />
              </div>

              {/* Conocimientos de Diseño */}
              <div>
                <h3 className="text-md font-medium mb-3">Software de Diseño</h3>
                <TechnicalSkillSelector
                  category="design"
                  predefinedOptions={DESIGN_SOFTWARE_OPTIONS}
                  selectedSkills={cv.technicalSkills?.design || []}
                  onSkillsChange={(skills) => {
                    setCv({ 
                      ...cv, 
                      technicalSkills: { 
                        ...cv.technicalSkills, 
                        design: skills 
                      } 
                    });
                  }}
                  placeholder="Buscar software de diseño (Photoshop, Illustrator, AutoCAD...)"
                />
              </div>

              {/* Conocimientos de Programación y Mecatrónica */}
              <div>
                <h3 className="text-md font-medium mb-3">Programación y Mecatrónica</h3>
                <TechnicalSkillSelector
                  category="programming"
                  predefinedOptions={PROGRAMMING_MECHATRONICS_OPTIONS}
                  selectedSkills={cv.technicalSkills?.programming || []}
                  onSkillsChange={(skills) => {
                    setCv({ 
                      ...cv, 
                      technicalSkills: { 
                        ...cv.technicalSkills, 
                        programming: skills 
                      } 
                    });
                  }}
                  placeholder="Buscar tecnologías (Python, PLC, MATLAB, CAD...)"
                />
              </div>

              {/* Sistemas de Gestión */}
              <div>
                <h3 className="text-md font-medium mb-3">Sistemas de Gestión</h3>
                <TechnicalSkillSelector
                  category="managementSystems"
                  predefinedOptions={MANAGEMENT_SYSTEMS_OPTIONS}
                  selectedSkills={cv.technicalSkills?.managementSystems || []}
                  onSkillsChange={(skills) => {
                    setCv({ 
                      ...cv, 
                      technicalSkills: { 
                        ...cv.technicalSkills, 
                        managementSystems: skills 
                      } 
                    });
                  }}
                  placeholder="Buscar sistemas de gestión (SAP, ERP, CRM...)"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Características personales</h2>
            </div>
            <TechnicalSkillSelector
              category="personal_characteristics"
              predefinedOptions={COMPLEMENTARY_KNOWLEDGE_OPTIONS}
              selectedSkills={cv.complementaryKnowledge || []}
              onSkillsChange={(skills) => setCv({ ...cv, complementaryKnowledge: skills })}
            />
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Cursos de Capacitación</h2>
              <button onClick={() => addItem('trainingCourses')} className="btn btn--action btn--sm">Agregar</button>
            </div>
            <div className="space-y-4">
              {cv.trainingCourses?.map((course, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border rounded">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del curso</label>
                    <input 
                      className="w-full border rounded p-2" 
                      value={course.name} 
                      onChange={(e) => {
                        const arr = [...(cv.trainingCourses || [])];
                        arr[idx] = { ...course, name: e.target.value };
                        setCv({ ...cv, trainingCourses: arr });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Institución</label>
                    <input 
                      className="w-full border rounded p-2" 
                      value={course.institution} 
                      onChange={(e) => {
                        const arr = [...(cv.trainingCourses || [])];
                        arr[idx] = { ...course, institution: e.target.value };
                        setCv({ ...cv, trainingCourses: arr });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duración (horas)</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="w-full border rounded p-2" 
                      value={course.duration} 
                      onChange={(e) => {
                        const arr = [...(cv.trainingCourses || [])];
                        arr[idx] = { ...course, duration: parseInt(e.target.value) || 0 };
                        setCv({ ...cv, trainingCourses: arr });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Año</label>
                    <input 
                      type="number" 
                      min="1950" 
                      max={new Date().getFullYear()} 
                      className="w-full border rounded p-2" 
                      value={course.year} 
                      onChange={(e) => {
                        const arr = [...(cv.trainingCourses || [])];
                        arr[idx] = { ...course, year: parseInt(e.target.value) || new Date().getFullYear() };
                        setCv({ ...cv, trainingCourses: arr });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Certificado</label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input 
                        type="checkbox" 
                        checked={course.certified} 
                        onChange={(e) => {
                          const arr = [...(cv.trainingCourses || [])];
                          arr[idx] = { ...course, certified: e.target.checked };
                          setCv({ ...cv, trainingCourses: arr });
                        }} 
                      />
                      <span className="text-sm">Sí</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea 
                      className="w-full border rounded p-2" 
                      rows={2}
                      value={course.description} 
                      onChange={(e) => {
                        const arr = [...(cv.trainingCourses || [])];
                        arr[idx] = { ...course, description: e.target.value };
                        setCv({ ...cv, trainingCourses: arr });
                      }} 
                    />
                  </div>
                  <div className="md:col-span-6 flex justify-end">
                    <button onClick={() => removeItem('trainingCourses', idx)} className="btn btn--danger btn--sm">Borrar curso</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Formación universitaria</h2>
              <button onClick={() => addItem('universityEducation')} className="btn btn--action btn--sm">Agregar</button>
            </div>
            <div className="space-y-4">
              {cv.universityEducation?.map((edu, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4 border rounded">
                  <div>
                    <label className="block text-sm font-medium mb-1">Carrera</label>
                    <select 
                      className="w-full border rounded p-2" 
                      value={edu.career} 
                      onChange={(e) => {
                        const arr = [...(cv.universityEducation || [])];
                        arr[idx] = { ...edu, career: e.target.value as UniversityCareer };
                        setCv({ ...cv, universityEducation: arr });
                      }}
                    >
                      {Object.values(UniversityCareer).map((career) => (
                        <option key={career} value={career}>{career}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Universidad</label>
                    <input 
                      className="w-full border rounded p-2" 
                      list="universities"
                      value={edu.university} 
                      onChange={(e) => {
                        const arr = [...(cv.universityEducation || [])];
                        arr[idx] = { ...edu, university: e.target.value };
                        setCv({ ...cv, universityEducation: arr });
                      }} 
                    />
                    <datalist id="universities">
                      {argentineUniversities.map((uni, uniIdx) => (
                        <option key={uniIdx} value={uni} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Materias aprobadas</label>
                    <input 
                      type="number" 
                      min="0" 
                      className={`w-full border rounded p-2 ${edu.approvedSubjects > edu.totalSubjects ? 'border-red-500' : ''}`}
                      value={edu.approvedSubjects} 
                      onChange={(e) => {
                        const arr = [...(cv.universityEducation || [])];
                        arr[idx] = { ...edu, approvedSubjects: parseInt(e.target.value) || 0 };
                        setCv({ ...cv, universityEducation: arr });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total materias</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="w-full border rounded p-2" 
                      value={edu.totalSubjects} 
                      onChange={(e) => {
                        const arr = [...(cv.universityEducation || [])];
                        arr[idx] = { ...edu, totalSubjects: parseInt(e.target.value) || 0 };
                        setCv({ ...cv, universityEducation: arr });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Año ingreso</label>
                    <input 
                      type="number" 
                      min="1950" 
                      max={new Date().getFullYear()} 
                      className="w-full border rounded p-2" 
                      value={edu.startYear} 
                      onChange={(e) => {
                        const arr = [...(cv.universityEducation || [])];
                        arr[idx] = { ...edu, startYear: parseInt(e.target.value) || new Date().getFullYear() };
                        setCv({ ...cv, universityEducation: arr });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Año egreso</label>
                    <input 
                      type="number" 
                      min="1950" 
                      max={new Date().getFullYear()} 
                      className="w-full border rounded p-2" 
                      value={edu.graduationYear} 
                      onChange={(e) => {
                        const arr = [...(cv.universityEducation || [])];
                        arr[idx] = { ...edu, graduationYear: parseInt(e.target.value) || new Date().getFullYear() };
                        setCv({ ...cv, universityEducation: arr });
                      }} 
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => removeItem('universityEducation', idx)} className="btn btn--danger btn--sm w-full">Borrar</button>
                  </div>
                  {edu.approvedSubjects > edu.totalSubjects && (
                    <div className="md:col-span-7">
                      <p className="text-red-500 text-xs">Las materias aprobadas no pueden ser más que el total</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Características personales</h2>
            </div>
            <TechnicalSkillSelector
              category="personal_characteristics"
              predefinedOptions={COMPLEMENTARY_KNOWLEDGE_OPTIONS}
              selectedSkills={cv.complementaryKnowledge || []}
              onSkillsChange={(skills) => setCv({ ...cv, complementaryKnowledge: skills })}
            />
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-lg font-semibold mb-2">CV en PDF (opcional, máx 5MB)</h2>
            <input type="file" accept="application/pdf" onChange={handleFile} />
            {cv.pdfFileName && (
              <p className="text-sm text-gray-600 mt-2">Archivo cargado: {cv.pdfFileName}</p>
            )}
          </section>
        </div>
      )}

      <div>
        <button onClick={save} disabled={saving || loading} className="btn btn--success btn--md">{saving ? 'Guardando...' : 'Guardar CV'}</button>
      </div>
    </div>
  );
};

export default CVBuilder;