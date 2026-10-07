import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegEyeSlash } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { api, assetUrl } from "../../api";
import { getThemePreference, setThemePreference } from "../../theme";
import defaultAvatar from "../../assets/default-user-icon.webp";

const errorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

// Message de retour sous un formulaire (succès ou erreur)
const Feedback = ({ status }) => {
  if (!status) return null;
  return (
    <div role="alert" className={`alert alert-soft ${status.type === "success" ? "alert-success" : "alert-error"}`}>
      {status.message}
    </div>
  );
};

const PasswordInput = ({ registration, placeholder, hasError }) => {
  const [hidden, setHidden] = useState(true);
  return (
    <label className={`input w-full ${hasError ? "input-error" : ""}`}>
      <input type={hidden ? "password" : "text"} placeholder={placeholder} {...registration} />
      <button
        type="button"
        onClick={() => setHidden(!hidden)}
        aria-label={hidden ? "Afficher le mot de passe" : "Masquer le mot de passe"}
        className="hover:scale-110 transition duration-150"
      >
        {hidden ? <FaRegEyeSlash /> : <MdOutlineRemoveRedEye />}
      </button>
    </label>
  );
};

const ProfileSection = ({ currentUser, onSaved }) => {
  const [status, setStatus] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: { name: currentUser.name, email: currentUser.email },
  });

  useEffect(() => {
    reset({ name: currentUser.name, email: currentUser.email });
  }, [currentUser.name, currentUser.email, reset]);

  const onSubmit = async (data) => {
    setStatus(null);
    try {
      await api.put("/api/users/me", { name: data.name.trim(), email: data.email.trim() });
      await onSaved();
      setStatus({ type: "success", message: "Profil mis à jour" });
    } catch (error) {
      setStatus({ type: "error", message: errorMessage(error, "Erreur lors de la mise à jour du profil") });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Nom</legend>
        <input
          {...register("name", {
            required: "Le nom est requis",
            minLength: { value: 2, message: "Minimum 2 caractères" },
            maxLength: { value: 50, message: "Maximum 50 caractères" },
          })}
          type="text"
          className={`input w-full ${errors.name ? "input-error" : ""}`}
        />
        {errors.name && <p className="label text-error">{errors.name.message}</p>}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Email</legend>
        <input
          {...register("email", {
            required: "L'email est requis",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Adresse email invalide" },
          })}
          type="email"
          className={`input w-full ${errors.email ? "input-error" : ""}`}
        />
        {errors.email && <p className="label text-error">{errors.email.message}</p>}
      </fieldset>

      <Feedback status={status} />
      <button type="submit" disabled={isSubmitting || !isDirty} className="btn btn-primary self-start mt-2">
        {isSubmitting ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
};

const AvatarSection = ({ currentUser, onSaved }) => {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setStatus(null);

    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: "error", message: "Image trop lourde (2 Mo maximum)" });
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    setBusy(true);
    try {
      await api.post("/api/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await onSaved();
      setStatus({ type: "success", message: "Photo de profil mise à jour" });
    } catch (error) {
      setStatus({ type: "error", message: errorMessage(error, "Erreur lors de l'envoi de la photo") });
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const handleRemove = async () => {
    setStatus(null);
    setBusy(true);
    try {
      await api.delete("/api/users/me/avatar");
      await onSaved();
      setStatus({ type: "success", message: "Photo de profil supprimée" });
    } catch (error) {
      setStatus({ type: "error", message: errorMessage(error, "Erreur lors de la suppression") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="avatar">
          <div className="w-24 rounded-full ring-2 ring-base-300">
            <img src={assetUrl(currentUser.avatar_url) || defaultAvatar} alt="Photo de profil" className="object-cover" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            disabled={busy}
            className="file-input"
            aria-label="Choisir une photo de profil"
          />
          <p className="label">JPG, PNG ou WebP, 2 Mo maximum</p>
          {currentUser.avatar_url && (
            <button type="button" onClick={handleRemove} disabled={busy} className="btn btn-ghost btn-sm self-start">
              Retirer la photo
            </button>
          )}
        </div>
      </div>
      <Feedback status={status} />
    </div>
  );
};

const PasswordSection = () => {
  const [status, setStatus] = useState(null);
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    setStatus(null);
    try {
      await api.put("/api/users/me/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      setStatus({ type: "success", message: "Mot de passe modifié" });
    } catch (error) {
      setStatus({ type: "error", message: errorMessage(error, "Erreur lors du changement de mot de passe") });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Mot de passe actuel</legend>
        <PasswordInput
          registration={register("currentPassword", { required: "Mot de passe actuel requis" })}
          placeholder="Mot de passe actuel"
          hasError={!!errors.currentPassword}
        />
        {errors.currentPassword && <p className="label text-error">{errors.currentPassword.message}</p>}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Nouveau mot de passe</legend>
        <PasswordInput
          registration={register("newPassword", {
            required: "Nouveau mot de passe requis",
            minLength: { value: 8, message: "Minimum 8 caractères" },
          })}
          placeholder="Nouveau mot de passe"
          hasError={!!errors.newPassword}
        />
        {errors.newPassword && <p className="label text-error">{errors.newPassword.message}</p>}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Confirmation</legend>
        <PasswordInput
          registration={register("confirmPassword", {
            required: "Confirmation requise",
            validate: (value) => value === newPassword || "Les mots de passe ne correspondent pas",
          })}
          placeholder="Confirmer le nouveau mot de passe"
          hasError={!!errors.confirmPassword}
        />
        {errors.confirmPassword && <p className="label text-error">{errors.confirmPassword.message}</p>}
      </fieldset>

      <Feedback status={status} />
      <button type="submit" disabled={isSubmitting} className="btn btn-primary self-start mt-2">
        {isSubmitting ? "Modification..." : "Changer le mot de passe"}
      </button>
    </form>
  );
};

const THEME_OPTIONS = [
  { value: "system", label: "Système" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

const ThemeSection = () => {
  const [theme, setTheme] = useState(getThemePreference);

  const handleChange = (value) => {
    setTheme(value);
    setThemePreference(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="join" role="radiogroup" aria-label="Thème">
        {THEME_OPTIONS.map((option) => (
          <input
            key={option.value}
            type="radio"
            name="theme"
            className="join-item btn"
            aria-label={option.label}
            checked={theme === option.value}
            onChange={() => handleChange(option.value)}
          />
        ))}
      </div>
      <p className="label">« Système » suit le réglage clair / sombre de votre ordinateur.</p>
    </div>
  );
};

const Section = ({ title, description, children }) => (
  <section className="card bg-base-100 border border-base-300">
    <div className="card-body gap-4">
      <div>
        <h2 className="card-title">{title}</h2>
        {description && <p className="text-sm text-base-content/70">{description}</p>}
      </div>
      {children}
    </div>
  </section>
);

const SettingsPage = () => {
  const { user: authUser, checkAuth } = useAuth();
  const currentUser = authUser?.user;

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-4xl font-bold">Paramètres</h1>

      <Section title="Profil" description="Votre nom et votre email de connexion.">
        <ProfileSection currentUser={currentUser} onSaved={checkAuth} />
      </Section>

      <Section title="Photo de profil">
        <AvatarSection currentUser={currentUser} onSaved={checkAuth} />
      </Section>

      <Section title="Sécurité" description="Le mot de passe actuel est demandé pour en définir un nouveau.">
        <PasswordSection />
      </Section>

      <Section title="Préférences">
        <ThemeSection />
      </Section>
    </div>
  );
};

export default SettingsPage;
