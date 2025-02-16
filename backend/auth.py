from config import app
from flask import request, jsonify
from models import UserModel
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required


@app.route('/signup', methods=['POST'])
def signup_user():
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))

    if user is not None:
        return jsonify({"message": "User already exist!"}), 401


    new_user = UserModel(username=data.get('username'), email=data.get('email'))
    new_user.set_password(data.get('password'))

    new_user.save()

    return jsonify({"message": "User created!"}), 201

@app.route('/signin', methods=["POST"])
def signin_user():
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))

    if user and (user.check_password(data.get('password'))):
        access_token = create_access_token(identity=user.username)
        refresh_token = create_refresh_token(identity=user.username)

        return jsonify({
            "message":"Logged In!",
            "tokens": {
                "access":access_token,
                "refresh":refresh_token
            }
        }), 200
    
    return jsonify({"message":"Invalide username or password"}), 400

@app.route('/jwt_refresh', methods=["POST"])
@jwt_required(refresh=True)
def jwt_refresh():
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)

    return jsonify({"access":access_token}), 200