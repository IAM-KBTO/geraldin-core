import { exec } from 'child_process';
import util from 'util';

// Convertimos la función exec tradicional en una basada en Promesas
const runCommand = util.promisify(exec);

const systemAgent = {
    /**
     * Bloquea la estación de trabajo con el efecto de desenfoque
     */
    lockWorkspace: async () => {
        try {
            console.log("[Geraldine]: Activando protocolo de seguridad...");
            await runCommand('hyprlock');
            return "Estación de trabajo bloqueada con éxito.";
        } catch (error) {
            console.error("[Geraldine Error]: No se pudo activar hyprlock.", error);
            return "Ocurrió un error al intentar asegurar la pantalla.";
        }
    },

    /**
     * Despliega el menú elegante de apagado
     */
    showPowerMenu: async () => {
        try {
            console.log("[Geraldine]: Abriendo interfaz de energía...");
            await runCommand('wlogout');
            return "Menú de energía desplegado en pantalla.";
        } catch (error) {
            console.error("[Geraldine Error]: Falla al lanzar wlogout.", error);
            return "Hubo un problema al abrir el menú de apagado.";
        }
    },

    /**
     * Cambia el fondo interactuando con Variety
     */
    refreshAesthetics: async () => {
        try {
            console.log("[Geraldine]: Solicitando nuevo arte visual a Variety...");
            // El comando 'variety -n' (next) fuerza la transición de imagen
            await runCommand('variety -n');
            return "He actualizado la estética del escritorio.";
        } catch (error) {
            console.error("[Geraldine Error]: El motor de fondos no responde.", error);
            return "No pude conectar con el gestor de fondos.";
        }
    },

    /**
     * Apagado forzado e inmediato
     */
    executeShutdown: async () => {
        try {
            console.log("[Geraldine]: Iniciando apagado del sistema. Hasta pronto.");
            await runCommand('systemctl poweroff');
            return "Apagando...";
        } catch (error) {
            console.error("[Geraldine Error]: Permisos insuficientes para apagar.", error);
            return "El sistema bloqueó mi intento de apagado.";
        }
    }
};

// Exportación moderna (ES Modules)
export default systemAgent;