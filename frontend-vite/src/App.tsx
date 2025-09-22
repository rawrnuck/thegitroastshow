import './App.css'
import FlowOrchestrator from './components/FlowOrchestrator'

function App() {
  return (
    <>
      <div className="content-container" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}>
        <div className="card">
          <FlowOrchestrator />
        </div>
      </div>
    </>
  )
}

export default App
