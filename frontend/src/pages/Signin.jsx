import {useNavigate} from 'react-router-dom'
import { useState } from 'react'

/**
 * Signin component for user authentication.
 *
 * @component
 * @returns {JSX.Element} The rendered Signin component.
 *
 * @description
 * This component renders a sign-in form that allows users to enter their username and password.
 * Upon form submission, it sends a PATCH request to the server to authenticate the user. If the
 * authentication is successful, it stores the username and tokens in localStorage and navigates
 * to the home page. If the authentication fails, it alerts the user with the error message.
 *
 * @example
 * return (
 *   <Signin />
 * )
 */

export default function Signin(){
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const navigate = useNavigate()

    /**
     * Handles the form submission for signing in a user.
     * 
     * @param {Event} e - The event object from the form submission.
     * @returns {Promise<void>} - A promise that resolves when the form submission is complete.
     * 
     * @async
     * @function onSubmit
     * 
     * @description
     * This function prevents the default form submission behavior, constructs the user data
     * from the form inputs, and sends a POST request to the server to sign in the user. If the
     * response status is not 200, it alerts the user with the error message. Otherwise, it stores
     * the username and tokens in localStorage and navigates to the home page.
     */
    const onSubmit = async (e) => {
        e.preventDefault()

        const data = {
            username,
            password
        }

        const url = "http://127.0.0.1:5000/signin"
        const options = {
            method: "PATCH",
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