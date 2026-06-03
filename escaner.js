import dotenv from 'dotenv';
dotenv.config();

async function buscarModelos() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'tu_clave_secreta_aqui') {
        console.log("❌ Error: Parece que no has puesto una API Key real en el archivo .env");
        return;
    }

    console.log("📡 Conectando con Google AI Studio...");
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("⚠️ Error de Google:", data.error.message);
            return;
        }

        console.log("\n✅ Los modelos exactos que tu cuenta puede usar para Geraldine son:");
        data.models.forEach(m => {
            // Filtramos solo los que sirven para generar texto (generateContent)
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`👉 ${m.name.replace('models/', '')}`);
            }
        });
        console.log("\nCopia uno de los nombres con el emoji 👉 y ponlo en tu archivo index.js");
    } catch (error) {
        console.error("Error de red:", error);
    }
}

buscarModelos();
