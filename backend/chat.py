from flask import request, jsonify, session
from config import app, socketio, db
from models import ChatModel, UserModel, UserChatModel, MessageModel
from flask_jwt_extended import jwt_required
from flask_socketio import join_room, leave_room, send, emit
import datetime

"""
This module provides the backend functionality for a real-time chat application using Flask and Flask-SocketIO.
Routes:
    - /chat/create_room (POST): Creates a new chat room.
    - /chat/get_rooms (GET): Retrieves all chat rooms associated with a user.
    - /chat/find_chats (GET): Searches for users and chat rooms based on a search item.
    - /chat/add_user_to_chat (POST): Adds a user to a chat room.
    - /chat/remove_user_from_chat (DELETE): Removes a user from a chat room.
    - /chat/save_message (POST): Saves a message to a chat room.
    - /chat/get_messages (GET): Retrieves all messages from a chat room.
SocketIO Events:
    - join: Joins a user to a chat room.
    - leave: Removes a user from a chat room and clears the session.
    - message: Handles sending messages to a chat room.
    - exit: Handles user exit from a chat room and sends a message to the room.
    - connect_room: Connects a user to a chat room, sends a message, and then leaves the room.
Dependencies:
    - Flask
    - Flask-JWT-Extended
    - Flask-SocketIO
    - datetime
    - config (app, socketio, db)
    - models (ChatModel, UserModel, UserChatModel, MessageModel)
"""

@app.route('/chat/create_room', methods=['POST'])
@jwt_required()
def create_room():
    """
    Creates a new chat room and adds a user to it.
    This function retrieves JSON data from the request, checks if a chat room with the given name already exists,
    and if not, creates a new chat room and adds the specified user to it.
    Returns:
        Response: A JSON response indicating the success or failure of the room creation.
        - 201: Room created successfully.
        - 401: Room already exists.
    """
    data = request.get_json()

    room = ChatModel.get_room_by_name(data.get('room'))
    if room is not None:
        return jsonify({"msg": "Room already exist!"}), 401
    new_room = ChatModel(name=data.get('room'), type=data.get('type'))
    new_room.save()
    
    user = UserModel.get_user_by_username(data.get('username'))

    user_chat = UserChatModel(user_id=user.id, chat_id=new_room.id)
    user_chat.save()

    return jsonify({"msg": "Room created!"}), 201


@app.route('/chat/get_rooms', methods=['GET'])
@jwt_required()
def get_rooms():
    """
    Retrieve the list of chat rooms associated with a user.
    This function extracts the username from the request arguments, fetches the user
    details from the UserModel, and then retrieves all chat rooms associated with the
    user's ID from the UserChatModel. The names of these chat rooms are then returned
    in a JSON response.
    Returns:
        tuple: A JSON response containing a list of chat room names and an HTTP status code 200.
    """
    username = request.args.get('user')
    user = UserModel.get_user_by_username(username)

    rooms = UserChatModel.query.filter_by(user_id=user.id).all()
    rooms_name = []
    for room in rooms:
        rooms_name.append(room.chat.name)

    return jsonify({"rooms": rooms_name}), 200

@app.route('/chat/find_chats', methods=['GET'])
@jwt_required()
def find_chats():
    """
    Find chats and users based on a search item.
    This function retrieves users and chat rooms that match a given search item.
    It excludes the current user from the search results and also excludes chat
    rooms that the current user is already a part of.
    Query Parameters:
    - item (str): The search term to filter users and chat rooms.
    - user (str): The username of the current user.
    Returns:
    - Response: A JSON response containing two lists:
        - users: A list of dictionaries with 'username' and 'status' of matching users.
        - rooms: A list of names of matching chat rooms.
    """
    search_item = request.args.get('item')
    username = request.args.get('user')

    user = UserModel.get_user_by_username(username)
    user_chat = UserChatModel.query.filter_by(user_id=user.id).all()

    users = UserModel.query.filter(UserModel.username.like(f'%{search_item}%'), UserModel.id != user.id).all()
    rooms = ChatModel.query.filter(
        ChatModel.name.like(f'%{search_item}%'), 
        ChatModel.id.notin_([chat.chat_id for chat in user_chat])
        ).all()

    json_users = list(map(lambda x: {'username':x.username, "status":x.status}, users))
    json_rooms = list(map(lambda x: x.name, rooms))

    return jsonify({"users": json_users, "rooms": json_rooms}), 200


@app.route('/chat/add_user_to_chat', methods=['POST'])
@jwt_required()
def add_user_to_chat():
    """
    Adds a user to a chat room.
    This function retrieves JSON data from the request, gets the user and chat room
    based on the provided username and room name, creates a UserChatModel instance
    to link the user to the chat room, and saves this instance to the database.
    Returns:
        Response: A JSON response with a success message and a 201 status code.
    """
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))
    chat = ChatModel.get_room_by_name(data.get('room'))

    user_chat = UserChatModel(user_id=user.id, chat_id=chat.id)
    user_chat.save()

    return jsonify({"msg": "User added to chat!"}), 201

