import json
from os import environ as env
from urllib.parse import quote_plus, urlencode

from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import Flask, redirect, render_template, session, url_for, jsonify
from flask_cors import CORS

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

app = Flask(__name__)
app.secret_key = env.get("APP_SECRET_KEY")

# Enable CORS for Electron app
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "file://*"])

oauth = OAuth(app)

oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)

# Routes
@app.route("/")
def home():
    return jsonify({
        "message": "Navi Auth API",
        "authenticated": session.get("user") is not None
    })

@app.route("/login")
def login():
    """Initiates Auth0 login flow"""
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )

@app.route("/callback")
def callback():
    """Handles Auth0 callback"""
    try:
        token = oauth.auth0.authorize_access_token()
        session["user"] = token
        
        # Redirect to Electron app with success
        return redirect("http://localhost:3000/auth/success")
    except Exception as e:
        return redirect(f"http://localhost:3000/auth/error?message={str(e)}")

@app.route("/logout")
def logout():
    """Logs out the user and clears session"""
    session.clear()
    return redirect(
        "https://"
        + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )

@app.route("/api/user")
def get_user():
    """Returns current user information"""
    user = session.get("user")
    if user:
        return jsonify({
            "authenticated": True,
            "user": user.get("userinfo")
        })
    return jsonify({
        "authenticated": False,
        "user": None
    }), 401

@app.route("/api/auth/status")
def auth_status():
    """Check authentication status"""
    return jsonify({
        "authenticated": session.get("user") is not None
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)