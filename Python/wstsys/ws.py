import asyncio
import threading
import json
import websockets
import requests_ws_tcp

with open("config/config.json") as f:
    config = json.load(f)

WEBSOCKET_PORT = config["server"]["websocket_port"]
HOST = config["server"]["host"]

clients = set()

async def handle_websocket(websocket):
    addr = websocket.remote_address
    clients.add(websocket)
    try:
        async for message in websocket:
            try:
                request = json.loads(message)
                response = deal_request(request)
                await websocket.send(json.dumps(response))
            except Exception as e:
                print(f"[WebSocket] Erreur dans le traitement de la requête: {e}")
                await websocket.send(json.dumps({"status": "error", "message": str(e)}))
    except Exception as e:
        print(f"[WebSocket] Erreur client {addr}: {e}")
    finally:
        clients.remove(websocket)

async def websocket_server_main():
    async with websockets.serve(handle_websocket, HOST, WEBSOCKET_PORT):
        print(f"[WST] Serveur en écoute sur le port {WEBSOCKET_PORT}")
        await asyncio.Future()

def start_websocket_server():
    asyncio.run(websocket_server_main())

def deal_request(request):
    if request.get("type") == "register":
        return requests_ws_tcp.register(request)
    elif request.get("type") == "login":
        return requests_ws_tcp.login(request)
    elif request.get("type") == "join_queue":
        return requests_ws_tcp.join_queue(request)
    elif request.get("type") == "check_queue_statut":
        return requests_ws_tcp.check_for_our_game(request)
    else:
        return {"message": "Type de requête inconnu"}

