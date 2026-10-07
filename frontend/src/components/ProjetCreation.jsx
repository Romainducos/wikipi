import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { api } from '../api.js';
import { emit, subscribe, OPEN_PROJECT_MODAL, PROJECTS_CHANGED } from '../events.js';
import { focusAfterOpen } from '../focusAfterOpen.js';

const ProjetCreation = () => {
  const dialogRef = useRef(null);
  const { register, handleSubmit, watch, reset, setFocus, formState: { errors, isSubmitting } } = useForm();
  const description = watch("description") || "";

  useEffect(() => {
    return subscribe(OPEN_PROJECT_MODAL, () => {
      dialogRef.current?.showModal();
      focusAfterOpen(() => setFocus("title"));
    });
  }, [setFocus]);

  const onSubmit = async (data) => {
    try {
      const projectData = {
        title: data.title.trim(),
        description: data.description.trim() || null
      };

      const response = await api.post('/api/projects', projectData);

      if (response.status === 201) {
        dialogRef.current?.close();
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
    <dialog
      ref={dialogRef}
      id="projet-modal"
      className="modal backdrop-blur-lg"
      onClose={() => reset()}
    >
      <div className="modal-box flex flex-col items-center p-10 w-[420px]">
        <h2 className="text-3xl font-bold text-center mb-6">
          Créer un projet
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Intitulé du projet <span className="text-error">*</span>
            </legend>
            <input
              {...register("title", { required: "Intitulé du projet obligatoire" })}
              type="text"
              placeholder="Intitulé du projet"
              className={`input w-full ${errors.title ? "input-error" : ""}`}
            />
            {errors.title && (
              <p className="label text-error">{errors.title.message}</p>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              {...register("description")}
              placeholder="Description"
              maxLength={350}
              className="textarea w-full h-24 resize-none"
            />
            <p className="label justify-end">
              {description.length}/350 caractères
            </p>
          </fieldset>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full mt-4"
          >
            {isSubmitting ? "Création..." : "Créer le projet"}
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Fermer</button>
      </form>
    </dialog>
  );
};

export default ProjetCreation;
