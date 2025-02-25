from config import db
from werkzeug.security import generate_password_hash, check_password_hash

"""
This module defines the database models for a real-time chat application using Flask and SQLAlchemy.
Classes:
    MyModels: A base class providing save and delete methods for database operations.
    UserModel: Represents a user in the chat application.
    UserChatModel: Represents the association between users and chats.
    ChatModel: Represents a chat room.
    MessageModel: Represents a message in a chat room.
UserModel:
    id (int): Primary key.
    username (str): Unique username of the user.
    email (str): Unique email of the user.
    password (str): Hashed password of the user.
    status (str): Status of the user (default is 'offline').
    chat (relationship): Relationship to UserChatModel.
    message (relationship): Relationship to MessageModel.
    Methods:
        set_password(password): Hashes and sets the user's password.
        check_password(password): Checks the hashed password.
        get_user_by_username(username): Class method to get a user by username.
        to_json(): Returns a JSON representation of the user.
UserChatModel:
    id (int): Primary key.
    user_id (int): Foreign key to UserModel.
    chat_id (int): Foreign key to ChatModel.
    __table_args__: Unique constraint on user_id and chat_id.
    Methods:
        to_json(): Returns a JSON representation of the user-chat association.
ChatModel:
    id (int): Primary key.
    name (str): Unique name of the chat room.
    type (str): Type of the chat room.
    users (relationship): Relationship to UserChatModel.
    message (relationship): Relationship to MessageModel.
    Methods:
        to_json(): Returns a JSON representation of the chat room.
        get_room_by_name(name): Class method to get a chat room by name.
MessageModel:
    id (int): Primary key.
    message (str): The message content.
    user_id (int): Foreign key to UserModel.
    chat_id (int): Foreign key to ChatModel.
    created_at (str): Timestamp of when the message was created.
    Methods:
        to_json(): Returns a JSON representation of the message.
"""

class MyModels():

    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()

class UserModel(db.Model, MyModels):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False, unique=True, index=True)
    email = db.Column(db.String, nullable=False, unique=True, index=True)
    password = db.Column(db.String, nullable=False, unique=False)
    status = db.Column(db.String, nullable=False, default='offline')
    chat = db.relationship('UserChatModel', backref='user', cascade='all, delete-orphan')
    message = db.relationship('MessageModel', backref='user', cascade='all, delete-orphan')


    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    @classmethod
    def get_user_by_username(cls, username):
        return cls.query.filter_by(username=username).first()
    
    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "password": self.password,
        }
    
class UserChatModel(db.Model, MyModels):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user_model.id'))
    chat_id = db.Column(db.Integer, db.ForeignKey('chat_model.id'))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'chat_id', name='unique_user_chat'),
    )

    def to_json(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "chat_id": self.chat_id,
        }
    
class ChatModel(db.Model, MyModels):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True, index=True)
    type = db.Column(db.String, nullable=False, unique=False)
    # last_message_id = db.Column(db.Integer, db.ForeignKey('message_model.id'))
    users = db.relationship('UserChatModel', backref='chat', cascade='all, delete-orphan')
    message = db.relationship('MessageModel', backref='chat', cascade='all, delete-orphan')

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
        }
    
    @classmethod
    def get_room_by_name(cls, name):
        return cls.query.filter_by(name=name).first()
    
class MessageModel(db.Model, MyModels):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String, nullable=False, unique=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user_model.id'))
    chat_id = db.Column(db.Integer, db.ForeignKey('chat_model.id'))
    created_at = db.Column(db.String, nullable=False, unique=False)
    # chat = db.relationship('ChatModel', backref='message', uselist=False)

    def to_json(self):
        return {
            "id": self.id,
            "message": self.message,
            "user_id": self.user_id,
            "chat_id": self.chat_id,
            "created_at": self.created_at,
        }