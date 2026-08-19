#!/usr/bin/env python
"""
Aether AI Live Server Manager
Usage:
  python manage.py runserver
  python manage.py runserver 8000
"""
import sys
import os
import socket
import uvicorn

# Configure stdout for utf-8 safely on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def is_port_available(host: str, port: int) -> bool:
    """Check if the given host:port is free and accessible to bind."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind((host, port))
            return True
    except OSError:
        return False

def find_available_port(host: str, preferred_port: int) -> int:
    """Find a usable port starting from preferred_port."""
    if is_port_available(host, preferred_port):
        return preferred_port
    
    fallback_ports = [8000, 8080, 5000, 8001, 8002, 3000]
    for p in fallback_ports:
        if is_port_available(host, p):
            return p
            
    # As a last resort, let OS assign a free port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((host, 0))
        return s.getsockname()[1]

def main():
    host = "127.0.0.1"
    preferred_port = 8000

    # Parse command line args
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd in ("--help", "-h", "help"):
            print("Usage: python manage.py runserver [port]")
            print("Example: python manage.py runserver 8000")
            return
        elif cmd in ("runserver", "start", "serve"):
            if len(sys.argv) > 2:
                try:
                    port_arg = sys.argv[2]
                    if ":" in port_arg:
                        host, port_str = port_arg.split(":")
                        preferred_port = int(port_str)
                    else:
                        preferred_port = int(port_arg)
                except ValueError:
                    pass

    port = find_available_port(host, preferred_port)
    url = f"http://{host}:{port}"
    
    print("=" * 64)
    print("AETHER AI - Multimodal Voice & Text Live Server")
    print(f"Server URL: {url}")
    print("=" * 64)
    print("Press CTRL+C in terminal to stop the server.\n")

    uvicorn.run("app:app", host=host, port=port, reload=True)

if __name__ == "__main__":
    main()
