import threading
from wstsys.ws import start_websocket_server
from game.game_manager.main import check_queue

if __name__ == "__main__":
    print("🟢 Lancement du serveur principal...")

    ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
    matchmaking_thread = threading.Thread(target=check_queue, daemon=True)

    ws_thread.start()
    matchmaking_thread.start()

    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur.")
