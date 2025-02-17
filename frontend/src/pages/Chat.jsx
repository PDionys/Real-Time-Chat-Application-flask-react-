import '../css/Chat.css'
import accountIcon from '../svg/account-avatar-profile-user-11-svgrepo-com.svg'
import publickChatIcon from '../svg/chat-talk-svgrepo-com-public.svg'
import closeChatIcon from '../svg/back-svgrepo-com.svg'
import { useNavigate} from 'react-router-dom'
import { useEffect, useState } from 'react'


export default function Chat(){
    const currentUser = localStorage.getItem('username')
    const [rooms, setRooms] = useState([])
    const [users, setUsers] = useState([])
    const [selectedRoom, setSelectedRoom] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (localStorage.getItem('username') !== null){
            getRooms()
        }
    }, [])

    const handleRedirect = (to) => {
        navigate(to)
    }

    const getRooms = async () => {
        const options = {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('access')}`
            }
        }
        const response = await fetch(`http://127.0.0.1:5000/chat/get_rooms?user=${localStorage.getItem('username')}`, options)
        const data = await response.json()
        
        if (response.status === 200){
            setRooms(data.rooms)
        }else{
            refreshToken(response)
        }

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
                // type: 'public',
                room
            }

            const url = 'http://127.0.0.1:5000/chat/create_room'
            const options = {
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
                refreshToken(error)
            }else{ 
                setRooms([...rooms, room])
            }
        }else{
            console.log('Room creation failed')
        }

    }

    const handleSearch = async (e) => {
        const search_item = e.target.value

        if (search_item !== ''){
            setRooms([])
            setUsers([])

            const options = {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('access')}`
                }
            }
            const response = await fetch(
                `http://127.0.0.1:5000/chat/find_chats?item=${search_item}&user=${localStorage.getItem('username')}`, 
                options)

            if (response.status === 200){
                const data = await response.json()
                setUsers(data.users)
                setRooms(data.rooms)
            }else{
                refreshToken(response)
            }
        }else{
            setUsers([])
            getRooms()
        }

        console.log(`Searching for: ${search_item}`)
    }

    const handleLogOut = () => {
        localStorage.removeItem('username')
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')

        setRooms([])
    }

    const refreshToken = async (response) => {
        if (response.status === 401){
            const url = 'http://127.0.0.1:5000/jwt_refresh'
            const options = {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('refresh')}`
                }
            }
            
            const response = await fetch(url, options)
            if (response.status === 200){
                const data = await response.json()
                localStorage.setItem('access', data.access)
                console.log('Refresh token successful')
                window.location.reload()
            }else{
                console.log('Refresh token failed')
            }
        }else{
            console.log(await response.json().msg)
        }
    }

    const handleRoomSelect = (room) => {
        if (selectedRoom !== room){
            setSelectedRoom(room)
            console.log(room)
        }
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
                <div className='rooms-list'>
                    {users.length !== 0 && <h2>Users</h2>}
                    {users.map((user) => (
                        <div className='room' key={user}>
                            <img className='account-img' src={accountIcon}></img>
                            <div className='room-info'>
                                <h3>{user}</h3>
                                <p>Status?</p>
                            </div>
                        </div>
                    ))}
                    {rooms.length !== 0 && <h2>Rooms</h2>}
                    {rooms.map((room) => (
                        <div className={`room${selectedRoom === room ? '-selected' : ''}`} key={room} onClick={() => handleRoomSelect(room)}>
                            <img className='account-img' src={publickChatIcon}></img>
                            <div className='room-info'>
                                <h3>{room}</h3>
                                <p>Last message</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className='chat-window'>
                {selectedRoom !== null &&
                    <>
                        <div className='chat-window-header'>
                            <img className='close-chat' src={closeChatIcon} onClick={() => setSelectedRoom(null)}></img>
                            <img className='chat-avatar' src={publickChatIcon}></img>
                            <h2>{selectedRoom}</h2>
                        </div>
                        <div className='chat-window-body'>
                        </div>
                        <div className='chat-window-footer'>
                            <input type='text' placeholder='Message'></input>
                            <button>Send</button>
                        </div>
                    </>  
                }
            </div>
        </div>
    )
}