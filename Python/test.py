import socket
import json

# Configuration
server_ip = "127.0.0.1"   # Adresse IP du serveur
server_port = 8000        # Port du serveur

# Création du socket UDP
client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

for i in range(2):
    message_dict = {
        "request": "login",
        "player_id": "player_id_1",
        "player_token": "abcdef"
    }

    # Convertir le dict en JSON string
    message_json = json.dumps(message_dict)

    # Envoi du message JSON encodé en UTF-8
    client_socket.sendto(message_json.encode('utf-8'), (server_ip, server_port))
    print(f"Message JSON envoyé : {message_json}")

# Fermeture du socket
client_socket.close()
