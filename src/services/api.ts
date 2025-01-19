import { fetchClient } from '../utils/fetchClient';
import {
    PredictionResponse,
    MongoSave,
    VideoSettings,
    VideoProcess,
} from '../types';

export const cloudinaryService = {
    upload: async (videoUrl: string, type: string) => {
        try {
            const data = await fetchClient<{ url: string }>('cloudinary', {
                method: 'POST',
                body: JSON.stringify({ videoUrl, type }),
            });

            if (!data.url) {
                throw new Error('Invalid response from Cloudinary API');
            }

            return data;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error('Failed to upload video to Cloudinary');
        }
    },
};

export const databaseService = {
    saveInfo: async (inputData: MongoSave) => {
        try {
            const data = await fetchClient('db', {
                method: 'POST',
                body: JSON.stringify(inputData),
            });

            // console.log('Database save response:', data);
            return data;
        } catch (error) {
            console.error('Failed to save to database:', error);
            throw new Error('Failed to save video information to database');
        }
    },

    fetchHistory: async () => {
        try {
            const data = await fetchClient<{ data: VideoProcess[] }>('db', {
                method: 'GET',
            });
            return data.data as VideoProcess[];
        } catch (error) {
            console.error('Failed to fetch history:', error);
            throw new Error('Failed to fetch history');
        }
    },
};

export const predictionService = {
    getStatus: async (id: string) => {
        console.log('CALLING PREDICTION STATUS');
        try {
            return await fetchClient<PredictionResponse>(
                'replicate/prediction',
                {
                    params: { id },
                }
            );
        } catch (error) {
            console.error('Polling error:', error);
            throw new Error('Failed to get prediction status');
        }
    },
};

export const replicateService = {
    processVideo: async (settings: VideoSettings) => {
        try {
            const data = await fetchClient<{ id: string }>('replicate', {
                method: 'POST',
                body: JSON.stringify({ settings }),
            });

            if (!data?.id) {
                throw new Error('Invalid response: missing prediction ID');
            }

            return data;
        } catch (error) {
            console.error('Video processing error:', error);
            throw new Error('Failed to start video processing');
        }
    },
};
