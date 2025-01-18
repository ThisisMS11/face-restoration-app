import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { VideoSettings } from '@/types';
import { TASKS_MAP } from '@/constants';

const logger = createLoggerWithLabel('RESTORE_REPLICATE');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
    try {
        const { settings }: { settings: VideoSettings } = await request.json();

        logger.info(
            `Upscaling video ${settings.video} with tasks ${settings.tasks}`
        );

        if (!settings.video) {
            logger.warn('Video URL is required');
            return NextResponse.json(
                { error: 'Video URL is required' },
                { status: 400 }
            );
        }

        if (
            settings.tasks ===
                TASKS_MAP.faceRestorationAndColorizationAndInpainting &&
            !settings.mask
        ) {
            logger.warn('Mask URL is required');
            return NextResponse.json(
                { error: 'Mask URL is required' },
                { status: 400 }
            );
        }

        const {
            seed: seed = -1,
            tasks = 'face-restoration',
            video,
            overlap = 3,
            decodeChunkSize: decode_chunk_size = 16,
            i2iNoiseStrength: i2i_noise_strength = 1,
            noiseAugStrength: noise_aug_strength = 0,
            numInferenceSteps: num_inference_steps = 30,
            maxAppearanceGuidanceScale: max_appearance_guidance_scale = 2,
            minAppearanceGuidanceScale: min_appearance_guidance_scale = 2,
            mask: mask = undefined,
        } = settings;

        const input = {
            seed: Number(seed),
            tasks,
            video,
            overlap,
            decode_chunk_size,
            i2i_noise_strength,
            noise_aug_strength,
            num_inference_steps,
            max_appearance_guidance_scale,
            min_appearance_guidance_scale,
            ...(tasks ===
                TASKS_MAP.faceRestorationAndColorizationAndInpainting && {
                mask,
            }),
        };

        const prediction = await replicate.predictions.create({
            version:
                '63512c77555a80ca5c84c590641036ba9f938d38b9a1841ea369780072561373',
            input,
            webhook: `${process.env.WEBHOOK_URL}/api/v1/replicate/webhook`,
            webhook_events_filter: ['start', 'output', 'completed'],
        });

        const latest = await replicate.predictions.get(prediction.id);

        logger.info(
            `Prediction created with id ${latest.id} and status ${latest.status}`
        );

        return NextResponse.json({
            success: true,
            id: latest.id,
            status: latest.status,
        });
    } catch (error) {
        logger.error(
            `Replicate face restoration API error: ${JSON.stringify(error)}`
        );
        return NextResponse.json(
            { error: 'Failed to process video' },
            { status: 500 }
        );
    }
}

export const maxDuration = 60;
