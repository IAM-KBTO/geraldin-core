import cv2
import urllib.request
import time

# 1. Cargamos el modelo pre-entrenado de rostros frontales que viene incluido en OpenCV
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# 2. Iniciamos la cámara web (el 0 es la cámara por defecto de tu equipo)
cap = cv2.VideoCapture(0)

# 3. Optimizamos la cámara a bajísima resolución para que consuma casi 0% de CPU
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

print("👁️ [CENTINELA]: Activado y vigilando el entorno en segundo plano...")

rostros_consecutivos = 0

while True:
    ret, frame = cap.read()
    if not ret:
        time.sleep(1)
        continue

    # Convertimos la imagen a escala de grises (las matemáticas son más rápidas sin color)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Buscamos rostros en la imagen
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

    if len(faces) > 0:
        rostros_consecutivos += 1
    else:
        rostros_consecutivos = 0

    # 4. Si detectamos un rostro de forma constante durante 5 fotogramas
    if rostros_consecutivos >= 5:
        print("👤 [CENTINELA]: ¡Presencia detectada! Despertando al núcleo principal...")
        try:
            # Le "tocamos la puerta" a nuestro servidor en Node.js
            urllib.request.urlopen("http://localhost:3000/rostro-detectado")
        except Exception as e:
            pass
        
        # Dormimos el sensor visual por 60 segundos para que no te salude en bucle.
        # (Cuando ya esté en producción, puedes subir esto a 3600 segundos = 1 hora)
        time.sleep(60)
        rostros_consecutivos = 0
    else:
        # Pausa de medio segundo entre cada foto para ahorrar energía
        time.sleep(0.5)