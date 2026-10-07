import { useAuth } from "../../hooks/useAuth"

// Choix de la visibilité d'un projet (à utiliser avec react-hook-form).
// `currentGroupName` : groupe actuel du projet modifié, qui reste proposé même
// si l'utilisateur n'en fait pas partie (ex. un admin)
const VisibilityField = ({ register, currentGroupName }) => {
  const { user: authUser } = useAuth()
  const groupName = currentGroupName || authUser?.user.group_name

  const options = [
    { value: "public", label: "Public", hint: "Visible par tous les utilisateurs" },
    {
      value: "group",
      label: groupName ? `Mon groupe (${groupName})` : "Mon groupe",
      hint: groupName ? "Visible par les membres du groupe" : "Rejoignez ou créez un groupe pour l'utiliser",
      disabled: !groupName,
    },
    { value: "private", label: "Privé", hint: "Visible seulement par vous" },
  ]

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Visibilité</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 py-1 ${option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input
            type="radio"
            value={option.value}
            disabled={option.disabled}
            {...register("visibility")}
            className="radio radio-primary radio-sm mt-0.5"
          />
          <span>
            <span className="font-medium">{option.label}</span>
            <span className="block text-xs text-base-content/70">{option.hint}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export default VisibilityField
