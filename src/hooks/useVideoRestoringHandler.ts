import { toast } from '@/imports/Shadcn_imports';
import { STATUS_MAP, TASKS_MAP } from '@/constants';
import { cloudinaryService } from '@/services/api';
import { VideoSettings } from '@/types';

export const useVideoRestoringHandler = ({
    settings,
    setStatus,
    setSettings,
    setCloudinaryOriginalUrl,
    cloudinaryOriginalUrl,
    pollPredictionStatus,
    StartRestoringVideo,
}: {
    settings: VideoSettings;
    setStatus: (status: string) => void;
    setSettings: (settings: VideoSettings) => void;
    setCloudinaryOriginalUrl: (url: string) => void;
    cloudinaryOriginalUrl: string | null;
    pollPredictionStatus: (predictionId: string) => void;
    StartRestoringVideo: (settings: VideoSettings) => Promise<string>;
}) => {
    const handleProcessingVideo = async (
        videoUrl: string,
        uploadCareCdnMaskUrl: string | null
    ) => {
        // console.log(settings);
        // console.log(uploadCareCdnMaskUrl);

        if (!videoUrl) {
            toast.error('Error', {
                description: 'Please upload a video',
                duration: 3000,
            });
            return;
        }

        if (
            settings.tasks ===
                TASKS_MAP.faceRestorationAndColorizationAndInpainting &&
            !uploadCareCdnMaskUrl
        ) {
            toast.error('Error', {
                description: 'Please upload a mask image for inpainting',
                duration: 3000,
            });
            return;
        }

        setStatus(STATUS_MAP.uploading);
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
                        TASKS_MAP.faceRestorationAndColorizationAndInpainting && {
                        mask: uploadCareCdnMaskUrl,
                    }),
                };

                setSettings(updatedSettings);

                /* enhance the video */
                try {
                    setStatus(STATUS_MAP.processing);

                    /* Adding some delay time to give cloudinary time to upload the video */
                    await new Promise((resolve) => setTimeout(resolve, 8000));

                    // Use updated settings directly instead of relying on state
                    const predictionId =
                        await StartRestoringVideo(updatedSettings);
                    if (!predictionId) {
                        throw new Error('No prediction ID returned');
                    }
                    pollPredictionStatus(predictionId);
                } catch (error) {
                    console.error('Error enhancing video:', error);
                    toast.error('Error', {
                        description: 'Something Went Wrong ! Please Try Again',
                        duration: 3000,
                    });
                    return;
                }
            } catch (error) {
                console.error(
                    'Error uploading original video to cloudinary:',
                    error
                );
                toast.error('Error', {
                    description: 'Cloudinary Upload Error ! Please Try Again',
                    duration: 3000,
                });
                return;
            }
        } else {
            // If cloudinaryOriginalUrl exists, use existing settings
            try {
                setStatus(STATUS_MAP.processing);
                await new Promise((resolve) => setTimeout(resolve, 10000));
                const predictionId = await StartRestoringVideo(settings);
                if (!predictionId) {
                    throw new Error('No prediction ID returned');
                }
                pollPredictionStatus(predictionId);
            } catch (error) {
                console.error('Error enhancing video:', error);
                toast.error('Error', {
                    description: 'Something Went Wrong ! Please Try Again',
                    duration: 3000,
                });
                return;
            }
        }
    };

    return {
        handleProcessingVideo,
    };
};
