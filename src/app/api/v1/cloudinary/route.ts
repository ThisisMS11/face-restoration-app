import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createLoggerWithLabel } from '../../utils/logger';
import { VideoUploadOptions } from '@/types';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const logger = createLoggerWithLabel('CLOUDINARY');

const getOptimalVideoSettings = (): Partial<any> => {
    const baseSettings = {
        video_codec: 'h264:main',
        quality_analysis: true,
        audio_codec: 'aac',
        audio_frequency: 44100,
        audio_bitrate: '128k',
    };

    return {
        ...baseSettings,
        eager: [
            {
                raw_transformation: ['q_auto:good', 'vc_h264:main'].join('/'),
                format: 'mp4',
            },
        ],
        eager_async: true,
    };
};

export async function POST(request: NextRequest) {
    const { videoUrl, type } = await request.json();

    if (!videoUrl) {
        logger.warn('Video URL is required');
        return NextResponse.json(
            { error: 'Video URL is required' },
            { status: 400 }
        );
    }

    const folder =
        type === 'original'
            ? process.env.CLOUDINARY_ORIGINAL_FOLDER ||
              'task_2_restore_original_videos'
            : process.env.CLOUDINARY_ENHANCED_FOLDER ||
              'task_2_restore_enhanced_videos';

    try {
        const uploadOptions: VideoUploadOptions = {
            resource_type: 'video',
            folder: folder,
        };

        // Modified settings for original videos
        if (type === 'original') {
            const videoSettings = getOptimalVideoSettings();
            Object.assign(uploadOptions, {
                ...videoSettings,
            });
        } else {
            Object.assign(uploadOptions, {
                quality_analysis: true,
                transformation: [
                    {
                        quality: 'auto:best',
                    },
                ],
            });
        }

        logger.info(
            `Uploading video type : ${type} to cloudinary with options: ${JSON.stringify(uploadOptions)}`
        );

        const result = await cloudinary.uploader.upload(
            videoUrl,
            uploadOptions
        );

        logger.info(`Video uploaded to cloudinary: ${result.secure_url}`);

        // Return appropriate URL based on video type
        const responseUrl =
            type === 'original' && result.eager?.[0]?.secure_url
                ? result.eager[0].secure_url
                : result.secure_url;

        return NextResponse.json({
            url: responseUrl,
            public_id: result.public_id,
        });
    } catch (error) {
        logger.error(
            `Error uploading video to cloudinary: ${JSON.stringify(error)}`
        );
        return NextResponse.json(
            { error: 'Failed to upload video' },
            { status: 500 }
        );
    }
}
