import os

from collections import deque

from flask import Flask, session, render_template, request, redirect, jsonify
from flask_session import Session
from flask_socketio import SocketIO, emit

app = Flask(__name__)

# Configure session to use filesystem
app.secret_key=os.urandom(24)
app.config["SESSION_TYPE"] = "filesystem"


socketio = SocketIO(app)

# Configure session to use filesystem

channels = []
messageChat = dict()


@app.route("/")
def index():
    if session.get("username") is None:
        return render_template("user.html", user=session.get("username"))
    else:
        u = session.get("username")
        return render_template("index.html", username=u, channels=channels)


@app.route("/user", methods=["POST", "GET"])
def login():
    if request.method == "POST":
        session.clear()

        username = request.form.get("username")

        session['username'] = username

        session.permanent = True

        return redirect("/")
    else:
        return render_template("user.html")


@app.route("/user")
def user():
    return render_template("user.html")


@socketio.on("add channel")
def channel(data):

    if data["channel_name"] in channels:
        emit("error channels", {"channel_name": data["channel_name"]}, broadcast=False)
    else:
        channel_name = data["channel_name"]
        channels.append(channel_name)
        messageChat[channel_name] = deque()
        emit("all channels", {"channel_name": channel_name}, broadcast=True)


@socketio.on("add message")
def message(data):


    username = session.get("username")

    user_message = data["user_message"]
    channel = data["channel_name"]
    timestamp = data["timestamp"]

    if len(messageChat[channel]) > 100:
        messageChat[channel].popleft()

    messageChat[channel].append([username, user_message, timestamp])
    emit("announce message", {"username": username, "user_message": user_message, "timestamp": timestamp}, broadcast=True)


@app.route("/chat", methods=["POST"])
def post():
    channel = request.form.get("channel_name")
    messages = messageChat[channel]
    data = []
    for message in messages:
        data.append(message)

    return jsonify(data)
