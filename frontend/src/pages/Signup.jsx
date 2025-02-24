import { useState } from "react"

/**
 * Signup component for user registration.
 * 
 * @component
 * @example
 * return (
 *   <Signup />
 * )
 * 
 * @returns {JSX.Element} The Signup component.
 */

export default function Sighup(){
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    /**
     * Handles the form submission for the signup process.
     * 
     * @param {Event} e - The event object from the form submission.
     * @returns {Promise<void>} - A promise that resolves when the form submission is complete.
     * 
     * @async
     */
    const onSubmit = async (e) => {
        e.preventDefault()

        const data = {
            username,
            email,
            password
        }

        const url = 'http://127.0.0.1:5000/signup'
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }

        const response = await fetch(url, options)
        if (response.status !== 201 && response.status !== 200){
            const error = await response.json()
            alert(error.message)
        } else{
            //seccesssful
        }
    }

    return (
        <>
            <h1>Sign Up</h1>
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
                    <label htmlFor="email">Email:</label>
                    <input 
                        type="text" 
                        id="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
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
                <button type="submit">Sign Up</button>
            </form>
        </>
    )
}