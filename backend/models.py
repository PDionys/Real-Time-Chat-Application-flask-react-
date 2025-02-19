from config import db
from werkzeug.security import generate_password_hash, check_password_hash


class MyModels():

    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete()
        db.session.commit()

class UserModel(db.Model, MyModels):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False, unique=True, index=True)
    email = db.Column(db.String, nullable=False, unique=True, index=True)
    password = db.Column(db.String, nullable=False, unique=False)
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
    created_at = db.Column(db.DateTime, nullable=False, unique=False)
    # chat = db.relationship('ChatModel', backref='message', uselist=False)

    def to_json(self):
        return {
            "id": self.id,
            "message": self.message,
            "user_id": self.user_id,
            "chat_id": self.chat_id,
            "created_at": self.created_at,
        }