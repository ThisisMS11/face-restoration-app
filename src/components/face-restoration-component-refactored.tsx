'use client';

import { useState } from 'react';
import { useVideoSettings } from '@/hooks/useVideoSettings';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import VideoUploader from '@/components/VideoUploader';
import RightSideProcess from '@/components/RightSideProcess';
import AdvancedSettings from '@/components/AdvancedSettings';
import { VideoHistoryModal } from './video-history-model';
import ActionButtons from '@/components/ActionButtons';
import Statistics from '@/components/statistics';
import { PredictionResponse } from '@/types';
import {
    Card,
    CardContent,
    Separator,
    toast,
    Tabs,
    TabsTrigger,
    TabsList,
} from '@/imports/Shadcn_imports';
import { XCircle, CheckCircle2, Atom } from 'lucide-react';
import {
    cloudinaryService,
    predictionService,
    databaseService,
} from '@/services/api';

export default function VideoGenerator() {
    const { settings, setSettings, updateSetting } = useVideoSettings();
    const {
        status,
        setStatus,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        handleEnhancingVideo,
        enhancedVideoUrl,
        setEnhancedVideoUrl,
        setPredictionId,
    } = useVideoProcessing();
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        null
    );
    const [uploadCareCdnMaskUrl, setUploadCareCdnMaskUrl] = useState<
        string | null
    >(null);
    const [finalResponse, setFinalResponse] =
        useState<PredictionResponse | null>(null);

    // METHODS
    /* Start the video processing */
    const handleProcessingVideo = async (videoUrl: string) => {
        console.log(settings);
        console.log(uploadCareCdnMaskUrl);

        if (!videoUrl) {
            toast('Error', {
                description: 'Please upload a video',
                duration: 3000,
                icon: <XCircle className="h-4 w-4 text-red-500" />,
            });
            return;
        }

        if (
            settings.tasks ===
                'face-restoration-and-colorization-and-inpainting' &&
            !uploadCareCdnMaskUrl
        ) {
            toast('Error', {
                description: 'Please upload a mask image for inpainting',
                duration: 3000,
                icon: <XCircle className="h-4 w-4 text-red-500" />,
            });
            return;
        }

        setStatus('uploading');
        /* upload the video to cloudinary if not already uploaded */
        let uploadedUrl = cloudinaryOriginalUrl;
        if (!cloudinaryOriginalUrl) {
            try {
                const uploadResult = await cloudinaryService.upload(
                    videoUrl,
                    'original'
                );
                if (!uploadResult?.url) {
                    throw new Error('Failed to get upload URL from Cloudinary');
                }
                uploadedUrl = uploadResult.url;
                setCloudinaryOriginalUrl(uploadedUrl);

                // Create updated settings with new video URL
                const updatedSettings = {
                    ...settings,
                    video: uploadedUrl,
                    ...(settings.tasks ===
                        'face-restoration-and-colorization-and-inpainting' && {
                        mask: uploadCareCdnMaskUrl,
                    }),
                };

                setSettings(updatedSettings);

                /* enhance the video */
                try {
                    setStatus('processing');

                    /* Adding some delay time to give cloudinary time to upload the video */
                    await new Promise((resolve) => setTimeout(resolve, 8000));

                    // Use updated settings directly instead of relying on state
                    const predictionId =
                        await handleEnhancingVideo(updatedSettings);
                    if (!predictionId) {
                        throw new Error('No prediction ID returned');
                    }
                    pollPredictionStatus(predictionId);
                } catch (error) {
                    console.error('Error enhancing video:', error);
                    toast('Error', {
                        description: 'Something Went Wrong ! Please Try Again',
                        duration: 3000,
                        icon: <XCircle className="h-4 w-4 text-red-500" />,
                    });
                    return;
                }
            } catch (error) {
                console.error(
                    'Error uploading original video to cloudinary:',
                    error
                );
                toast('Error', {
                    description: 'Cloudinary Upload Error ! Please Try Again',
                    duration: 3000,
                    icon: <XCircle className="h-4 w-4 text-red-500" />,
                });
                return;
            }
        } else {
            // If cloudinaryOriginalUrl exists, use existing settings
            try {
                setStatus('processing');
                await new Promise((resolve) => setTimeout(resolve, 10000));
                const predictionId = await handleEnhancingVideo(settings);
                if (!predictionId) {
                    throw new Error('No prediction ID returned');
                }
                pollPredictionStatus(predictionId);
            } catch (error) {
                console.error('Error enhancing video:', error);
                toast('Error', {
                    description: 'Something Went Wrong ! Please Try Again',
                    duration: 3000,
                    icon: <XCircle className="h-4 w-4 text-red-500" />,
                });
                return;
            }
        }
    };

    /* Get the prediction status */
    const pollPredictionStatus = async (id: string, retryCount = 0) => {
        try {
            const data = await predictionService.getStatus(id);
            console.log(data);
            const outputUrl = data.output_url
                ? JSON.parse(data.output_url)
                : null;
            // setCancelUrl(data.cancel_url);
            switch (data.status) {
                case 'succeeded':
                    await handlePredictionSuccess(data, outputUrl);
                    toast('Success', {
                        description: 'Video Enhanced Successfully',
                        duration: 3000,
                        icon: (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ),
                    });
                    break;

                case 'failed':
                    if (retryCount < 5) {
                        console.log(`Retry attempt ${retryCount + 1} of 5`);
                        setStatus('processing');
                        setTimeout(
                            () => pollPredictionStatus(id, retryCount + 1),
                            10000
                        );
                    } else {
                        console.log('Failed after 5 retry attempts');
                        toast('Failed', {
                            description:
                                'Failed to enhance video, Please try again',
                            duration: 3000,
                            icon: <XCircle className="h-4 w-4 text-red-500" />,
                        });
                        await handlePredictionFailed(data);
                        setStatus('failed');
                    }
                    break;

                default:
                    setStatus('processing');
                    setTimeout(
                        () => pollPredictionStatus(id, retryCount),
                        8000
                    );
            }
        } catch (error) {
            console.error('Polling error:', error);
            if (retryCount < 5) {
                console.log(`Retry attempt ${retryCount + 1} of 5 after error`); // Fixed incorrect retry count in message
                setTimeout(
                    () => pollPredictionStatus(id, retryCount + 1),
                    10000
                );
            } else {
                console.log('Failed after 5 retry attempts');
                setStatus('error');
            }
        }
    };

    /* if video is successfully processed */
    const handlePredictionSuccess = async (
        data: PredictionResponse,
        outputUrl: string
    ) => {
        try {
            if (!data || !outputUrl) {
                throw new Error('Invalid prediction data or output URL');
            }

            // Set UI state first
            setEnhancedVideoUrl(outputUrl);
            setStatus('succeeded');
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
                    'face-restoration-and-colorization-and-inpainting' && {
                    mask,
                }),
            });
        } catch (error) {
            console.error('Error in handlePredictionSuccess:', error);
            setStatus('error');
            setEnhancedVideoUrl(null);
            throw error;
        }
    };

    /* if video is not processed */
    const handlePredictionFailed = async (data: PredictionResponse) => {
        try {
            if (!data) {
                throw new Error('No prediction data provided');
            }

            // Reset UI state first
            setStatus('failed');
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
                    'face-restoration-and-colorization-and-inpainting' && {
                    mask,
                }),
            });
        } catch (error) {
            console.error('Error in handlePredictionFailed:', error);
            // Ensure UI shows failed state even if database save fails
            setStatus('failed');
            setEnhancedVideoUrl(null);
            setPredictionId(null);
            throw error;
        }
    };

    /* To remove the video from the state */
    const handleRemoveVideo = () => {
        setEnhancedVideoUrl(null);
        setPredictionId(null);
        setStatus('default');
        setUploadCareCdnUrl(null);
        setCloudinaryOriginalUrl(null);
        setSettings((prev) => ({
            ...prev,
            video: undefined,
        }));
    };

    return (
        <div className="flex flex-col h-full rounded-sm p-2 w-[80%] items-center overflow-hidden">
            <div className="w-full h-full">
                <Tabs defaultValue="text" className="mb-1 h-[4%] w-full">
                    <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="text" className="flex gap-2">
                            <Atom className="w-4 h-4" />
                            Video Face Restoration
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex w-full h-[93%] mt-4 gap-2">
                    {/* Left Side */}
                    <div className="flex-1 p-1 border-r w-[35%] h-full">
                        <Card className="h-full">
                            <CardContent className="p-1 h-full">
                                <VideoUploader
                                    uploadCareCdnUrl={uploadCareCdnUrl}
                                    onUploadSuccess={setUploadCareCdnUrl}
                                    onRemoveVideo={handleRemoveVideo}
                                />

                                <Separator className="my-2" />

                                <AdvancedSettings
                                    settings={settings}
                                    onUpdateSetting={updateSetting}
                                    uploadCareCdnMaskUrl={uploadCareCdnMaskUrl}
                                    onMaskUpload={setUploadCareCdnMaskUrl}
                                />

                                <Separator className="my-2" />

                                <ActionButtons
                                    status={status}
                                    onProcess={() =>
                                        handleProcessingVideo(
                                            uploadCareCdnUrl || ''
                                        )
                                    }
                                    onHistory={() => setHistoryModalOpen(true)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col w-[65%] h-full">
                        <RightSideProcess
                            status={status}
                            enhancedVideoUrl={enhancedVideoUrl}
                            onRetry={() =>
                                handleProcessingVideo(uploadCareCdnUrl || '')
                            }
                        />

                        {(status === 'succeeded' || status === 'failed') && (
                            <Statistics data={finalResponse} />
                        )}
                    </div>
                </div>

                <VideoHistoryModal
                    open={historyModalOpen}
                    onOpenChange={setHistoryModalOpen}
                />
            </div>
        </div>
    );
}
