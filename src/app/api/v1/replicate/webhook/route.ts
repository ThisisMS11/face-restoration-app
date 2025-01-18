import { NextResponse } from 'next/server';
import { redisClient, ensureConnection } from '@/app/api/utils/redisClient';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { TASKS_MAP } from '@/constants';

const logger = createLoggerWithLabel('WEBHOOK_REPLICATE');

// Define valid status types
// type PredictionStatus = 'succeeded' | 'processing' | 'failed';

async function storePredictionData(predictionId: string, payload: any) {
    try {
        if (!predictionId) {
            throw new Error('Prediction ID is required');
        }

        // Validate required payload fields
        if (!payload || typeof payload !== 'object') {
            throw new Error('Invalid payload format');
        }

        // logger.info(`Face Restore payload : ${JSON.stringify(payload)}`);

        // Updated data structure to match the input parameters from the main route
        const data = {
            status: payload.status || 'unknown',
            output_url: payload.output ? JSON.stringify(payload.output) : '',
            // Add all input parameters
            tasks: payload.input?.tasks || 'face-restoration',
            num_inference_steps: payload.input?.num_inference_steps || 30,
            decode_chunk_size: payload.input?.decode_chunk_size || 16,
            overlap: payload.input?.overlap || 3,
            noise_aug_strength: payload.input?.noise_aug_strength || 0,
            min_appearance_guidance:
                payload.input?.min_appearance_guidance_scale || 2,
            max_appearance_guidance:
                payload.input?.max_appearance_guidance_scale || 2,
            i2i_noise_strength: payload.input?.i2i_noise_strength || 1,
            seed: payload.input?.seed || '',
            video_url: payload.input?.video || '',
            // Existing fields
            created_at: payload.created_at || '',
            completed_at: payload.completed_at || '',
            predict_time: payload.metrics?.predict_time || '',
            urls: JSON.stringify({
                cancel: payload.urls?.cancel || '',
                get: payload.urls?.get || '',
                stream: payload.urls?.stream || '',
            }),
            ...(payload.input?.tasks ===
                TASKS_MAP.faceRestorationAndColorizationAndInpainting && {
                mask: payload.input?.mask,
            }),
        };

        // Store in Redis with retry logic
        let retries = 3;
        while (retries > 0) {
            try {
                await redisClient.hSet(`prediction:${predictionId}`, data);
                break;
            } catch (redisError) {
                retries--;
                if (retries === 0) throw redisError;
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
        }

        logger.info(
            `Successfully stored prediction ${predictionId} with status ${data.status} in redis`
        );
    } catch (error) {
        logger.error(
            `Failed to store prediction data for ${predictionId}: ${error}`
        );
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        logger.info(
            `Webhook received for prediction ${payload.id} with status ${payload.status}`
        );

        // Add validation for webhook_events_filter events
        if (
            !payload.id ||
            !['failed', 'processing', 'succeeded'].includes(payload.status)
        ) {
            logger.error(`Invalid webhook event: ${JSON.stringify(payload)}`);
            return NextResponse.json(
                { error: 'Invalid webhook event' },
                { status: 400 }
            );
        }

        // Check Redis connection

        const redisConnected = await ensureConnection();

        if (!redisConnected) {
            logger.error('Redis connection failed');
            return NextResponse.json(
                { error: 'Redis connection failed' },
                { status: 500 }
            );
        }

        // Store prediction data regardless of status
        await storePredictionData(payload.id, payload);

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error(`Webhook error: ${error}`);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
