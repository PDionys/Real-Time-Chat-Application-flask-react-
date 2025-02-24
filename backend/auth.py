from config import app, db
from flask import request, jsonify
from models import UserModel
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required

"""
This module handles user authentication and authorization for the real-time chat application.
It provides endpoints for user signup, signin, and JWT token refresh.
Routes:
    /signup (POST): Handles user signup by creating a new user account.
    /signin (POST): Authenticates a user and generates access and refresh tokens.
    /jwt_refresh (POST): Refreshes the JWT token for the current user.
Functions:
    signup_user(): Handles user signup by creating a new user account.
    signin_user(): Authenticates a user and generates access and refresh tokens.
    jwt_refresh(): Refreshes the JWT token for the current user.
"""

@app.route('/signup', methods=['POST'])
def signup_user():
    """
    Handles user signup by creating a new user account.
    This function retrieves user data from the request, checks if a user with the given username already exists,
    and if not, creates a new user with the provided username, email, and password.
    Returns:
        Response: A JSON response indicating the result of the signup process.
        - 201: User created successfully.
        - 401: User already exists.
    """
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))

    if user is not None:
        return jsonify({"message": "User already exist!"}), 401


    new_user = UserModel(username=data.get('username'), email=data.get('email'))
    new_user.set_password(data.get('password'))

    new_user.save()

    return jsonify({"message": "User created!"}), 201

@app.route('/signin', methods=["PATCH"])
def signin_user():
    """
    Authenticates a user and generates access and refresh tokens.
    This function retrieves JSON data from the request, checks the user's 
    credentials, and if valid, generates and returns access and refresh tokens.
    Returns:
        Response: A JSON response containing a success message and tokens if 
        authentication is successful, or an error message if authentication fails.
    """
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))

    if user and (user.check_password(data.get('password'))):
        access_token = create_access_token(identity=user.username)
        refresh_token = create_refresh_token(identity=user.username)

        user.status = 'online'
        db.session.commit()

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
    """
    Refreshes the JWT token for the current user.
    This function retrieves the current user's identity from the JWT,
    creates a new access token for the user, and returns it in a JSON response.
    Returns:
        tuple: A JSON response containing the new access token and an HTTP status code 200.
    """
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)

    return jsonify({"access":access_token}), 200

@app.route('/logout', methods=['PATCH'])
def user_logout():
    data = request.get_json()

    user = UserModel.get_user_by_username(data.get('username'))
    user.status = 'offline'
    db.session.commit()

    return jsonify({"msg": "Logged out successfully!"}), 200