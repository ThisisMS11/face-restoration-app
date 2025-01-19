import { PredictionResponse, VideoSettings } from '@/types';
import { useState } from 'react';
import { replicateService } from '@/services/api';
import { STATUS_MAP } from '@/constants';

export const useVideoProcessing = () => {
    const [predictionId, setPredictionId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>(STATUS_MAP.default);
    const [enhancedVideoUrl, setEnhancedVideoUrl] = useState<string | null>(
        null
    );
    const [cloudinaryOriginalUrl, setCloudinaryOriginalUrl] = useState<
        string | null
    >(null);
    const [finalResponse, setFinalResponse] =
        useState<PredictionResponse | null>(null);

    const validateSettings = (settings: VideoSettings): string | null => {
        if (!settings.video) return 'No video URL provided';
        if (!process.env.NEXT_PUBLIC_APP_URL)
            return 'App URL environment variable is not configured';
        return null;
    };

    const startRestoringVideo = async (
        settings: VideoSettings
    ): Promise<string> => {
        const validationError = validateSettings(settings);
        if (validationError) {
            console.error(validationError);
            throw new Error(validationError);
        }

        try {
            const response = await replicateService.processVideo(settings);
            if (!response?.id) {
                throw new Error('Invalid response: missing prediction ID');
            }
            setPredictionId(response.id);
            // console.log('Prediction ID:', response.id);
            return response.id;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to restore video';
            console.error('Restoration error:', message);
            throw new Error(`Error starting restoration : ${message}`);
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
        startRestoringVideo,
        finalResponse,
        setFinalResponse,
    };
};
