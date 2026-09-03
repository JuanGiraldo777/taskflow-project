"""
Servidor estático de desarrollo — igual que `python -m http.server`, pero
manda Cache-Control: no-store en cada respuesta. Sin esto, el navegador
retiene los módulos JS en caché entre recargas y los cambios no se ven
reflejados aunque el archivo en disco ya esté actualizado.
Uso: python _devserver.py [puerto]  (default 5500)
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    server = ThreadingHTTPServer(("0.0.0.0", port), NoCacheHandler)
    print(f"Sirviendo en http://localhost:{port} (sin caché)")
    server.serve_forever()
