from config import app, db, socketio
from auth import *
from chat import *

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    
    socketio.run(app, debug=True)