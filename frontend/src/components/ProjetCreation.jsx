import { useRef } from "react";
import { useForm } from "react-hook-form";
import { api } from '../api.js';
import { emit, PROJECTS_CHANGED } from '../events.js';

const ProjetCreation = () => {
  const modalCheckboxRef = useRef(null);
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const description = watch("description") || "";

  const onSubmit = async (data) => {
    try {
      const projectData = {
        title: data.title.trim(),
        description: data.description.trim() || null
      };

      const response = await api.post('/api/projects', projectData);

      if (response.status === 201) {
        reset();
        if (modalCheckboxRef.current) {
          modalCheckboxRef.current.checked = false;
        }
        emit(PROJECTS_CHANGED);
      }

    } catch (error) {
      console.error("Erreur création projet:", error);
      if (error.response?.data?.message) {
        alert(`Erreur: ${error.response.data.message}`);
      } else {
        alert("Erreur lors de la création du projet");
      }
    }
  };

  return (
    <div>
      <input ref={modalCheckboxRef} type="checkbox" id="projet-modal" className="modal-toggle" />
      <div className="modal backdrop-blur-lg transition-all duration-100 ease-in-out" role="dialog">
        <div className="modal-box flex flex-col justify-center items-center bg-base-100 rounded-2xl shadow-lg p-10 w-[420px]">
          <h2 className="text-3xl font-bold text-center mb-6">
            Créer un projet
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-base-content">
                Intitulé du projet *
              </label>
              <input
                {...register("title", { required: "Intitulé du projet obligatoire" })}
                type="text"
                required
                placeholder="Intitulé du projet"
                className="border border-base-300 rounded-md px-3 py-2 text-sm"
              />
              {errors.title && (
                <p className="text-error text-sm">{errors.title.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-base-content">
                Description
              </label>
              <textarea
                {...register("description")}
                placeholder="Description"
                maxLength={350}
                className="border border-base-300 rounded-md px-3 py-2 text-sm h-24 resize-none"
              />
              {errors.description && (
                <p className="text-error text-sm">{errors.description.message}</p>
              )}
              <p className="text-xs text-base-content/70 text-right">
                {description.length}/350 caractères
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-primary hover:bg-red-secondary text-white font-medium py-2.5 rounded-md mt-2 transition-colors">
              {isSubmitting ? "Création..." : "Créer le projet"}
            </button>
          </form>
        </div>
        <label className="modal-backdrop" htmlFor="projet-modal">Close</label>
      </div>
    </div>
  );
};

export default ProjetCreation;