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