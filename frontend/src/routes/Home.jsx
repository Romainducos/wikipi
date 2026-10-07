import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import MainWelcomeCard from "../components/MainWelcomeCard"
import ActualitySection from "../components/ActualitySection"
import DocumentCreation from "../components/DocumentCreation"
import ProjetCreation from "../components/ProjetCreation"
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const Home = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await api.get('/auth/home')
      } catch (err) {
        console.error(err)
        navigate("/login")
      }
    }

    fetchUser()
  }, [navigate])

  return (
    <Sidebar>
      <header >
        <Navbar />
      </header>
      <main>
        <div className="border m-6 mt-26 rounded-xl border-dashed border-gray-300 bg-white">
          <MainWelcomeCard />
          <ActualitySection />
        </div>
        <DocumentCreation />
        <ProjetCreation />
      </main>
    </Sidebar >
  )
}

export default Home