@app.route('/chat/remove_user_from_chat', methods=['DELETE'])
@jwt_required()
def remove_user_from_chat():
    """
    Remove a user from a chat room.
    This function retrieves the user and chat room information from the request JSON payload,
    finds the corresponding UserChatModel entry, and deletes it from the database.
    Request JSON format:
    {
        "username": "string",
        "room": "string"
    }
    Returns:
        Response: A JSON response indicating the success or failure of the operation.
        - 200: If the user is successfully removed from the chat room.
        - 500: If there is an error during the removal process.
    """
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))
    chat = ChatModel.get_room_by_name(data.get('room'))
    user_chat = UserChatModel.query.filter_by(user_id=user.id, chat_id=chat.id).first()

    try:
        db.session.delete(user_chat)
        db.session.commit()
        return jsonify({"msg": "User removed from chat!"}), 200
    except:
        db.session.rollback()
        return jsonify({"msg": "Failed to remove user from chat!"}), 500

@app.route('/chat/save_message', methods=['POST'])
@jwt_required()
def save_message():
    """
    Save a new chat message to the database.
    This function retrieves JSON data from the request, extracts the username,
    room name, and message text, and saves the message to the database with the
    current timestamp.
    Returns:
        Response: A JSON response containing the saved message and timestamp,
                  along with a 201 status code.
    """
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))
    chat = ChatModel.get_room_by_name(data.get('room'))
    message = data.get('text')
    date = datetime.datetime.now().strftime("%b %d, %Y %I:%M %p")

    new_message = MessageModel(message=message, user_id=user.id, chat_id=chat.id, created_at=date)
    new_message.save()

    return jsonify({
        'message': message,
        'dateTime': date
    }), 201

@app.route('/chat/get_messages')
@jwt_required()
def get_messages():
    """
    Retrieve messages for a specific chat room.
    This function extracts the 'room' parameter from the request arguments,
    fetches the corresponding chat room from the database, and retrieves all
    messages associated with that room. The messages are then formatted into
    a JSON-compatible structure and returned as a JSON response.
    Returns:
        tuple: A tuple containing a JSON response with the messages and an HTTP status code 200.
    """
    room = request.args.get('room')

    chat = ChatModel.get_room_by_name(room)
    messages = chat.message

    messages_json = list(map(lambda x: {"username": x.user.username, 
                                        "text": x.message, 
                                        'dateTime': x.created_at}
                                        , messages))

    return jsonify({'messages': messages_json}), 200

@socketio.on('join')
def on_join(data):
    """
    Handles the event when a user joins a chat room.

    Args:
        data (dict): A dictionary containing the username and room information.
            - 'username' (str): The username of the user joining the room.
            - 'room' (str): The name of the chat room to join.

    Side Effects:
        - Sets the 'username' and 'room' in the session.
        - Joins the user to the specified chat room.
    """
    session['username'] = data['username']
    session['room'] = data['room']
    join_room(session['room'])

@socketio.on('leave')
def on_leave():
    """
    Handles the event when a user leaves a chat room.

    This function performs the following actions:
    1. Removes the user from the chat room specified in the session.
    2. Clears the session data.

    Returns:
        None
    """
    leave_room(session['room'])
    session.clear()

@socketio.on('message')
def handle_message(data):
    """
    Handles an incoming chat message, formats it, and sends it to the specified room.
    Args:
        data (dict): A dictionary containing the message data with keys:
            - "message" (str): The content of the message.
            - "dateTime" (str): The timestamp of when the message was sent.
    Returns:
        None
    """
    output = {
        "username": f'{session['username']}',
        "text": f'{data["message"]}',
        "dateTime": f'{data["dateTime"]}'
    }

    send(output, to=session['room'])

@socketio.on('exit')
def on_exit(data):
    """
    Handles the event when a user exits a chat room.
    This function performs the following actions:
    1. Removes the user from the current chat room.
    2. Sends a message to the chat room indicating that the user has left.
    3. Clears the user's session data.
    Args:
        data (dict): A dictionary containing the following keys:
            - 'message' (str): The message to be sent to the chat room.
            - 'dateTime' (str): The date and time when the user left the chat room.
    """
    leave_room(session['room'])

    send({
        "username": f'{session['username']}',
        "text": data['message'],
        "dateTime":  f'{data["dateTime"]}'
    }, to=session['room'])

    session.clear()

@socketio.on('connect_room')
def on_connect(data):
    """
    Handles a user connecting to a chat room.
    Args:
        data (dict): A dictionary containing the following keys:
            - 'username' (str): The username of the user.
            - 'room' (str): The name of the chat room.
            - 'message' (str): The message text.
            - 'dateTime' (str): The date and time of the message.
    Joins the specified chat room, sends a message to the room, and then leaves the room.
    """
    username = data['username']
    room = data['room']

    join_room(room)
    send({
        "username": username,
        "text": data['message'],
        "dateTime":  f'{data["dateTime"]}'
    }, to=room)
    leave_room(room)