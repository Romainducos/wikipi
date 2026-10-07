import AppLayout from "../components/Layout/AppLayout"
import SettingsPage from "../components/Settings/SettingsPage"
import { useAuthProtection } from "../hooks/useAuthProtection"

const Settings = () => {
  const { loading } = useAuthProtection()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <AppLayout>
      <main className="p-6 m-6 mt-26">
        <SettingsPage />
      </main>
    </AppLayout>
  )
}

export default Settings
