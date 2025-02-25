# Real-Time Chat Application

A real-time chat application built with Flask and React. It allows users to sign up, log in, communicate in multiple chat rooms, and send/receive messages in real-time. The application supports user authentication, online/offline status, and message history, ensuring a seamless and interactive chat experience.

## Features

- **User Authentication**: 
  - Users can sign up, log in, and log out securely.
  - Passwords are stored securely with hashing.
  
- **Real-Time Messaging**: 
  - Messages are sent and received in real-time using WebSockets.
  
- **Chat Rooms**: 
  - Users can create and join multiple chat rooms.
  
- **User Status**: 
  - Displays users' online or offline status in the chat.
  
- **Message History**: 
  - Past messages are stored and can be retrieved by users.
  
## Tech Stack

### Backend
- **Flask**: A lightweight web framework used to handle API requests.
- **SQLAlchemy**: An ORM for database management and queries.
- **Flask-SocketIO**: For WebSocket-based real-time messaging functionality.
  
### Frontend
- **React**: A JavaScript library used to build the user interface.
- **React Router**: For seamless navigation between different pages/components.
- **Socket.IO Client**: For real-time WebSocket communication with the backend.

## Installation

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/real-time-chat-app.git
   cd backend

2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate

3. Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    
4. Run the Flask server:
    ```bash
    python main.py

### Frontend Setup

1. Navigate to the frontend directory:
    ```bash
    cd frontend
2. Install the required dependencies:
    ```bash
    npm install
3. Start the React application:
    ```bash
    npm start dev
4. Open your browser and go to http://localhost:3000 to see the app in action.

## Demonstratio
https://github.com/user-attachments/assets/f040eb03-b945-44e3-b80f-5d6f616d1e38
