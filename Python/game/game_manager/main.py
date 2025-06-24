import re
import firebase_admin
from firebase_admin import credentials, firestore
import bcrypt
import uuid
from datetime import datetime
import requests
from google.cloud.firestore_v1 import FieldFilter
import json
from server_sys.logger import setup_logger

queue_logger = setup_logger("queue", "logs/queue")

if not firebase_admin._apps:
    cred = credentials.Certificate('config/firebase.json')
    firebase_admin.initialize_app(cred)
db = firestore.client()

# ===== Conf. Var : =====
DB_COLLECTION_QUEUE = None
DB_COLLECTION_GAMES = None
PLAYER_IN_GAME = None
# =======================

def count_documents(collection_name):
    docs = db.collection(collection_name).stream()
    count = sum(1 for _ in docs)
    return count

def start_queue(config_file = "config/config.json"):
    queue_logger.info("Starting the matchmaking system...")
    queue_logger.info("Loading Matchmaking Resources...")
    global DB_COLLECTION_QUEUE
    global PLAYER_IN_GAME
    global DB_COLLECTION_GAMES
    
    try:
        with open(config_file, "r") as f:
            config = json.load(f)

        DB_COLLECTION_QUEUE = config["queue_settings"]["queue_db_collection"]
        DB_COLLECTION_GAMES = config["queue_settings"]["games_db_collection"]
        PLAYER_IN_GAME = config["game_settings"]["player_game"]
    except Exception as e:
        queue_logger.critical(f"Unable to load resources needed for matchmaking : {e}")

    queue_logger.info("Matchmaking resources successfully loaded")

def add_player(player_id):
    # 1. Check
    docs = db.collection(DB_COLLECTION_QUEUE).stream()

    for doc in docs:
        if doc.id == player_id:
            queue_logger.warning(f"Unable to add player {player_id} to queue because he is already in queue")
            return {"code": "403", "state": "already_in_queue"}
    
    # 2. Add
    player_data = {
        "entered_at": firestore.SERVER_TIMESTAMP,
        "state": "waiting",
        "game_id": None
    }

    db.collection(DB_COLLECTION_QUEUE).document(player_id).set(player_data)

    queue_logger.info(f"Player {player_id} added to queue")
    return {"code": "200", "state": "player_added_in_queue"}

def remove_player(player_id):
    # 1. Check
    docs = db.collection(DB_COLLECTION_QUEUE).document(player_id)
    doc = docs.get()

    if doc.exists == False:
        queue_logger.warning(f"Unable to remove player {player_id} from queue because he is not present")
        return {"code": "404", "state": "not_in_queue"}
    
    # 2. Remove
    docs.delete()

    queue_logger.info(f"Player {player_id} removed from queue")
    return {"code": "200", "state": "player_removed_queue"}

def check_queue():
    start_queue()
    while True:
        # 1. Get all x first player with state == "waiting"
        query = (
            db.collection(DB_COLLECTION_QUEUE)
            .where("state", "==", "waiting") 
            .order_by("entered_at")
            .limit(PLAYER_IN_GAME)
        )
        docs = query.stream()
        
        next_game_players = []

        for doc in docs:
            print(doc.id)
            next_game_players.append(doc.id)

        if len(next_game_players) < PLAYER_IN_GAME:
            pass
            # print("Aucune Game éligible...")
        else:
            # print(f"Game éligible : {next_game_players}")
            start_game(next_game_players)

def check_player(player_id):
    doc_ref = db.collection(DB_COLLECTION_QUEUE).document(player_id)
    doc = doc_ref.get()

    if not doc.exists:
        queue_logger.debug(f"[PLAYER VERIFICATION] Player {player_id} is not present in queue")
        return {"code": 404, "state": "player_not_in_queue"}

    player_data = doc.to_dict()

    if player_data["state"] == "waiting":
        queue_logger.debug(f"[PLAYER VERIFICATION] Player {player_id} is in queue but not affiliated with a game")
        return {"code": 102, "state": "player_in_queue_not_ready"}

    elif player_data["state"] == "ready":
        game_ref = db.collection(DB_COLLECTION_GAMES).document(player_data["game_id"])
        game_doc = game_ref.get()

        if not game_doc.exists:
            queue_logger.debug(f"[PLAYER VERIFICATION] Game {player_data["game_id"]} not found")
            return {"code": 500, "state": "game_not_found"}

        game_data = game_doc.to_dict()

        queue_logger.debug(f"[PLAYER VERIFICATION] The player is ready for integration into the game {player_data["game_id"]} at IP {game_data["game_settings"]["game_ip"]} and port {game_data["game_settings"]["game_port"]}")

        return {
            "code": 200,
            "state": "player_ready",
            "game_id": player_data["game_id"],
            "ip": game_data["game_settings"]["game_ip"],
            "port": game_data["game_settings"]["game_port"]
        }

def start_game(players):
    game_id = str(uuid.uuid4())

    print(f"[MATCHMAKING] Nouvelle partie crée. Joueurs : {players}. ID : {game_id}")

    for player in players:
        doc_ref = db.collection(DB_COLLECTION_QUEUE).document(player)
        doc_ref.update({
            "state": "ready",
            "game_id": game_id
        })

    game_data = {
        "game_id": game_id,
        "players": players,
        "game_status": {
            "created_at": firestore.SERVER_TIMESTAMP,
            "start_time": None,
            "ended_at": None,
            "actual_status": "waiting"
        },
        "game_settings": {
            "game_port": None,
            "game_ip": "0.0.0.0",
        },
        "game_security": {
            "anti_cheat": False,
            "logs_levels": 5 # 5 = All
        }
    }

    doc_ref = db.collection(DB_COLLECTION_GAMES).document(game_id)
    doc_ref.set(game_data)