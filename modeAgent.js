import { exec } from 'child_process';
import util from 'util';
import appAgent from './appAgent.js';

const runCommand = util.promisify(exec);

const modeAgent = {
    /**
     * Prepara todo el entorno para desarrollar tu proyecto principal
     */
    startKyrosysMode: async () => {
        console.log("[Geraldine]: Iniciando entorno de desarrollo para KYROSYS.");
        
        try {
            // 1. Movernos al Espacio de Trabajo 2 (Workspace dedicado a código)
            await runCommand('hyprctl dispatch workspace 2');
            
            // 2. Abrir herramientas de hardware y software simultáneamente
            // ESTA ES LA NUEVA SINTAXIS DINÁMICA:
            appAgent.abrir('editor');
            appAgent.abrir('terminal');
            
            // 3. (Opcional) Levantar servicios locales en segundo plano 
            // await runCommand('sudo systemctl start mongodb postgresql');
            
            return "Entorno KYROSYS preparado. Editor y terminal en posición.";
        } catch (error) {
            console.error("[Geraldine Error]: Fallo al orquestar el entorno de desarrollo.", error);
            return "Hubo un problema al preparar las herramientas de desarrollo.";
        }
    },

    /**
     * Prepara un entorno relajado para juegos cooperativos o en solitario
     */
    startGamingMode: async () => {
        console.log("[Geraldine]: Preparando modo de entretenimiento.");
        
        try {
            // Movernos al Espacio de Trabajo 5 (Aislado de las distracciones)
            await runCommand('hyprctl dispatch workspace 5');
            
            // Iniciar juego de Steam (ej. 413150 es Stardew Valley)
            appAgent.launchSteamGame('413150');
            
            return "Modo de juego activo. Que te diviertas.";
        } catch (error) {
            console.error("[Geraldine Error]: No se pudo iniciar el entorno de juegos.", error);
            return "No pude arrancar la plataforma de juegos.";
        }
    },
    
    /**
     * Modo de concentración total
     */
    startFocusMode: async () => {
        console.log("[Geraldine]: Activando modo concentración. Silenciando notificaciones.");
        try {
            // Pausar las notificaciones visuales (Mako)
            await runCommand('makoctl mode -s do-not-disturb');
            return "Modo concentración activado. No recibirás interrupciones.";
        } catch (error) {
            console.error("[Geraldine Error]: Fallo al silenciar Mako.", error);
            return "Error al configurar el modo de concentración.";
        }
    }
};

export default modeAgent;