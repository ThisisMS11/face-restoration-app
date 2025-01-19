import { PredictionResponse } from '@/types';
import {
    cloudinaryService,
    predictionService,
    databaseService,
} from '@/services/api';
import { STATUS_MAP, TASKS_MAP, VIDEO_TYPE } from '@/constants';

export const usePredictionHandling = () => {
    /* Get prediction data from redis */
    const pollPredictionStatus = async (id: string) => {
        try {
            const data = await predictionService.getStatus(id);
            // console.log(data);
            return data;
        } catch (error) {
            console.error('Polling error:', error);
            throw new Error('Failed to get prediction data');
        }
    };

    const savePredictionData = async (
        data: PredictionResponse,
        outputUrl?: string
    ) => {
        if (data.status === STATUS_MAP.succeeded && outputUrl) {
            await savePredictionSuccess(data, outputUrl);
        } else if (data.status === STATUS_MAP.failed) {
            await savePredictionFailed(data);
        } else {
            throw new Error('Invalid prediction data or output URL');
        }
    };

    /* Handle Prediction Success : upload replicate output to cloudinary and save to database */
    const savePredictionSuccess = async (
        data: PredictionResponse,
        outputUrl: string
    ) => {
        try {
            // Upload enhanced video to Cloudinary
            const cloudinaryData = await cloudinaryService.upload(
                outputUrl,
                VIDEO_TYPE.ENHANCED
            );
            if (!cloudinaryData?.url) {
                throw new Error(
                    'Failed to upload enhanced video to Cloudinary'
                );
            }

            // Extract and validate required fields from PredictionResponse
            const {
                tasks,
                mask,
                num_inference_steps,
                decode_chunk_size,
                overlap,
                noise_aug_strength,
                min_appearance_guidance,
                max_appearance_guidance,
                i2i_noise_strength,
                seed,
                video_url,
                created_at,
                completed_at,
                predict_time,
                status,
            } = data;

            // Save to database with properly formatted MongoSave type
            await databaseService.saveInfo({
                status: status,
                output_url: cloudinaryData.url,
                tasks: tasks,
                num_inference_steps: num_inference_steps,
                decode_chunk_size: decode_chunk_size,
                overlap: overlap,
                noise_aug_strength: noise_aug_strength,
                min_appearance_guidance: min_appearance_guidance,
                max_appearance_guidance: max_appearance_guidance,
                i2i_noise_strength: i2i_noise_strength,
                seed: seed.toString(),
                video_url: video_url,
                created_at: created_at,
                completed_at: completed_at,
                predict_time: predict_time.toString(),
                ...(tasks ===
                    TASKS_MAP.faceRestorationAndColorizationAndInpainting && {
                    mask,
                }),
            });
        } catch (error) {
            console.error('Error in handlePredictionSuccess:', error);
            throw error;
        }
    };

    /* Handle Prediction Failed : set status to failed and save to database */
    const savePredictionFailed = async (data: PredictionResponse) => {
        try {
            // Extract required fields from PredictionResponse
            const {
                tasks,
                num_inference_steps,
                decode_chunk_size,
                overlap,
                noise_aug_strength,
                min_appearance_guidance,
                max_appearance_guidance,
                i2i_noise_strength,
                seed,
                video_url,
                created_at,
                completed_at,
                predict_time,
                status,
                mask,
            } = data;

            // Save failed prediction to database with properly formatted MongoSave type
            await databaseService.saveInfo({
                status: status,
                output_url: '',
                tasks: tasks,
                num_inference_steps: num_inference_steps,
                decode_chunk_size: decode_chunk_size,
                overlap: overlap,
                noise_aug_strength: noise_aug_strength,
                min_appearance_guidance: min_appearance_guidance,
                max_appearance_guidance: max_appearance_guidance,
                i2i_noise_strength: i2i_noise_strength,
                seed: seed.toString(),
                video_url: video_url,
                created_at: created_at,
                completed_at: completed_at,
                predict_time: predict_time.toString(),
                ...(tasks ===
                    TASKS_MAP.faceRestorationAndColorizationAndInpainting && {
                    mask,
                }),
            });
        } catch (error) {
            console.error('Error in handlePredictionFailed:', error);
            throw error;
        }
    };

    return {
        pollPredictionStatus,
        savePredictionData,
    };
};
