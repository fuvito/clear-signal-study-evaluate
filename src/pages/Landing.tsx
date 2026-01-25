
import { Button } from 'primereact/button'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="flex flex-column" style={{ minHeight: '80vh' }}>
      <div className="grid grid-nogutter bg-white-alpha-90 text-800">
        <div className="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center ">
            <section>
                <h1 className="text-6xl font-bold mb-3 mt-0 line-height-2">
                    <span className="block text-800 mb-1">Master Your Skills</span>
                    <span className="block text-primary">with AI Feedback</span>
                </h1>
                <p className="mt-0 mb-4 text-600 line-height-3 text-xl">
                    Practice interview questions, get instant AI-powered grading, and track your progress across React, Java, System Design and others.
                </p>

                <div className="flex gap-3 justify-content-center md:justify-content-start">
                    {user ? (
                    <Link to="/dashboard">
                        <Button label="Go to Dashboard" size="large" icon="pi pi-arrow-right" iconPos="right" className="font-bold px-5 py-3 border-none bg-primary hover:bg-indigo-400" />
                    </Link>
                    ) : (
                    <>
                        <Link to="/login">
                            <Button label="Start Practicing" size="large" className="font-bold px-5 py-3 border-none bg-primary hover:bg-indigo-400" />
                        </Link>
                        <Button label="Learn More" severity="secondary" outlined size="large" className="font-bold px-5 py-3 text-600 border-300 hover:bg-gray-50" />
                    </>
                    )}
                </div>
            </section>
        </div>
        <div className="col-12 md:col-6 overflow-hidden bg-purple-50 flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
             <i className="pi pi-check-circle text-purple-200" style={{ fontSize: '15rem', opacity: 0.5 }}></i>
        </div>
      </div>

      <div className="px-4 py-8 md:px-6 lg:px-8">
        <div className="text-center mb-5">
            <h2 className="text-800 text-3xl font-bold mb-2 mt-0">Why Study Evaluate?</h2>
            <p className="text-600 text-xl m-0">Everything you need to ace your next technical interview.</p>
        </div>

        <div className="grid">
            <div className="col-12 md:col-4 mb-4 px-5">
                <span className="p-3 shadow-1 mb-3 inline-block surface-card border-round-2xl" style={{ borderRadius: '10px' }}>
                    <i className="pi pi-list text-4xl text-blue-400"></i>
                </span>
                <h3 className="text-800 mb-3 font-medium text-xl mt-0">Subject Selection</h3>
                <span className="text-600 line-height-3">Choose from a comprehensive library of questions in React, Java, System Design, and more to target your weak spots.</span>
            </div>
            <div className="col-12 md:col-4 mb-4 px-5">
                <span className="p-3 shadow-1 mb-3 inline-block surface-card border-round-2xl" style={{ borderRadius: '10px' }}>
                    <i className="pi pi-bolt text-4xl text-yellow-400"></i>
                </span>
                <h3 className="text-800 mb-3 font-medium text-xl mt-0">Real-time Feedback</h3>
                <span className="text-600 line-height-3">Don't wait for a human reviewer. Get instant, detailed evaluation on your answers powered by advanced AI.</span>
            </div>
            <div className="col-12 md:col-4 mb-4 px-5">
                <span className="p-3 shadow-1 mb-3 inline-block surface-card border-round-2xl" style={{ borderRadius: '10px' }}>
                    <i className="pi pi-chart-bar text-4xl text-teal-400"></i>
                </span>
                <h3 className="text-800 mb-3 font-medium text-xl mt-0">Track Progress</h3>
                <span className="text-600 line-height-3">Monitor your performance over time. See your average scores improve and identify areas that need more focus.</span>
            </div>
        </div>
      </div>
    </div>
  )
}
