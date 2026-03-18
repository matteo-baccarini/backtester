import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import Navbar from './Navbar'
import './App.css'
import Home from './pages/home'
import Strategies from './pages/strategies'
import Backtests from './pages/backtests'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <Navbar />
      <div className="Container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/strategies" element={<Strategies />} />
          <Route path="/backtests" element={<Backtests />} />
        </Routes>
      </div>
    </>
  )
}

export default App
