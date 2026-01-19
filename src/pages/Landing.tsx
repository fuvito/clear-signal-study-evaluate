
import { Button } from 'primereact/button'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="flex flex-column" style={{ minHeight: '80vh' }}>
      <div className="grid grid-nogutter surface-section text-800">
        <div className="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center ">
            <section>
                <span className="block text-6xl font-bold mb-1">Master Your Skills</span>
                <div className="text-6xl text-primary font-bold mb-3">with AI Feedback</div>
                <p className="mt-0 mb-4 text-700 line-height-3 text-xl">
                    Practice interview questions, get instant AI-powered grading, and track your progress across React, Java, and TypeScript.
                </p>

                <div className="flex gap-3 justify-content-center md:justify-content-start">
                    {user ? (
                    <Link to="/dashboard">
                        <Button label="Go to Dashboard" size="large" icon="pi pi-arrow-right" iconPos="right" className="font-bold px-5 py-3" />
                    </Link>
                    ) : (
                    <>
                        <Link to="/login">
                            <Button label="Start Practicing" size="large" className="font-bold px-5 py-3" />
                        </Link>
                        <Button label="Learn More" severity="secondary" outlined size="large" className="font-bold px-5 py-3" />
                    </>
                    )}
                </div>
            </section>
        </div>
        <div className="col-12 md:col-6 overflow-hidden bg-indigo-50 flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
             <i className="pi pi-check-circle text-primary" style={{ fontSize: '15rem', opacity: 0.1 }}></i>
        </div>
      </div>

      <div className="surface-ground px-4 py-8 md:px-6 lg:px-8">
        <div className="text-center mb-5">
            <div className="text-900 text-3xl font-bold mb-2">Why Study Evaluate?</div>
            <div className="text-600 text-xl">Everything you need to ace your next technical interview.</div>
        </div>

        <div className="grid">
            <div className="col-12 md:col-4 mb-4 px-5">
                <span className="p-3 shadow-2 mb-3 inline-block surface-card" style={{ borderRadius: '10px' }}>
                    <i className="pi pi-list text-4xl text-blue-500"></i>
                </span>
                <div className="text-900 mb-3 font-medium text-xl">Subject Selection</div>
                <span className="text-700 line-height-3">Choose from a comprehensive library of questions in React, Java, TypeScript, and more to target your weak spots.</span>
            </div>
            <div className="col-12 md:col-4 mb-4 px-5">
                <span className="p-3 shadow-2 mb-3 inline-block surface-card" style={{ borderRadius: '10px' }}>
                    <i className="pi pi-bolt text-4xl text-orange-500"></i>
                </span>
                <div className="text-900 mb-3 font-medium text-xl">Real-time Feedback</div>
                <span className="text-700 line-height-3">Don't wait for a human reviewer. Get instant, detailed evaluation on your answers powered by advanced AI.</span>
            </div>
            <div className="col-12 md:col-4 mb-4 px-5">
                <span className="p-3 shadow-2 mb-3 inline-block surface-card" style={{ borderRadius: '10px' }}>
                    <i className="pi pi-chart-bar text-4xl text-green-500"></i>
                </span>
                <div className="text-900 mb-3 font-medium text-xl">Track Progress</div>
                <span className="text-700 line-height-3">Monitor your performance over time. See your average scores improve and identify areas that need more focus.</span>
            </div>
        </div>
      </div>
    </div>
  )
}
