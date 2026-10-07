import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { api } from "../../api"
import { focusAfterOpen } from "../../focusAfterOpen"

// Demande pour devenir modérateur (motivation), validée par un admin
const ModeratorRequestModal = ({ open, onClose, onSent }) => {
  const dialogRef = useRef(null)
  const [submitError, setSubmitError] = useState(null)
  const { register, handleSubmit, reset, setFocus, watch, formState: { errors, isSubmitting } } = useForm()
  const motivation = watch("motivation") || ""

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) {
      reset({ motivation: "" })
      setSubmitError(null)
      dialog.showModal()
      focusAfterOpen(dialog, () => setFocus("motivation"))
    }
    if (!open && dialog.open) dialog.close()
  }, [open, reset, setFocus])

  const onSubmit = async (data) => {
    setSubmitError(null)
    try {
      await api.post("/api/moderator-requests", { motivation: data.motivation.trim() })
      onSent()
      onClose()
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Erreur lors de l'envoi de la demande")
    }
  }

  return (
    <dialog ref={dialogRef} className="modal backdrop-blur-lg" onClose={onClose}>
      <div className="modal-box flex flex-col p-10 w-[460px]">
        <h2 className="text-2xl font-bold text-center mb-2">Devenir modérateur</h2>
        <p className="text-sm text-base-content/70 text-center mb-4">
          Les modérateurs peuvent modifier toutes les documentations et valider les propositions.
          Un administrateur examinera votre demande.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Votre motivation <span className="text-error">*</span></legend>
            <textarea
              {...register("motivation", {
                required: "Expliquez votre motivation",
                minLength: { value: 10, message: "Minimum 10 caractères" },
                maxLength: { value: 1000, message: "Maximum 1000 caractères" },
              })}
              rows="5"
              className={`textarea w-full resize-none ${errors.motivation ? "textarea-error" : ""}`}
              placeholder="Pourquoi souhaitez-vous devenir modérateur ?"
            />
            {errors.motivation && <p className="label text-error">{errors.motivation.message}</p>}
            <p className="label justify-end">{motivation.length}/1000 caractères</p>
          </fieldset>
          {submitError && <div role="alert" className="alert alert-error alert-soft">{submitError}</div>}
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-2">
            {isSubmitting ? "Envoi..." : "Envoyer la demande"}
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Fermer</button>
      </form>
    </dialog>
  )
}

export default ModeratorRequestModal
