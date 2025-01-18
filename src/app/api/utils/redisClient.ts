import { createClient } from 'redis';
import { createLoggerWithLabel } from './logger';

const logger = createLoggerWithLabel('Redis');

// Configuration
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

// Create Redis client configuration
const redisClient = createClient({
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});

// Sleep utility function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Connect to Redis with retry logic
async function connectWithRetry(retryAttempt = 1): Promise<void> {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            logger.info('Successfully connected to Redis');
        }
    } catch (error) {
        logger.error(
            `Redis connection attempt ${retryAttempt} failed: ${error}`
        );

        if (retryAttempt < MAX_RETRY_ATTEMPTS) {
            logger.info(
                `Retrying connection in ${RETRY_DELAY_MS / 1000} seconds... (Attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})`
            );
            await sleep(RETRY_DELAY_MS);
            return connectWithRetry(retryAttempt + 1);
        } else {
            logger.error(
                `Failed to connect to Redis after ${MAX_RETRY_ATTEMPTS} attempts`
            );
            throw new Error(
                `Redis connection failed after ${MAX_RETRY_ATTEMPTS} attempts`
            );
        }
    }
}

// Check Redis connection health
async function checkRedisConnection(): Promise<boolean> {
    try {
        // Use `ping` to verify if Redis responds
        const pong = await redisClient.ping();
        if (pong === 'PONG') {
            logger.info('Redis is healthy');
            return true;
        }
        throw new Error('Unexpected Redis response');
    } catch (error) {
        logger.error(`Redis health check failed: ${error}`);
        return false;
    }
}

// Helper function to ensure Redis is connected before operations
async function ensureConnection(): Promise<boolean> {
    if (!redisClient.isOpen) {
        try {
            await connectWithRetry();
            return true;
        } catch (error) {
            logger.error(`Failed to establish a Redis connection: ${error}`);
            return false;
        }
    }
    return true;
}

// Initialize connection
connectWithRetry().catch((err) => {
    logger.error(`Fatal Redis connection error: ${err}`);
    process.exit(1); // Exit process on fatal connection error
});

// Event listeners for connection monitoring
redisClient.on('error', (err) => {
    logger.error(`Redis Client Error: ${err}`);
});

redisClient.on('reconnecting', () => {
    logger.info('Redis client attempting to reconnect...');
});

redisClient.on('connect', () => {
    logger.info('Redis client connected');
});

// Export the Redis client and helper functions
export { redisClient, checkRedisConnection, ensureConnection };
