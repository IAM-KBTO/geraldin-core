import sys, json, wave
from vosk import Model, KaldiRecognizer
import logging

# Silenciamos los logs técnicos de Vosk para que solo nos devuelva el texto
logging.getLogger("vosk").setLevel(logging.ERROR)

# Cargamos el modelo en español
model = Model("modelo-voz")

# Leemos el archivo que Node.js nos envíe (argumento 1)
wf = wave.open(sys.argv[1], "rb")
rec = KaldiRecognizer(model, wf.getframerate())

while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    rec.AcceptWaveform(data)

# Extraemos el texto final detectado y lo imprimimos
resultado = json.loads(rec.FinalResult())
print(resultado["text"])