// Vercel Serverless Function entry point for backend
// This file imports the Express app from the built dist/server.js

// Since package.json has "type": "module", we use ES module syntax
// Import the compiled server.js which exports the Express app as default

let cachedApp = null;

async function loadApp() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Import the compiled server.js
    const serverModule = await import('../dist/server.js');
    cachedApp = serverModule.default || serverModule;
    return cachedApp;
  } catch (error) {
    console.error('Error loading server module:', error);
    console.error('Error stack:', error.stack);
    
    // Fallback: create a simple Express app that shows the error
    const express = (await import('express')).default;
    const fallbackApp = express();
    
    fallbackApp.get('*', (req, res) => {
      res.status(500).json({ 
        error: 'Failed to load server',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        details: 'Please check server logs'
      });
    });
    
    cachedApp = fallbackApp;
    return cachedApp;
  }
}

// Vercel expects a handler function
export default async function handler(req, res) {
  const app = await loadApp();
  return app(req, res);
}