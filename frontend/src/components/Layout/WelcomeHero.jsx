import { useCallback, useEffect, useState } from 'react'
import { emit, OPEN_PROJECT_MODAL } from '../../events'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../api'
import ModeratorRequestModal from './ModeratorRequestModal'

const heroButton = "btn bg-white border-white text-red-secondary hover:bg-neutral-100"

const MainWelcomeCard = () => {
    const { user: authUser } = useAuth()
    const isMember = authUser?.user.role === 'member'
    const [lastRequest, setLastRequest] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const loadRequest = useCallback(() => {
        api.get('/api/moderator-requests/mine')
            .then((res) => setLastRequest(res.data.request))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (isMember) loadRequest()
    }, [isMember, loadRequest])

    const pending = lastRequest?.status === 'pending'

    return (
        <div className="w-full flex justify-center mt-6">
            <div className="hero bg-red-secondary rounded-md w-95/100 h-[230px]">
                <div className="hero-content flex-col justify-between lg:flex-row w-10/10">
                    <div className="text-start">
                        <p className="text-white">La base documentaire pour le Labo</p>
                        <h1 className="text-5xl font-bold text-white">WikIpi</h1>
                    </div>
                    <div className="flex md:flex-row flex-col gap-2">
                        <button type="button" onClick={() => emit(OPEN_PROJECT_MODAL)} className={heroButton}>
                            Créer un nouveau projet
                        </button>
                        {isMember && pending && (
                            // Une demande en attente est une information, pas une action
                            <span role="status" className="inline-flex items-center gap-2 h-10 px-4 rounded-field bg-white text-red-secondary text-sm font-semibold">
                                <span className="loading loading-dots loading-xs" aria-hidden="true"></span>
                                Demande de modération en attente
                            </span>
                        )}
                        {isMember && !pending && (
                            <button
                                type="button"
                                className={heroButton}
                                onClick={() => setModalOpen(true)}
                                title={lastRequest?.status === 'rejected' && lastRequest.review_comment
                                    ? `Dernière demande refusée : ${lastRequest.review_comment}`
                                    : undefined}
                            >
                                Devenir Modérateur
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {isMember && (
                <ModeratorRequestModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSent={loadRequest}
                />
            )}
        </div>
    )
}

export default MainWelcomeCard
