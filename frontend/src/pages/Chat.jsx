import '../css/Chat.css'
import accountIcon from '../svg/account-avatar-profile-user-11-svgrepo-com.svg'
import {useNavigate} from 'react-router-dom'


export default function Chat(){
    const currentUser = localStorage.getItem('username')

    const navigate = useNavigate()

    const handleRedirect = (to) => {
        navigate(to)
    }

    const handleCreateRoom = async(e) => {
        e.preventDefault()

        if (localStorage.getItem('username') !== null){
            const randomNum = Math.floor(Math.random() * 1000)
            const room = `${localStorage.getItem('username')}#${randomNum}`
            const username = currentUser

            // Create room
            const data = {
                username,
                room
            }

            // url options
            const url = 'http://127.0.0.1:5000/chat/create_room'
            const options = {
                // mode: 'no-cors',
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('access')}`
                },
                body: JSON.stringify(data)
            }

            const response = await fetch(url, options)
            if (response.status !== 201 && response.status !== 200){
                const error = await response.json()
                console.log(error.msg)
            }else{ 
                console.log(await response.json().msg)
            }
        }else{
            console.log('Room creation failed')
        }

    }

    const handleSearch = async (e) => {
        const search = e.target.value
        // setSearch(e.target.value)

        console.log(`Searching for: ${search}`)
    }

    const handleLogOut = () => {
        localStorage.removeItem('username')
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')

        navigate('/')
    }

    return (
        <div className="web-cahat">
            <div className="chats-list">
                <div className='chats-list-header'>
                    <div className='account'>
                        <img className='account-img' src={accountIcon}></img>
                        {currentUser !== null && <>
                            <h3>{currentUser}</h3>
                            <div className='account-btn'>
                                <button onClick={handleLogOut}>Log Out</button>
                            </div>
                        </>}
                        {currentUser === null && <div className='account-btn'>
                            <button onClick={() => handleRedirect('/signin')}>Sign In</button>
                            <button onClick={() => handleRedirect('/signup')}>Sign Up</button>
                        </div>}
                    </div>
                    <div className='create-room-btn'>
                        <button onClick={handleCreateRoom}>Create Room</button>
                    </div>
                    <div className='search-bar'>
                        <input type='text' placeholder='Search' id='search' onChange={(e) => handleSearch(e)}></input>
                    </div>
                </div>
            </div>
            <div className='chat-window'></div>
        </div>
    )
}