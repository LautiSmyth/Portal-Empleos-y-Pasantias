import React, { useState, useEffect, useRef } from 'react';
import { SkillLevel } from '../types';

interface TechnicalSkillSelectorProps {
  category: string;
  predefinedOptions: string[];
  selectedSkills: Array<{ name: string; level: SkillLevel }>;
  onSkillsChange: (skills: Array<{ name: string; level: SkillLevel }>) => void;
  placeholder?: string;
}

const TechnicalSkillSelector: React.FC<TechnicalSkillSelectorProps> = ({
  category,
  predefinedOptions,
  selectedSkills,
  onSkillsChange,
  placeholder = "Buscar o agregar conocimiento técnico..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar opciones personalizadas del localStorage al montar el componente
  useEffect(() => {
    const storageKey = `custom_technical_skills_${category}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedOptions = JSON.parse(stored);
        setCustomOptions(Array.isArray(parsedOptions) ? parsedOptions : []);
      } catch (error) {
        console.error('Error parsing stored custom options:', error);
      }
    }
  }, [category]);

  // Guardar opciones personalizadas en localStorage
  const saveCustomOptions = (options: string[]) => {
    const storageKey = `custom_technical_skills_${category}`;
    localStorage.setItem(storageKey, JSON.stringify(options));
    setCustomOptions(options);
  };

  // Combinar opciones predefinidas y personalizadas, eliminar duplicados y ordenar
  const getAllOptions = (): string[] => {
    const allOptions = [...predefinedOptions, ...customOptions];
    const uniqueOptions = Array.from(new Set(allOptions.map(opt => opt.toLowerCase())))
      .map(lowerOpt => allOptions.find(opt => opt.toLowerCase() === lowerOpt)!)
      .filter(Boolean);
    return uniqueOptions.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  };

  // Filtrar opciones basado en el término de búsqueda
  const getFilteredOptions = (): string[] => {
    const allOptions = getAllOptions();
    if (!searchTerm.trim()) return allOptions;
    
    return allOptions.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Verificar si una opción ya está seleccionada
  const isSkillSelected = (skillName: string): boolean => {
    return selectedSkills.some(skill => 
      skill.name.toLowerCase() === skillName.toLowerCase()
    );
  };

  // Agregar una habilidad
  const addSkill = (skillName: string, level: SkillLevel = SkillLevel.BASICO) => {
    if (!skillName.trim() || isSkillSelected(skillName)) return;

    const newSkills = [...selectedSkills, { name: skillName.trim(), level }];
    onSkillsChange(newSkills);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Remover una habilidad
  const removeSkill = (skillName: string) => {
    const updatedSkills = selectedSkills.filter(skill => 
      skill.name.toLowerCase() !== skillName.toLowerCase()
    );
    onSkillsChange(updatedSkills);
  };

  // Cambiar el nivel de una habilidad
  const updateSkillLevel = (skillName: string, newLevel: SkillLevel) => {
    const updatedSkills = selectedSkills.map(skill =>
      skill.name.toLowerCase() === skillName.toLowerCase()
        ? { ...skill, level: newLevel }
        : skill
    );
    onSkillsChange(updatedSkills);
  };

  // Validar y agregar nueva opción personalizada
  const handleAddCustomOption = () => {
    const trimmedName = newSkillName.trim();
    
    if (!trimmedName) {
      alert('Por favor ingrese un nombre válido para el conocimiento técnico.');
      return;
    }

    if (trimmedName.length < 2) {
      alert('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (trimmedName.length > 50) {
      alert('El nombre no puede exceder 50 caracteres.');
      return;
    }

    // Verificar si ya existe (case-insensitive)
    const allOptions = getAllOptions();
    const exists = allOptions.some(option => 
      option.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      alert('Este conocimiento técnico ya existe en la lista.');
      return;
    }

    // Agregar a opciones personalizadas
    const updatedCustomOptions = [...customOptions, trimmedName];
    saveCustomOptions(updatedCustomOptions);

    // Agregar a habilidades seleccionadas
    addSkill(trimmedName);
    
    setNewSkillName('');
    setShowAddNew(false);
  };

  // Manejar clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddNew(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar teclas en el input de búsqueda
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const filteredOptions = getFilteredOptions();
      const exactMatch = filteredOptions.find(option => 
        option.toLowerCase() === searchTerm.toLowerCase()
      );

      if (exactMatch && !isSkillSelected(exactMatch)) {
        addSkill(exactMatch);
      } else if (searchTerm.trim() && !exactMatch) {
        // Si no hay coincidencia exacta, mostrar opción de agregar nuevo
        setShowAddNew(true);
        setNewSkillName(searchTerm.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setShowAddNew(false);
      setSearchTerm('');
    }
  };

  const filteredOptions = getFilteredOptions();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input de búsqueda */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Opciones filtradas */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => addSkill(option)}
                disabled={isSkillSelected(option)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                  isSkillSelected(option) 
                    ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                    : 'text-gray-900 cursor-pointer'
                }`}
              >
                {option}
                {isSkillSelected(option) && (
                  <span className="ml-2 text-xs text-gray-500">(ya seleccionado)</span>
                )}
              </button>
            ))
          ) : searchTerm.trim() ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No se encontraron coincidencias
            </div>
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">
              Escriba para buscar opciones
            </div>
          )}

          {/* Opción para agregar nuevo */}
          {searchTerm.trim() && !filteredOptions.some(opt => opt.toLowerCase() === searchTerm.toLowerCase()) && (
            <button
              type="button"
              onClick={() => {
                setShowAddNew(true);
                setNewSkillName(searchTerm.trim());
              }}
              className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 border-t border-gray-200"
            >
              + Agregar "{searchTerm.trim()}"
            </button>
          )}
        </div>
      )}

      {/* Modal para agregar nueva opción */}
      {showAddNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Agregar nuevo conocimiento técnico</h3>
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Nombre del conocimiento técnico"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddNew(false);
                  setNewSkillName('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomOption}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habilidades seleccionadas */}
      {selectedSkills.length > 0 && (
        <div className="mt-3 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Conocimientos seleccionados:
          </label>
          {selectedSkills.map((skill, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              <span className="text-sm">{skill.name}</span>
              <select
                aria-label={`Nivel para ${skill.name}`}
                value={skill.level}
                onChange={(e) => updateSkillLevel(skill.name, e.target.value as SkillLevel)}
                className="text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={SkillLevel.BASICO}>Básico</option>
                <option value={SkillLevel.MEDIO}>Medio</option>
                <option value={SkillLevel.AVANZADO}>Avanzado</option>
                {category === 'languages' && (
                  <option value={SkillLevel.NATIVO}>Nativo</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => removeSkill(skill.name)}
                className="ml-auto text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicalSkillSelector;