import dotenv from 'dotenv';
import * as readline from 'readline';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Importación de los Agentes
import systemAgent from './systemAgent.js';
import appAgent from './appAgent.js';
import modeAgent from './modeAgent.js';

dotenv.config();
const execPromise = util.promisify(exec);

// ==========================================
// 0. ESTADO GLOBAL Y UI
// ==========================================
let estaProcesando = false;

const wss = new WebSocketServer({ port: 8080 });
function actualizarUI(estado, subtitulo = "") {
    wss.clients.forEach(c => { 
        if (c.readyState === 1) c.send(JSON.stringify({ estado, subtitulo, hablando: subtitulo })); 
    });
}

const servidorComandos = http.createServer((req, res) => {
    if (estaProcesando) { res.writeHead(429); return res.end('Ocupada'); }
    if (req.url === '/activar') { res.writeHead(200); res.end('Activado'); iniciarEscucha(); }
});
servidorComandos.listen(3000);

// ==========================================
// 1. MOTOR DE VOZ
// ==========================================
function hablar(texto) {
    if (!texto || texto.trim() === '') {
        estaProcesando = false; 
        actualizarUI("EN LÍNEA", "");
        return;
    }
    
    // Limpieza de Markdown y códigos antes de hablar
    let textoLimpio = texto
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*#_`~""'']/g, '')
        .replace(/\n/g, ', ')
        .trim();
    
    fs.writeFileSync('temp_texto.txt', textoLimpio);
    actualizarUI("HABLANDO", textoLimpio);
    
    const comando = `$HOME/.local/bin/edge-tts --voice es-MX-DaliaNeural -f temp_texto.txt --write-media temp_voz.mp3 && mpv --no-video --really-quiet --volume=200 temp_voz.mp3`;
    
    exec(comando, (error, stdout, stderr) => { 
        if(error) console.error("🐛 Error de Voz:", stderr);
        estaProcesando = false; 
        actualizarUI("EN LÍNEA", "");
    });
}

// ==========================================
// 2. DECLARACIÓN DE HERRAMIENTAS PARA GEMINI
// ==========================================
const herramientasGeraldine = {
    functionDeclarations: [
        {
            name: "terminal_bash",
            description: "Ejecuta un comando en la terminal de Linux. Úsalo SIEMPRE que el usuario pregunte por la RAM (free -h), discos (df -h) o estado del sistema.",
            parameters: {
                type: "OBJECT",
                properties: { comando: { type: "STRING" } },
                required: ["comando"]
            }
        },
        {
            name: "control_aplicaciones",
            description: "Abre o cierra aplicaciones en CachyOS. Úsalo si el usuario quiere música, navegar, programar, etc.",
            parameters: {
                type: "OBJECT",
                properties: {
                    accion: { type: "STRING", description: "'abrir' o 'cerrar'" },
                    app: { type: "STRING", description: "Nombre de la app (ej: spotify, navegador, terminal)" }
                },
                required: ["accion", "app"]
            }
        },
        {
            name: "leer_archivo_local",
            description: "Lee el contenido de un archivo local. Úsalo OBLIGATORIAMENTE para buscar apuntes, leer logs de MongoDB o leer código de Kyrosys.",
            parameters: {
                type: "OBJECT",
                properties: {
                    ruta: { type: "STRING", description: "La ruta exacta. Ej: './universidad/datos_ia.txt' o './kyrosys/index.js'" }
                },
                required: ["ruta"]
            }
        },
        {
            name: "escanear_red",
            description: "Ejecuta diagnósticos de red en el sistema. Úsalo si el usuario quiere saber su IP local, ver puertos abiertos (para bases de datos/servidores) o probar latencia con ping.",
            parameters: {
                type: "OBJECT",
                properties: {
                    accion: { type: "STRING", description: "'ver_ip', 'puertos_abiertos', o 'ping'" },
                    objetivo: { type: "STRING", description: "Dominio o IP para el ping (opcional, por defecto 8.8.8.8)" }
                },
                required: ["accion"]
            }
        },
        {
            name: "automatizar_git",
            description: "Sube los cambios de un proyecto local a GitHub ejecutando add, commit y push.",
            parameters: {
                type: "OBJECT",
                properties: {
                    ruta: { type: "STRING", description: "La ruta de la carpeta del proyecto a subir. Ej: './kyrosys' o '.' para la carpeta actual." },
                    mensaje: { type: "STRING", description: "Un mensaje de commit corto y descriptivo sobre los cambios realizados." }
                },
                required: ["ruta", "mensaje"]
            }
        }
    ]
};

