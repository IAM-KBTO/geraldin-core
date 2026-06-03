import sys
import os
from PyQt6.QtCore import Qt, QUrl
from PyQt6.QtGui import QColor
from PyQt6.QtWidgets import QApplication, QMainWindow
from PyQt6.QtWebEngineWidgets import QWebEngineView

class HologramaIA(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("geraldine_hud")
        
        # BANDERAS MÁGICAS (Sintaxis PyQt6): Sin bordes, siempre arriba, invisible en barra de tareas
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint | 
            Qt.WindowType.WindowStaysOnTopHint | 
            Qt.WindowType.Tool
        )
        
        # Fondo completamente transparente a nivel de sistema operativo
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        
        # Crear el visor web interno
        self.browser = QWebEngineView()
        
        # Forzar que el fondo del navegador sea transparente (RGBA: 0,0,0,0)
        self.browser.page().setBackgroundColor(QColor(0, 0, 0, 0))
        
        # Cargar tu diseño HTML (asegúrate de que el archivo se llame holograma.html)
        ruta_absoluta = os.path.abspath("ui.html")
        self.browser.setUrl(QUrl(f"file://{ruta_absoluta}"))
        
        self.setCentralWidget(self.browser)
        
        # Tamaño del widget
        self.resize(400, 400)

app = QApplication(sys.argv)
window = HologramaIA()

# Calcular la resolución de tu pantalla para mandarlo a la esquina inferior derecha
screen = app.primaryScreen().availableGeometry()
window.move(screen.width() - 420, screen.height() - 420)

window.show()
# En PyQt6 se usa app.exec() sin guion bajo
sys.exit(app.exec())