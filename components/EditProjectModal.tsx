import React, { useState, useEffect } from 'react';
import { Project, Track, TRL, TRACKS } from '../types';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState<Project>(project);

  useEffect(() => {
    setFormData(project);
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Edit Project</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#5c11c9] focus:outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#5c11c9] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label htmlFor="track" className="block text-sm font-medium text-gray-700 mb-1">Track</label>
                  <select
                    id="track"
                    name="track"
                    value={formData.track}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#5c11c9] focus:outline-none"
                  >
                    {TRACKS.map(track => <option key={track} value={track}>{track}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="trl" className="block text-sm font-medium text-gray-700 mb-1">TRL</label>
                  <select
                    id="trl"
                    name="trl"
                    value={formData.trl}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#5c11c9] focus:outline-none"
                  >
                    <option value={TRL.IDEATION}>{TRL.IDEATION}</option>
                    <option value={TRL.PROTOTYPE}>{TRL.PROTOTYPE}</option>
                  </select>
                </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-[#5c11c9] hover:bg-[#4a0e9f] text-white font-medium transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;