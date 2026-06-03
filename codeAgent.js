// codeAgent.js
import fs from 'fs';
import path from 'path';

// Define aquí la ruta raíz de tus proyectos para que Geraldine no se pierda
const RUTA_PROYECTOS = '/home/cabeto/Proyectos'; 

const codeAgent = {
    /**
     * Escanea una carpeta y devuelve la estructura de archivos
     * Ignora carpetas pesadas para no saturar a la IA
     */
    escanearProyecto: (nombreProyecto) => {
        const rutaCompleta = path.join(RUTA_PROYECTOS, nombreProyecto);
        
        if (!fs.existsSync(rutaCompleta)) {
            return `Error: El proyecto ${nombreProyecto} no existe en ${RUTA_PROYECTOS}.`;
        }

        console.log(`[Geraldine]: Escaneando estructura de ${nombreProyecto}...`);
        
        try {
            // Leemos el directorio pero filtramos node_modules y .git
            const archivos = fs.readdirSync(rutaCompleta).filter(file => {
                return file !== 'node_modules' && file !== '.git' && file !== '.venv';
            });
            return `Estructura de ${nombreProyecto}: ` + archivos.join(', ');
        } catch (error) {
            return "Error al intentar leer el directorio.";
        }
    },

    /**
     * Lee el contenido exacto de un archivo para analizarlo
     */
    leerArchivo: (nombreProyecto, nombreArchivo) => {
        const rutaCompleta = path.join(RUTA_PROYECTOS, nombreProyecto, nombreArchivo);
        
        if (!fs.existsSync(rutaCompleta)) {
            return `Error: No encuentro el archivo ${nombreArchivo} en ${nombreProyecto}.`;
        }

        console.log(`[Geraldine]: Analizando código de ${nombreArchivo}...`);
        
        try {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            // Si el archivo es demasiado gigante, lo cortamos para no romper a Llama 3.2
            if (contenido.length > 4000) {
                return `Contenido de ${nombreArchivo} (Fragmento inicial):\n` + contenido.substring(0, 4000) + "\n...[ARCHIVO TRUNCADO POR TAMAÑO]";
            }
            return `Contenido de ${nombreArchivo}:\n${contenido}`;
        } catch (error) {
            return "Error de permisos al leer el archivo.";
        }
    }
};

export default codeAgent;