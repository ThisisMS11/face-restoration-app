import { useState } from 'react';
import { toast } from '@/imports/Shadcn_imports';
import { XCircle, CheckCircle2, Settings } from 'lucide-react';
import { PredictionResponse } from '@/types';
import { cloudinaryService, predictionService, databaseService } from '@/services/api';
import { RETRIES, STATUS_MAP, TASKS_MAP } from '@/constants';
import { useVideoProcessing } from './useVideoProcessing';
import { useVideoSettings } from './useVideoSettings'

export const usePredictionHandling = () => {
    const [finalResponse, setFinalResponse] = useState<PredictionResponse | null>(null);
    const { setStatus, setEnhancedVideoUrl, setPredictionId, StartRestoringVideo } = useVideoProcessing();
    const { settings } = useVideoSettings();

    const pollPredictionStatus = async (
        id: string,
        ReplicateRetryCount = 0
    ) => {
        try {
            const data = await predictionService.getStatus(id);
            console.log(data);
            const outputUrl = data.output_url
                ? JSON.parse(data.output_url)
                : null;
            switch (data.status) {
                case STATUS_MAP.succeeded:
                    await handlePredictionSuccess(data, outputUrl);
                    toast.success('Video Enhanced Successfully', {
                        description: 'Video Enhanced Successfully',
                        duration: 3000
                    });
                    break;

                case STATUS_MAP.failed:
                    if (ReplicateRetryCount < RETRIES.REPLICATE_SERVICE) {
                        console.log(`Replicate Service Retry attempt ${ReplicateRetryCount + 1} of ${RETRIES.REPLICATE_SERVICE}`);
                        setStatus(STATUS_MAP.processing);
                        setTimeout(
                            () => { StartRestoringVideo(settings), pollPredictionStatus(id, ReplicateRetryCount + 1) },
                            8000
                        );
                    } else {
                        console.log('Failed after 5 retry attempts');
                        toast.error('Failed to restore the video', {
                            description: 'Please try again',
                            duration: 3000
                        });
                        await handlePredictionFailed(data);
                        setStatus(STATUS_MAP.failed);
                    }
                    break;

                default:
                    setStatus(STATUS_MAP.processing);
                    setTimeout(
                        () => pollPredictionStatus(id, ReplicateRetryCount),
                        8000
                    );
            }
        } catch (error) {
            console.error('Polling error:', error);
            setTimeout(
                () => pollPredictionStatus(id, ReplicateRetryCount),
                8000
            );
        }
    };

    /* Handle Prediction Success */
    const handlePredictionSuccess = async (data: PredictionResponse, outputUrl: string) => {
        try {
            if (!data || !outputUrl) {
                throw new Error('Invalid prediction data or output URL');
            }

            // Set UI state first
            setEnhancedVideoUrl(outputUrl);
            setStatus(STATUS_MAP.succeeded);
            setFinalResponse(data);

            // Upload enhanced video to Cloudinary
            const cloudinaryData = await cloudinaryService.upload(
                outputUrl,
                'enhanced'
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
            setStatus(STATUS_MAP.error);
            setEnhancedVideoUrl(null);
            setPredictionId(null);
            throw error;
        }
    };


    /* Handle Prediction Failed */
    const handlePredictionFailed = async (data: PredictionResponse) => {
        try {
            if (!data) {
                throw new Error('No prediction data provided');
            }

            // Reset UI state first
            setStatus(STATUS_MAP.failed);
            setEnhancedVideoUrl(null);
            setPredictionId(null);
            setFinalResponse(data);

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
            setStatus(STATUS_MAP.failed);
            setEnhancedVideoUrl(null);
            setPredictionId(null);
            throw error;
        }
    };

    return {
        finalResponse,
        pollPredictionStatus,
        handlePredictionSuccess,
        handlePredictionFailed
    };
};