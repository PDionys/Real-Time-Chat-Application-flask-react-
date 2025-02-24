import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import './App.css'
import Sighup from './pages/Signup'
import Signin from './pages/Signin'
import Chat from './pages/Chat'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<Chat />} />
          <Route path='/signin' element={<Signin />} />
          <Route path='/signup' element={<Sighup />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
