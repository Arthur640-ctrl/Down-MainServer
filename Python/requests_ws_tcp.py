import re
import firebase_admin
from firebase_admin import credentials, firestore
import bcrypt
import uuid
from datetime import datetime
import requests
from game.game_manager.main import add_player, check_player
from google.cloud.firestore_v1 import FieldFilter

if not firebase_admin._apps:
    cred = credentials.Certificate('config/firebase.json')
    firebase_admin.initialize_app(cred)
db = firestore.client()

regex_email = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$"

def register(infos):
    print("Register :", infos)
    users_ref = db.collection('users')
    # Verification of the email
    if re.match(regex_email, infos["email"]):

        # Check if the email not already exist   
        query = users_ref.where(
            filter=FieldFilter("email", "==", infos["email"])
        ).limit(1)

        results = query.get()

        if results:
            return {"code": 403, "state": "email_already_exist"}
        else:

            # Check if the pseudo not already exist
            query = users_ref.where('pseudo', '==',  infos["pseudo"]).limit(1)
            results = query.get()

            if results:
                return {"code": 403, "state": "pseudo_already_used"}
            else:
                salt = bcrypt.gensalt()
                hashed_password = bcrypt.hashpw(infos["password"].encode('utf-8'), salt).decode('utf-8')

                account_id = str(uuid.uuid4())

                register_final = {
                    "email": infos["email"],
                    "pseudo": infos["pseudo"],
                    "password": hashed_password,
                    "account_id": account_id,
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "last_login": None,
                    "profile": {
                        "avatar": "https://example.com/avatar1.png"
                    },
                    "settings": {
                    },
                    "friends": [],
                    "two_factor_enabled": False,
                    "token": None
                }

                doc_ref = db.collection("users").document(account_id)
                doc_ref.set(register_final)

                return {"code": 200, "state": "account_created"}
    else:
        return {"code": 400, "state": "is_not_a_email"}

def login(infos, ip="0.0.0.0", user_agent="Unknown"):

    email = infos["email"]
    password = infos["password"]

    user_query = db.collection("users").where(
        filter=FieldFilter("email", "==", email)
    ).limit(1).get()

    if not user_query:
        return {"code": 404, "state": "email_not_found"}
    
    user_doc = user_query[0]
    user = user_doc.to_dict()
    account_id = user["account_id"]

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        return {"code": 403, "state": "wrong_password"}
    
    session_token = str(uuid.uuid4())

    try:
        geo_resp = requests.get(f"http://ip-api.com/json/{ip}").json()
        location = f"{geo_resp.get('city', 'Unknown')}, {geo_resp.get('country', 'Unknown')}"
    except:
        location = "Unknown"

    session_ref = db.collection("sessions").document(account_id)

    now_iso = datetime.utcnow().isoformat() + "Z"
    new_session = {
        "ip": ip,
        "user_agent": user_agent,
        "token": session_token,
        "connected_at": now_iso,
        "location": location
    }

    session_ref.set({
        "latest_token": session_token,
        "latest_login": firestore.SERVER_TIMESTAMP,
        "historique": firestore.ArrayUnion([new_session])
    }, merge=True)

    return {"code": 200, "state": "user_is_connected", "token": session_token, "player_id": account_id}

def join_queue(infos):
    email = infos["email"]
    token = infos["token"]

    user_query = db.collection("users").where(
        filter=FieldFilter("email", "==", email)
    ).limit(1).get()

    if not user_query:
        return {"code": 404, "state": "email_not_found"}

    user_doc = user_query[0]
    user_data = user_doc.to_dict()
    account_id = user_data["account_id"]

    session_doc = db.collection("sessions").document(account_id).get()
    if not session_doc.exists:
        return {"code": 403, "state": "session_not_found"}

    session_data = session_doc.to_dict()
    expected_token = session_data.get("latest_token")

    if token != expected_token:
        return {"state": 401, "message": "invalid_token"}

    join_queue = add_player(account_id)

    return join_queue

def check_for_our_game(infos):
    email = infos["email"]
    token = infos["token"]

    user_query = db.collection("users").where(
        filter=FieldFilter("email", "==", email)
    ).limit(1).get()

    if not user_query:
        return {"state": 404, "message": "email not found"}

    user_doc = user_query[0]
    user_data = user_doc.to_dict()
    account_id = user_data["account_id"]

    session_doc = db.collection("sessions").document(account_id).get()
    if not session_doc.exists:
        return {"state": 403, "message": "session not found"}

    session_data = session_doc.to_dict()
    expected_token = session_data.get("latest_token")

    if token != expected_token:
        return {"state": 401, "message": "invalid token"}
    
    return check_player(account_id)