// EJECUTOR FÍSICO DE LAS HERRAMIENTAS
async function ejecutarHerramientaLocal(nombre, args) {
    actualizarUI("PROCESANDO", `Ejecutando protocolo: ${nombre}...`);
    console.log(`\n⚙️ [HERRAMIENTA]: ${nombre} | Args:`, args);
    
    try {
        if (nombre === "terminal_bash") {
            const { stdout, stderr } = await execPromise(args.comando);
            return stdout || stderr || "Comando ejecutado sin salida en consola.";
        }
        
        if (nombre === "control_aplicaciones") {
            if (args.accion === "abrir") {
                await appAgent.abrir(args.app);
                return `Aplicación ${args.app} abierta exitosamente.`;
            } else {
                await appAgent.cerrar(args.app);
                return `Aplicación ${args.app} cerrada exitosamente.`;
            }
        }

        if (nombre === "leer_archivo_local") {
            const contenido = fs.readFileSync(args.ruta, 'utf8');
            return `CONTENIDO DE ${args.ruta}:\n` + contenido.substring(0, 3000);
        }
        // ... (código anterior de leer_archivo_local)

        if (nombre === "escanear_red") {
            try {
                if (args.accion === "ver_ip") {
                    const { stdout } = await execPromise("ip -brief a");
                    return `Información de red local:\n${stdout}`;
                } else if (args.accion === "puertos_abiertos") {
                    const { stdout } = await execPromise("ss -tuln");
                    return `Puertos TCP/UDP a la escucha en el sistema:\n${stdout}`;
                } else if (args.accion === "ping") {
                    const host = args.objetivo || "8.8.8.8";
                    const { stdout } = await execPromise(`ping -c 4 ${host}`);
                    return `Resultado del ping a ${host}:\n${stdout}`;
                }
            } catch (error) {
                return `Error en el diagnóstico de red: ${error.message}`;
            }
        }

        if (nombre === "automatizar_git") {
            try {
                // Entramos a la ruta solicitada, agregamos, comentamos y subimos.
                const comandoGit = `cd ${args.ruta} && git add . && git commit -m "${args.mensaje}" && git push`;
                const { stdout, stderr } = await execPromise(comandoGit);
                return `Cambios en la ruta ${args.ruta} subidos exitosamente a Git con el mensaje: "${args.mensaje}".`;
            } catch (error) {
                return `No se pudo hacer el push a Git. Es probable que no haya cambios nuevos, que la ruta sea incorrecta, o que falle la autenticación. Error interno: ${error.message}`;
            }
        }

        return "Herramienta no encontrada.";
    } catch (error) {
        return `Error al ejecutar la herramienta: ${error.message}`;
    }
}

// ==========================================
// 3. CEREBRO NUBE (GEMINI API)
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const promptSistema = `Eres Geraldine, IA administradora de sistema en CachyOS.
REGLAS ESTRICTAS:
1. NUNCA uses bloques de código ni formato Markdown en tus respuestas habladas. Habla de forma natural y directa.
2. Si te preguntan por RAM, CPU o discos, NO ADIVINES. Usa OBLIGATORIAMENTE la herramienta 'terminal_bash'.
3. MAPA DE ARCHIVOS LOCALES:
   - Apuntes de escuela: './universidad/'
   - Proyecto IoT: './kyrosys/'
   Si el usuario pregunta por un tema o código, usa 'leer_archivo_local' deduciendo la ruta correcta.`;

