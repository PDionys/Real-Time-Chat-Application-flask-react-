import {useNavigate} from 'react-router-dom'
import { useState } from 'react'


export default function Signin(){
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const navigate = useNavigate()

    const onSubmit = async (e) => {
        e.preventDefault()

        const data = {
            username,
            password
        }

        const url = "http://127.0.0.1:5000/signin"
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
        const response = await fetch(url, options)
        
        if (response.status !== 200){
            const error = await response.json()
            alert(error.message)
        }else{
            const token = await response.json()
            localStorage.setItem('username', username)
            localStorage.setItem('access', token.tokens.access)
            localStorage.setItem('refresh', token.tokens.refresh)
            navigate('/')
        }
    }

    return (
        <>
            <h1>Sign In</h1>
            <form onSubmit={onSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input 
                        type="text" 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input 
                        type="password" 
                        id="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit">Sign In</button>
            </form>
        </>
    )
}