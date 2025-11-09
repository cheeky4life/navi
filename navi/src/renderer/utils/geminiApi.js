// Gemini API utility functions
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache API key and model instance
let API_KEY = null;
let genAI = null;
let modelInstance = null;

// Get API key from main process
async function getApiKey() {
    if (API_KEY) {
        return API_KEY;
    }
    
    try {
        if (window.electron?.api?.getGeminiKey) {
            const result = await window.electron.api.getGeminiKey();
            API_KEY = result.apiKey;
            
            if (!API_KEY) {
                throw new Error('Gemini API key not found');
            }
            
            genAI = new GoogleGenerativeAI(API_KEY);
            return API_KEY;
        } else {
            throw new Error('Electron API not available');
        }
    } catch (error) {
        console.error('Error getting API key:', error);
        throw new Error('Failed to get Gemini API key');
    }
}

// List of models to try in order of preference
const MODEL_OPTIONS = [
    "gemini-1.5-flash",  // Fast and efficient
    "gemini-1.5-pro",    // More capable
    "gemini-pro",        // Fallback
];

// Initialize model
const initializeModel = async () => {
    await getApiKey();
    
    if (!genAI) {
        throw new Error('Failed to initialize Gemini API');
    }

    for (const modelName of MODEL_OPTIONS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Test the model with a simple prompt
            const result = await model.generateContent("Hello");
            const response = await result.response;
            const text = response.text();
            console.log(`Successfully initialized model: ${modelName}`);
            return model;
        } catch (error) {
            console.warn(`Error with model ${modelName}:`, error.message);
            // Continue to next model
            continue;
        }
    }
    throw new Error('No available AI models found. Please check your API key.');
};

// Get Gemini response with context
export const getGeminiResponse = async (input, context = {}) => {
    try {
        // Initialize model if not already done
        if (!modelInstance) {
            modelInstance = await initializeModel();
        }

        // Build a more contextual prompt
        let prompt = input;
        
        if (context.documents && context.documents.length > 0) {
            const docList = context.documents.map(doc => `- ${doc.name}`).join('\n');
            prompt = `Context: The user has these documents: ${docList}\n\nUser request: ${input}`;
        }
        
        if (context.selectedDocument) {
            prompt += `\n\nNote: The user is currently working with "${context.selectedDocument.name}"`;
        }

        // Generate response with streaming for better UX
        const result = await modelInstance.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return text;
    } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Clear model instance on certain errors to force re-initialization
        if (error.message?.includes('API key') || error.message?.includes('permission') || error.message?.includes('quota')) {
            modelInstance = null;
            API_KEY = null;
            genAI = null;
            
            if (error.message?.includes('API key')) {
                throw new Error('Invalid Gemini API key. Please check your configuration.');
            } else if (error.message?.includes('quota')) {
                throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
            } else {
                throw new Error('AI model temporarily unavailable. Please try again.');
            }
        }
        
        throw error;
    }
};

// Clear cached model (useful for re-initialization)
export const clearModelCache = () => {
    modelInstance = null;
};