import '../css/Chat.css'
import accountIcon from '../svg/account-avatar-profile-user-11-svgrepo-com.svg'
import publickChatIcon from '../svg/chat-talk-svgrepo-com-public.svg'
import closeChatIcon from '../svg/back-svgrepo-com.svg'
import exitChatIcon from '../svg/leave-svgrepo-com.svg'
import { useNavigate} from 'react-router-dom'
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

const socketio = io('http://127.0.0.1:5000')

export default function Chat(){
    const currentUser = localStorage.getItem('username')
    const [rooms, setRooms] = useState([])
    const [users, setUsers] = useState([])
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [searching, setSearching] = useState(false)
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        if (localStorage.getItem('username') !== null){
            getRooms()

            socketio.on('message', (data) => {
                setMessages((prevMessage) => [...prevMessage,
                    {
                        username: data.username,
                        text: data.text,
                        dateTime: data.dateTime
                    }
                ])  
            })
        }

        return () => {
            socketio.off('message')
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
                type: 'public',
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
            setSearching(true)

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
            setSearching(false)
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

    const handelJoinRoom = async (room) => {
        const username = currentUser

        const data = {
            username,
            room
        }
        const options = {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('access')}`
            },
            body: JSON.stringify(data)
        }
        const url = 'http://127.0.0.1:5000/chat/add_user_to_chat'

        const response = await fetch(url, options)
        if (response.status === 201){
            const responseData = await response.json()
            console.log(responseData.msg)
            setRooms(rooms.filter((r) => r !== room))
        }else{
            refreshToken(response)
        }
    }

    const handleRoomSelect = (room) => {
        if (selectedRoom !== room){
            if (selectedRoom !== null){
                socketio.emit('leave')
            }
            setSelectedRoom(room)
            console.log(room)
            setMessages([])
            socketio.emit('join', {username: currentUser, room})
        }
    }

    const handleExitChat = async (room) => {
        const data = {
            username: currentUser,
            room
        }
        const url = 'http://127.0.0.1:5000/chat/remove_user_from_chat'
        const options = {
            method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('access')}`
                },
                body: JSON.stringify(data)
        }

        const response = await fetch(url, options)
        if (response.status === 200){
            const result = await response.json()
            console.log(result.msg)
            setSelectedRoom(null)
            socketio.emit('exit')
            getRooms()
        }else{
            refreshToken(response)
        }
    }

    const handleSendMessage = () => {
        if (message !== ''){
            socketio.emit('message', {message})
            setMessage('')
            const inputValue = document.getElementById('message-input')
            inputValue.value = ''
        }
    }

    const executeOnEnter = (e) => {
        if (e.key === 'Enter'){
            handleSendMessage()
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
                    {searching ? 
                    <>
                    {rooms.map((room) => (
                        <div className={'room'} key={room} onClick={() => handelJoinRoom(room)}>
                            <img className='account-img' src={publickChatIcon}></img>
                            <div className='room-info'>
                                <h3>{room}</h3>
                                <p>Last message</p>
                            </div>
                        </div>
                    ))}
                    </> 
                    :
                    <>
                    {rooms.map((room) => (
                        <div 
                        className={`room${selectedRoom === room ? '-selected' : ''}`} 
                        key={room} 
                        onClick={() => handleRoomSelect(room)}
                        >
                            <img className='account-img' src={publickChatIcon}></img>
                            <div className='room-info'>
                                <h3>{room}</h3>
                                <p>Last message</p>
                            </div>
                        </div>
                    ))}
                    </> 
                    }
                </div>
            </div>
            <div className='chat-window'>
                {selectedRoom !== null &&
                    <>
                        <div className='chat-window-header'>
                            <img className='close-chat' src={closeChatIcon} onClick={() => {
                                setSelectedRoom(null)
                                socketio.emit('leave')
                                }} />
                            <img className='chat-avatar' src={publickChatIcon} />
                            <h2>{selectedRoom}</h2>
                            <img className='exit-chat' src={exitChatIcon} onClick={() => handleExitChat(selectedRoom)}/>
                        </div>
                        <div className='chat-window-body'>
                            {messages.map((msg, index) => (
                                <div className='message-text' key={index}>
                                    <h4 key={msg.username}>{msg.username}</h4>
                                    <p key={msg.text}>{msg.text}</p>
                                    <p className='date-time' key={msg.dateTime}>{msg.dateTime}</p>
                                </div>
                            ))}
                        </div>
                        <div className='chat-window-footer'>
                            <input 
                            type='text' 
                            placeholder='Message' 
                            onChange={(e) => setMessage(e.target.value)}
                            id = 'message-input'
                            onKeyDown={(e) => executeOnEnter(e)}
                            maxLength={192}
                            />
                            <button onClick={handleSendMessage}>Send</button>
                        </div>
                    </>  
                }
            </div>
        </div>
    )
}