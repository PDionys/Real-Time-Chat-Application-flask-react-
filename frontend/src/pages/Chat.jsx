import '../css/Chat.css'
import accountIcon from '../svg/account-avatar-profile-user-11-svgrepo-com.svg'
import {useNavigate} from 'react-router-dom'


export default function Chat(){
    const currentUser = localStorage.getItem('username')

    const navigate = useNavigate()

    const handleRedirect = (to) => {
        navigate(to)
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
                </div>
            </div>
            <div className='chat-window'></div>
        </div>
    )
}