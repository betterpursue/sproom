import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginForm from './LoginForm'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </Router>
  )
}

export default App