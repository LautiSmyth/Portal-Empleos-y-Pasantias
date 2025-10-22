import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { CV } from '../types';
import { fetchCVByOwnerId, saveCV } from '../services/cvService';

const StudentCV: React.FC = () => {
  const auth = useContext(AuthContext);
  const userId = auth?.currentUser?.id;
  const storageKey = useMemo(() => (userId ? `cv_${userId}` : ''), [userId]);

  const [cv, setCv] = useState<CV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!storageKey || !userId) return;
      setLoading(true);
      setError(null);
      const { cv: dbCV } = await fetchCVByOwnerId(userId);
      if (dbCV) {
        const merged = {
          ...dbCV,
          personal: {
            firstName: dbCV.personal.firstName || '',
            lastName: dbCV.personal.lastName || '',
            email: dbCV.personal.email || auth?.currentUser?.email || '',
            phone: dbCV.personal.phone || '',
          },
        } as CV;
        setCv(merged);
      } else {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) setCv(JSON.parse(raw));
          else setCv({
            ownerId: userId!,
            personal: { firstName: '', lastName: '', email: auth?.currentUser?.email ?? '', phone: '' },
            links: {},
            education: [],
            experience: [],
            projects: [],
            skills: [],
            softSkills: [],
            languages: [],
          });
        } catch {
          setCv({
            ownerId: userId!,
            personal: { firstName: '', lastName: '', email: auth?.currentUser?.email ?? '', phone: '' },
            links: {},
            education: [],
            experience: [],
            projects: [],
            skills: [],
            softSkills: [],
            languages: [],
          });
        }
      }
      setLoading(false);
    };
    run();
  }, [storageKey, userId]);

  if (!userId) {
    return <div className="text-center text-red-600">Debes iniciar sesión como Alumno.</div>;
  }

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

  const addItem = (key: keyof CV) => {
    if (!cv) return;
    const next = { ...cv } as any;
    const defaults: any = {
      education: { institution: '', degree: '', start: '', end: '' },
      experience: { company: '', role: '', responsibilities: '', start: '', end: '' },
      projects: { title: '', description: '', technologies: [], link: '' },
      skills: { name: '', level: 3 },
      softSkills: '',
      languages: { name: '', written: 'Intermedio', spoken: 'Intermedio' },
    };
    next[key] = [...(next[key] || []), defaults[key]];
    setCv(next);
  };

  const removeItem = (key: keyof CV, idx: number) => {
    if (!cv) return;
    const next = { ...cv } as any;
    next[key] = next[key].filter((_: any, i: number) => i !== idx);
    setCv(next);
  };

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
    setSaving(true);
    const res = await saveCV(userId!, cv);
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
        <h1 className="text-2xl font-bold">Constructor de CV</h1>
        <Link to="/dashboard/student" className="text-blue-600 hover:underline">← Volver al dashboard</Link>
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
                <label className="block text-sm">Teléfono</label>
                <input className="w-full border rounded p-2" value={cv.personal.phone} onChange={(e) => update('personal.phone', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Enlaces profesionales</h2>
            <div className="space-y-3">
              <input placeholder="LinkedIn" className="w-full border rounded p-2" value={cv.links.linkedin || ''} onChange={(e) => update('links.linkedin', e.target.value)} />
              <input placeholder="GitHub" className="w-full border rounded p-2" value={cv.links.github || ''} onChange={(e) => update('links.github', e.target.value)} />
              <input placeholder="Portafolio" className="w-full border rounded p-2" value={cv.links.portfolio || ''} onChange={(e) => update('links.portfolio', e.target.value)} />
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Formación académica</h2>
              <button onClick={() => addItem('education')} className="px-3 py-1 bg-blue-600 text-white rounded">Agregar</button>
            </div>
            <div className="space-y-4">
              {cv.education.map((ed, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input placeholder="Institución" className="border rounded p-2" value={ed.institution} onChange={(e) => {
                    const arr = [...cv.education];
                    arr[idx] = { ...ed, institution: e.target.value };
                    setCv({ ...cv, education: arr });
                  }} />
                  <input placeholder="Título" className="border rounded p-2" value={ed.degree} onChange={(e) => {
                    const arr = [...cv.education];
                    arr[idx] = { ...ed, degree: e.target.value };
                    setCv({ ...cv, education: arr });
                  }} />
                  <input placeholder="Inicio" className="border rounded p-2" value={ed.start} onChange={(e) => {
                    const arr = [...cv.education];
                    arr[idx] = { ...ed, start: e.target.value };
                    setCv({ ...cv, education: arr });
                  }} />
                  <input placeholder="Fin" className="border rounded p-2" value={ed.end} onChange={(e) => {
                    const arr = [...cv.education];
                    arr[idx] = { ...ed, end: e.target.value };
                    setCv({ ...cv, education: arr });
                  }} />
                  <button onClick={() => removeItem('education', idx)} className="bg-red-500 text-white rounded px-2">Borrar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Experiencia laboral</h2>
              <button onClick={() => addItem('experience')} className="px-3 py-1 bg-blue-600 text-white rounded">Agregar</button>
            </div>
            <div className="space-y-4">
              {cv.experience.map((ex, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <input placeholder="Empresa" className="border rounded p-2" value={ex.company} onChange={(e) => {
                    const arr = [...cv.experience];
                    arr[idx] = { ...ex, company: e.target.value };
                    setCv({ ...cv, experience: arr });
                  }} />
                  <input placeholder="Puesto" className="border rounded p-2" value={ex.role} onChange={(e) => {
                    const arr = [...cv.experience];
                    arr[idx] = { ...ex, role: e.target.value };
                    setCv({ ...cv, experience: arr });
                  }} />
                  <input placeholder="Responsabilidades" className="border rounded p-2" value={ex.responsibilities} onChange={(e) => {
                    const arr = [...cv.experience];
                    arr[idx] = { ...ex, responsibilities: e.target.value };
                    setCv({ ...cv, experience: arr });
                  }} />
                  <input placeholder="Inicio" className="border rounded p-2" value={ex.start} onChange={(e) => {
                    const arr = [...cv.experience];
                    arr[idx] = { ...ex, start: e.target.value };
                    setCv({ ...cv, experience: arr });
                  }} />
                  <input placeholder="Fin" className="border rounded p-2" value={ex.end} onChange={(e) => {
                    const arr = [...cv.experience];
                    arr[idx] = { ...ex, end: e.target.value };
                    setCv({ ...cv, experience: arr });
                  }} />
                  <button onClick={() => removeItem('experience', idx)} className="bg-red-500 text-white rounded px-2">Borrar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Proyectos</h2>
              <button onClick={() => addItem('projects')} className="px-3 py-1 bg-blue-600 text-white rounded">Agregar</button>
            </div>
            <div className="space-y-4">
              {cv.projects.map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input placeholder="Título" className="border rounded p-2" value={p.title} onChange={(e) => {
                    const arr = [...cv.projects];
                    arr[idx] = { ...p, title: e.target.value };
                    setCv({ ...cv, projects: arr });
                  }} />
                  <input placeholder="Tecnologías (coma)" className="border rounded p-2" value={p.technologies.join(', ')} onChange={(e) => {
                    const arr = [...cv.projects];
                    arr[idx] = { ...p, technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) };
                    setCv({ ...cv, projects: arr });
                  }} />
                  <input placeholder="Enlace" className="border rounded p-2" value={p.link || ''} onChange={(e) => {
                    const arr = [...cv.projects];
                    arr[idx] = { ...p, link: e.target.value };
                    setCv({ ...cv, projects: arr });
                  }} />
                  <input placeholder="Descripción" className="border rounded p-2 md:col-span-2" value={p.description} onChange={(e) => {
                    const arr = [...cv.projects];
                    arr[idx] = { ...p, description: e.target.value };
                    setCv({ ...cv, projects: arr });
                  }} />
                  <button onClick={() => removeItem('projects', idx)} className="bg-red-500 text-white rounded px-2">Borrar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Habilidades</h2>
              <button onClick={() => addItem('skills')} className="px-3 py-1 bg-blue-600 text-white rounded">Agregar</button>
            </div>
            <div className="space-y-3">
              {cv.skills.map((s, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-3 items-center">
                  <input placeholder="Habilidad" className="border rounded p-2 col-span-3" value={s.name} onChange={(e) => {
                    const arr = [...cv.skills];
                    arr[idx] = { ...s, name: e.target.value };
                    setCv({ ...cv, skills: arr });
                  }} />
                  <input type="number" min={1} max={5} className="border rounded p-2" value={s.level} onChange={(e) => {
                    const arr = [...cv.skills];
                    arr[idx] = { ...s, level: Number(e.target.value) };
                    setCv({ ...cv, skills: arr });
                  }} />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Habilidades blandas</h2>
              <button onClick={() => addItem('softSkills')} className="px-3 py-1 bg-blue-600 text-white rounded">Agregar</button>
            </div>
            <div className="space-y-3">
              {cv.softSkills.map((s, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input placeholder="Comunicación, trabajo en equipo..." className="flex-1 border rounded p-2" value={s} onChange={(e) => {
                    const arr = [...cv.softSkills];
                    arr[idx] = e.target.value;
                    setCv({ ...cv, softSkills: arr });
                  }} />
                  <button onClick={() => removeItem('softSkills', idx)} className="bg-red-500 text-white rounded px-2">Borrar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Idiomas</h2>
              <button onClick={() => addItem('languages')} className="px-3 py-1 bg-blue-600 text-white rounded">Agregar</button>
            </div>
            <div className="space-y-3">
              {cv.languages.map((l, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-3">
                  <input placeholder="Idioma" className="border rounded p-2" value={l.name} onChange={(e) => {
                    const arr = [...cv.languages];
                    arr[idx] = { ...l, name: e.target.value };
                    setCv({ ...cv, languages: arr });
                  }} />
                  <input placeholder="Nivel escrito" className="border rounded p-2" value={l.written} onChange={(e) => {
                    const arr = [...cv.languages];
                    arr[idx] = { ...l, written: e.target.value };
                    setCv({ ...cv, languages: arr });
                  }} />
                  <input placeholder="Nivel oral" className="border rounded p-2" value={l.spoken} onChange={(e) => {
                    const arr = [...cv.languages];
                    arr[idx] = { ...l, spoken: e.target.value };
                    setCv({ ...cv, languages: arr });
                  }} />
                  <button onClick={() => removeItem('languages', idx)} className="bg-red-500 text-white rounded px-2">Borrar</button>
                </div>
              ))}
            </div>
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
        <button onClick={save} disabled={saving || loading} className="px-6 py-2 bg-green-600 text-white rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Guardando...' : 'Guardar CV'}</button>
      </div>
    </div>
  );
};

export default StudentCV;