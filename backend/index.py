from config import app


@app.route('/')
def index():
    return '<h1>Real-Time Chat Application</h1>'