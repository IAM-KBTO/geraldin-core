import { spawn, exec } from 'child_process';
import util from 'util';

const runCommand = util.promisify(exec);

// DICCIONARIO INTELIGENTE: Traduce lenguaje humano al binario de CachyOS
const diccionarioApps = {
    'navegador': 'vivaldi-stable',
    'youtube': 'vivaldi-stable',
    'spotify': 'spotify-launcher',
    'música': 'spotify-launcher',
    'editor': 'code',
    'código': 'code',
    'terminal': 'kitty',
    'archivos': 'thunar', // o nautilus/dolphin, dependiendo de tu explorador
    'discord': 'discord'
};

const appAgent = {
    /**
     * Abre cualquier aplicación dinámicamente
     */
    abrir: (appHablada) => {
        const nombreLimpio = appHablada.toLowerCase().trim();
        const comando = diccionarioApps[nombreLimpio] || nombreLimpio; // Usa el diccionario o la palabra cruda
        
        console.log(`[Geraldine]: Lanzando proceso -> ${comando}`);
        const process = spawn(comando, [], { detached: true, stdio: 'ignore' });
        process.unref();
    },

    /**
     * Cierra aplicaciones o la ventana actual en pantalla
     */
    cerrar: async (appHablada) => {
        const nombreLimpio = appHablada.toLowerCase().trim();
        const comando = diccionarioApps[nombreLimpio] || nombreLimpio;
        
        console.log(`[Geraldine]: Destruyendo proceso -> ${comando}`);
        try {
            // Intenta matar el proceso por su nombre en Linux
            await runCommand(`killall ${comando}`);
        } catch (error) {
            console.log("[Geraldine]: Proceso no encontrado. Cerrando ventana activa en Hyprland...");
            // Si no sabe el nombre del proceso, simplemente cierra la ventana que tengas enfocada
            await runCommand('hyprctl dispatch killactive');
        }
    }
};

export default appAgent;