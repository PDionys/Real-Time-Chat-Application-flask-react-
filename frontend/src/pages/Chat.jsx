import '../css/Chat.css'
import accountIcon from '../svg/account-avatar-profile-user-11-svgrepo-com.svg'
import publickChatIcon from '../svg/chat-talk-svgrepo-com-public.svg'
import closeChatIcon from '../svg/back-svgrepo-com.svg'
import exitChatIcon from '../svg/leave-svgrepo-com.svg'
import { useNavigate} from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

const socketio = io('http://127.0.0.1:5000')

/**
 * Chat component handles the chat functionality of the application.
 * It manages the state of rooms, users, messages, and the current user.
 * It also handles various chat-related actions such as creating rooms, 
 * joining rooms, sending messages, and logging out.
 *
 * @component
 * @returns {JSX.Element} The rendered Chat component.
 *
 * @example
 * return (
 *   <Chat />
 * )
 *
 * @function
 * @name Chat
 *
 * @description
 * The Chat component is responsible for:
 * - Fetching and displaying chat rooms and users.
 * - Handling user actions such as creating rooms, joining rooms, sending messages, and logging out.
 * - Managing the state of the chat, including the current user, rooms, users, selected room, messages, and search state.
 * - Communicating with the backend server to fetch and update chat data.
 * - Handling socket.io events for real-time chat functionality.
 *
 * @property {string} currentUser - The current logged-in user.
 * @property {Array} rooms - The list of chat rooms.
 * @property {Array} users - The list of users.
 * @property {string|null} selectedRoom - The currently selected chat room.
 * @property {boolean} searching - The state indicating if the user is searching for rooms or users.
 * @property {Array} messages - The list of messages in the current chat room.
 * @property {string} message - The current message being typed by the user.
 * @property {function} navigate - The function to navigate to different routes.
 * @property {object} chatEndRef - The reference to the chat window element for scrolling.
 *
 * @method handleRedirect - Redirects the user to a specified route.
 * @method getRooms - Fetches the list of chat rooms for the current user.
 * @method handleCreateRoom - Handles the creation of a new chat room.
 * @method handleSaveMessagesToDB - Saves messages to the database and emits socket events.
 * @method handleSearch - Handles the search functionality for rooms and users.
 * @method handleLogOut - Logs out the current user and clears local storage.
 * @method refreshToken - Refreshes the JWT token if it has expired.
 * @method onJoinRoom - Adds the current user to a specified chat room.
 * @method handelJoinRoom - Joins a specified chat room and saves a message indicating the user has entered the room.
 * @method hendleSetMessagesHistory - Fetches and sets the message history for a specified chat room.
 * @method handleRoomSelect - Selects a chat room and fetches its message history.
 * @method onExitRoom - Removes the current user from a specified chat room.
 * @method handleExitChat - Exits the current chat room and saves a message indicating the user has left the room.
 * @method handleSendMessage - Sends a message in the current chat room.
 * @method executeOnEnter - Sends a message when the Enter key is pressed.
 */
export default function Chat(){
    const currentUser = localStorage.getItem('username')
    const [rooms, setRooms] = useState([])
    const [users, setUsers] = useState([])
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [searching, setSearching] = useState(false)
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const navigate = useNavigate()
    const chatEndRef = useRef(null)

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


    useEffect(() => {
        if (chatEndRef.current ) { 
            const offset = 61
            const distanceFromBottom = chatEndRef.current.scrollHeight - chatEndRef.current.scrollTop - chatEndRef.current.clientHeight;
            const isSlightlyAboveBottom = distanceFromBottom <= offset;

            if(isSlightlyAboveBottom){
                console.log("BOTTOM")
                chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
            }else{
                console.log("NOT BOTTOM")
            }
        }
    }, [messages]);

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
        if (response.status === 200){
            const data = await response.json()
            // console.log(data.rooms)
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

    const handleSaveMessagesToDB = async (username, text, ev, room = null) => {
        const roomElement = document.querySelector('.room-selected .room-info h3');
        // const elementContent = roomElement ? roomElement.textContent : '';
        // const roomName = roomElement ? roomElement.textContent : room;
        const roomName = room === null ? roomElement.textContent : room;
        const data = {
            username,
            room: roomName,
            text
        }

        const url = 'http://127.0.0.1:5000/chat/save_message'
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('access')}`
            },
            body: JSON.stringify(data)
        }

        const response = await fetch(url, options)
        if (response.status === 201){
            const result = await response.json()
            ev === 'connect_room' ? socketio.emit(ev, {message: result.message, dateTime: result.dateTime, username, room: roomName}) : 
                                    socketio.emit(ev, {message: result.message, dateTime: result.dateTime})
            console.log(result.msg)
        }else{
            refreshToken(response)
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

    const handleLogOut = async() => {
        const data = {
            username: currentUser
        }
        const options = {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
        const url = "http://127.0.0.1:5000/logout"

        const response = await fetch(url, options)
        if (response.status === 200){
            const msg = await response.json()
            console.log(msg.msg)
        }else{
            const msg = await response.json()
            console.log(msg.msg)
        } 

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

    const onJoinRoom = async (room) => {
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
            // socketio.emit('connect_room', {username: currentUser, room})
        }else{
            refreshToken(response)
        }
    }

    const handelJoinRoom = (room) => {
        onJoinRoom(room)
        // console.log(room)
        handleSaveMessagesToDB(
            currentUser,
            'has entered the room.',
            'connect_room',
            room
        )
    }

    const hendleSetMessagesHistory = async (room) => {
        const roomSplit = room.split('#')
        const url = `http://127.0.0.1:5000/chat/get_messages?room=${roomSplit[0]}%23${roomSplit[1]}`
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('access')}`
            }
        }

        const response = await fetch(url, options)
        if (response.status === 200){
            const responseData = await response.json()
            setMessages(responseData.messages)
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
            hendleSetMessagesHistory(room)
            // setMessages([])
            socketio.emit('join', {username: currentUser, room})
        }
    }

    const onExitRoom = async (room) => {
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
        }else{
            refreshToken(response)
        }
    }

    const handleExitChat = async (room) => {
        await onExitRoom(room)
        await handleSaveMessagesToDB(
            currentUser,
            'has left the room.',
            'exit'
        )
        setSelectedRoom(null)
        await getRooms()
    }

    const handleSendMessage = async() => {
        if (message !== ''){
            //save message to db
            await handleSaveMessagesToDB(
                currentUser,
                message,
                'message'
            )

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
                                <h3>{user.username}</h3>
                                <p style={{ color: `${user.status === 'offline' ? 'red' : 'green'}` }}>{user.status}</p>
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
                        <div className='chat-window-body'  ref={chatEndRef}>
                            {messages.map((msg, index) => (
                                <div className='message-text' key={index}>
                                    <h4 key={msg.username}>{`${msg.username}:`}</h4>
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