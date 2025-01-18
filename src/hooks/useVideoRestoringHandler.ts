import { STATUS_MAP, TASKS_MAP, VIDEO_TYPE } from '@/constants';
import { cloudinaryService } from '@/services/api';
import { VideoSettings } from '@/types';

interface Args {
    uploadCareCdnUrl: string;
    uploadCareCdnMaskUrl: string | null;
    cloudinaryOriginalUrl: string | null;
    setCloudinaryOriginalUrl: (url: string) => void;
    setStatus: (status: string) => void;
    settings: VideoSettings;
    setSettings: (settings: VideoSettings) => void;
    startRestoringVideo: (settings: VideoSettings) => Promise<string>;
}

export const useVideoRestoringHandler = () => {
    /* Handle video processing : returns predictionId or error */
    const handleProcessingVideo = async (args: Args) => {
        const {
            uploadCareCdnUrl,
            uploadCareCdnMaskUrl,
            cloudinaryOriginalUrl,
            setCloudinaryOriginalUrl,
            setStatus,
            settings,
            setSettings,
            startRestoringVideo,
        } = args;

        /* upload the video to cloudinary if not already uploaded */
        let uploadedUrl = cloudinaryOriginalUrl;
        if (!cloudinaryOriginalUrl) {
            setStatus(STATUS_MAP.uploading);
            try {
                const uploadResult = await cloudinaryService.upload(
                    uploadCareCdnUrl,
                    VIDEO_TYPE.ORIGINAL
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
                        await startRestoringVideo(updatedSettings);
                    if (!predictionId) {
                        throw new Error('No prediction ID returned');
                    }
                    return predictionId;
                } catch (error) {
                    console.error('Error restoring video:', error);
                    throw new Error(`Error restoring video : ${error}`);
                }
            } catch (error) {
                console.error(
                    'Error uploading original video to cloudinary:',
                    error
                );
                throw new Error(
                    `Error uploading original video to cloudinary : ${error}`
                );
            }
        } else {
            // If cloudinaryOriginalUrl exists, use existing settings
            try {
                setStatus(STATUS_MAP.processing);
                const predictionId = await startRestoringVideo(settings);
                if (!predictionId) {
                    throw new Error('No prediction ID returned');
                }
                return predictionId;
            } catch (error) {
                console.error('Error enhancing video:', error);
                throw new Error(`Error enhancing video : ${error}`);
            }
        }
    };

    return {
        handleProcessingVideo,
    };
};
