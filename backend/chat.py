from flask import request, jsonify, session
from config import app, socketio, db
from models import ChatModel, UserModel, UserChatModel
from flask_jwt_extended import jwt_required
from flask_socketio import join_room, leave_room, send
import datetime

@app.route('/chat/create_room', methods=['POST'])
@jwt_required()
def create_room():
    data = request.get_json()

    # Create a new chat room
    room = ChatModel.get_room_by_name(data.get('room'))
    if room is not None:
        return jsonify({"msg": "Room already exist!"}), 401
    new_room = ChatModel(name=data.get('room'), type=data.get('type'))
    new_room.save()
    
    # # Select user by username
    user = UserModel.get_user_by_username(data.get('username'))

    # Add user to the chat room
    user_chat = UserChatModel(user_id=user.id, chat_id=new_room.id)
    user_chat.save()

    return jsonify({"msg": "Room created!"}), 201


@app.route('/chat/get_rooms', methods=['GET'])
@jwt_required()
def get_rooms():
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
    search_item = request.args.get('item')
    username = request.args.get('user')

    user = UserModel.get_user_by_username(username)
    user_chat = UserChatModel.query.filter_by(user_id=user.id).all()

    users = UserModel.query.filter(UserModel.username.like(f'%{search_item}%'), UserModel.id != user.id).all()
    rooms = ChatModel.query.filter(
        ChatModel.name.like(f'%{search_item}%'), 
        ChatModel.id.notin_([chat.chat_id for chat in user_chat])
        ).all()

    json_users = list(map(lambda x: x.username, users))
    json_rooms = list(map(lambda x: x.name, rooms))

    return jsonify({"users": json_users, "rooms": json_rooms}), 200


@app.route('/chat/add_user_to_chat', methods=['POST'])
@jwt_required()
def add_user_to_chat():
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))
    chat = ChatModel.get_room_by_name(data.get('room'))

    user_chat = UserChatModel(user_id=user.id, chat_id=chat.id)
    user_chat.save()

    return jsonify({"msg": "User added to chat!"}), 201

@app.route('/chat/remove_user_from_chat', methods=['DELETE'])
@jwt_required()
def remove_user_from_chat():
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))
    chat = ChatModel.get_room_by_name(data.get('room'))
    # if user is None or chat is None:
    #     return jsonify({"msg": "User or room not found!"}), 404
    user_chat = UserChatModel.query.filter_by(user_id=user.id, chat_id=chat.id).first()

    try:
        db.session.delete(user_chat)
        db.session.commit()
        return jsonify({"msg": "User removed from chat!"}), 200
    except:
        db.session.rollback()
        return jsonify({"msg": "Failed to remove user from chat!"}), 500
    
    

@socketio.on('join')
def on_join(data):
    session['username'] = data['username']
    session['room'] = data['room']
    join_room(session['room'])
    send({
        "username": f'{session['username']}:',
        "text": 'has entered the room.',
        "dateTime":  f'{datetime.datetime.now().strftime("%b %d, %Y %I:%M %p")}'
    }, to=session['room'])

@socketio.on('leave')
def on_leave():
    leave_room(session['room'])
    session.clear()

@socketio.on('message')
def handle_message(data):
    output = {
        "username": f'{session['username']}:',
        "text": f'{data["message"]}',
        "dateTime": f'{datetime.datetime.now().strftime("%b %d, %Y %I:%M %p")}'
    }

    send(output, to=session['room'])

@socketio.on('exit')
def on_exit():
    # user = UserModel.get_user_by_username(session['username'])
    # room = ChatModel.get_room_by_name(session['room'])
    # user_chat = UserChatModel.query.filter_by(user_id=user.id, room_id=room.id).first()

    # db.session.delete(user_chat)
    # db.session.commit()

    leave_room(session['room'])

    send({
        "username": f'{session['username']}:',
        "text": 'has left the room.',
        "dateTime":  f'{datetime.datetime.now().strftime("%b %d, %Y %I:%M %p")}'
    }, to=session['room'])

    session.clear()