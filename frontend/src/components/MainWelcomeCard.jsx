import { emit, OPEN_PROJECT_MODAL } from '../events.js';

const MainWelcomeCard = () => {
    return (
        <div className="w-full flex justify-center mt-6">
            <div className="hero bg-red-secondary rounded-md w-95/100 h-[230px]">
                <div className="hero-content flex-col justify-between lg:flex-row w-10/10">
                    <div className="text-start">
                        <p className="text-white">La base documentaire pour le Labo</p>
                        <h1 className="text-5xl font-bold text-white">WikIpi</h1>
                    </div>
                    <div className="flex md:flex-row flex-col gap-2">
                        <button type="button" onClick={() => emit(OPEN_PROJECT_MODAL)} className="btn bg-white border-white text-red-secondary hover:bg-neutral-100">
                            Créer un nouveau projet
                        </button>
                        <button type="button" className="btn bg-white border-white text-red-secondary hover:bg-neutral-100">Devenir Modérateur</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MainWelcomeCard