// Inicializamos el modelo con las herramientas y el prompt maestro
const modeloGemini = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: promptSistema,
    tools: [herramientasGeraldine]
});

// Iniciamos la sesión de chat (Mantiene el contexto)
const sesionChat = modeloGemini.startChat();

async function procesarIAGemini(textoUsuario) {
    actualizarUI("PENSANDO", "Analizando petición...");

    try {
        // 1. Enviamos el mensaje a Gemini
        let resultado = await sesionChat.sendMessage(textoUsuario);
        let llamadasHerramientas = resultado.response.functionCalls();

        // 2. Verificamos si Gemini decidió usar herramientas
        if (llamadasHerramientas && llamadasHerramientas.length > 0) {
            
            let respuestasHerramientas = [];

            // 3. Ejecutamos las herramientas en CachyOS
            for (const llamada of llamadasHerramientas) {
                const nombreFunc = llamada.name;
                const argumentos = llamada.args;
                
                const resultadoTerminal = await ejecutarHerramientaLocal(nombreFunc, argumentos);
                
                // Formateamos la respuesta para devolvérsela a Gemini
                respuestasHerramientas.push({
                    functionResponse: {
                        name: nombreFunc,
                        response: { resultado: String(resultadoTerminal) }
                    }
                });
            }

            // 4. Le devolvemos la información a Gemini para que termine de hablar
            actualizarUI("PENSANDO", "Formulando respuesta...");
            let respuestaFinal = await sesionChat.sendMessage(respuestasHerramientas);
            let textoHablado = respuestaFinal.response.text();
            
            console.log(`[GERALDINE]: ${textoHablado}`);
            hablar(textoHablado);

        } else {
            // Conversación normal sin herramientas
            let textoHablado = resultado.response.text();
            console.log(`[GERALDINE]: ${textoHablado}`);
            hablar(textoHablado);
        }

    } catch (error) {
        console.error("\n🐛 Error en la API de Gemini:", error.message);
        estaProcesando = false;
        
        // Si el error es por límite de peticiones (429)
        if (error.status === 429) {
            actualizarUI("ENFRIANDO", "Límite de API alcanzado...");
            hablar("Amo, he alcanzado mi límite de procesamiento en la nube. Por favor, dame un minuto para enfriar el núcleo antes de la siguiente orden.");
        } else {
            actualizarUI("ERROR", "Fallo de conexión");
            hablar("Hubo un error de conexión con mi cerebro principal.");
        }
    }
}

// ==========================================
// 4. OÍDOS
// ==========================================
function iniciarEscucha() {
    if (estaProcesando) return;
    estaProcesando = true;
    
    actualizarUI("ESCUCHANDO", "Micrófono abierto...");
    console.log(`\n🎤 [SISTEMA]: Grabando voz... `);
    
    const comandoGrabacion = 'rec -q -c 1 -r 16000 -b 16 -e signed-integer grabacion.wav silence 1 0.1 4% 1 0.6 4% trim 0 7';
    exec(comandoGrabacion, () => {
        actualizarUI("PROCESANDO", "Traducción neuronal...");
        exec('.venv/bin/python oido.py grabacion.wav', async (err, stdout) => {
            const orden = stdout.trim();
            if (!orden) { 
                console.log("🤫 [SISTEMA]: Sin orden clara.");
                estaProcesando = false; 
                actualizarUI("EN LÍNEA", "");
                return; 
            }
            console.log(`🗣️ [USUARIO]: "${orden}"`);
            procesarIAGemini(orden);
        });
    });
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (input) => { if (input.trim() === '') iniciarEscucha(); });

console.log("=== NÚCLEO MAESTRO V13 (API GEMINI ACTIVADA) ===");