import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        name: process.env.APP_NAME || 'DataLineage',
        port: isNaN(port) ? 3000 : port,
        apiPrefix: process.env.API_PREFIX || 'api',
        fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'en',
    };
});