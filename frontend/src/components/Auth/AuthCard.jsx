import logo from "../../assets/Logo_wikiPi.png"

// Cadre des pages hors connexion (mot de passe oublié, réinitialisation...)
const AuthCard = ({ title, children }) => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <div className="bg-base-100 flex flex-col items-center p-8 w-full max-w-sm drop-shadow-2xl rounded-md border border-base-300">
      <img src={logo} alt="Logo" className="mb-4" />
      <h1 className="text-3xl font-bold self-start mb-4">{title}</h1>
      {children}
    </div>
  </div>
)

export default AuthCard
