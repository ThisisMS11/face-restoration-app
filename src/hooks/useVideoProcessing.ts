import { VideoSettings } from '@/types';
import { useState } from 'react';

export const useVideoProcessing = () => {
    const [predictionId, setPredictionId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('default');
    const [enhancedVideoUrl, setEnhancedVideoUrl] = useState<string | null>(
        null
    );
    const [cloudinaryOriginalUrl, setCloudinaryOriginalUrl] = useState<
        string | null
    >(null);

    const validateSettings = (settings: VideoSettings): string | null => {
        if (!settings.video) return 'No video URL provided';
        if (!process.env.NEXT_PUBLIC_APP_URL)
            return 'App URL environment variable is not configured';
        return null;
    };

    const StartRestoringVideo = async (
        settings: VideoSettings
    ): Promise<string> => {
        const validationError = validateSettings(settings);
        if (validationError) {
            console.error(validationError);
            setStatus('error');
            throw new Error(validationError);
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/replicate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Server error: ${response.status} ${errorData.message || 'Unknown error'}`
                );
            }

            const data = await response.json();

            if (!data?.id) {
                throw new Error('Invalid response: missing prediction ID');
            }

            setPredictionId(data.id);
            return data.id;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to enhance video';
            console.error('Enhancement error:', message);
            setStatus('error');
            throw error;
        }
    };

    return {
        status,
        setStatus,
        predictionId,
        setPredictionId,
        enhancedVideoUrl,
        setEnhancedVideoUrl,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        StartRestoringVideo,
    };
};
