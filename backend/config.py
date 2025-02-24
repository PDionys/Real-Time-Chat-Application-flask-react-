from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)
# CORS(app, resources={r"/chat/*": {"origins": "http://localhost:5173"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = "015ad8e2b2ba6341ca032d34"
app.config['SECRET_KEY'] = "gfdlkjkahdfhgfjhsahdfasugf"

db = SQLAlchemy(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")