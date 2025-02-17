from flask import request, jsonify
from config import app
from models import ChatModel, UserModel, UserChatModel
from flask_jwt_extended import jwt_required

@app.route('/chat/create_room', methods=['POST'])
@jwt_required()
def create_room():
    data = request.get_json()

    # Create a new chat room
    room = ChatModel.get_room_by_name(data.get('room'))
    if room is not None:
        return jsonify({"msg": "Room already exist!"}), 401
    new_room = ChatModel(name=data.get('room'))
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