import socket
import msgpack
import json

UDP_IP = "0.0.0.0"
UDP_PORT = 41234

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

print(f"Servidor de Telemetria rodando na porta {UDP_PORT}...")
print("Aguardando conexao do carrinho via Wi-Fi...\n")

while True:
    data, addr = sock.recvfrom(4096)
    try:
        # Tenta decodificar o MessagePack que o ESP32 enviou
        pacotes = msgpack.unpackb(data, raw=False)
        
        # Pode ser um array de pacotes (lote) ou um pacote individual
        if not isinstance(pacotes, list):
            pacotes = [pacotes]
            
        for pacote in pacotes:
            print(f"[Wi-Fi | {addr[0]}] Bateria: {pacote.get('bateria_v')}V | FSM: {pacote.get('estado_fsm')} | Ticks X: {pacote.get('posicao_x')}")
            
    except Exception as e:
        print(f"Erro ao decodificar pacote: {e}")
