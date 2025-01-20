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
import {
    Card,
    CardContent,
    Separator,
    Tabs,
    TabsTrigger,
    TabsList,
    toast,
} from '@/imports/Shadcn_imports';
import { Atom } from 'lucide-react';
import { useVideoRestoringHandler } from '@/hooks/useVideoRestoringHandler';
import { usePredictionHandling } from '@/hooks/usePredictionHandling';
import { RETRIES, STATUS_MAP, TASKS_MAP } from '@/constants';
import { PredictionResponse } from '@/types';

export default function VideoGenerator() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        null
    );
    const [uploadCareCdnMaskUrl, setUploadCareCdnMaskUrl] = useState<
        string | null
    >(null);

    const [uploadMaskKey, setUploadMaskKey] = useState(0);

    const [videoResolution, setVideoResolution] = useState<{
        width: number;
        height: number;
    } | null>(null);

    /* Custom Hooks */
    const { settings, setSettings, updateSetting } = useVideoSettings();

    const {
        status,
        setStatus,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        enhancedVideoUrl,
        setEnhancedVideoUrl,
        setPredictionId,
        finalResponse,
        setFinalResponse,
        startRestoringVideo,
    } = useVideoProcessing();

    const { pollPredictionStatus, savePredictionData } =
        usePredictionHandling();
    const { handleProcessingVideo } = useVideoRestoringHandler();

    /* To remove the video from the state */
    const handleRemoveVideo = () => {
        setEnhancedVideoUrl(null);
        setPredictionId(null);
        setStatus(STATUS_MAP.default);
        setUploadCareCdnUrl(null);
        setCloudinaryOriginalUrl(null);
        setSettings((prev) => ({
            ...prev,
            video: undefined,
        }));
    };

    /* on mask upload */
    const onMaskUpload = (info: any) => {
        /* check if the resolution is the same as the original video */
        if (videoResolution) {
            const imageWidth = Number(info.fileInfo?.imageInfo?.width);
            const imageHeight = Number(info.fileInfo?.imageInfo?.height);
            if (
                videoResolution.width !== imageWidth ||
                videoResolution.height !== imageHeight
            ) {
                toast.error('Error', {
                    description: `Mask resolution must be the same as the original video ${videoResolution.width}x${videoResolution.height}. Please upload another mask`,
                    duration: 3000,
                });
                setUploadMaskKey((prev) => prev + 1);
            } else {
                setUploadCareCdnMaskUrl(info.cdnUrl);
            }
        }
    };

    /* Start processing video */
    const startProcessingVideo = async () => {
        try {
            if (!uploadCareCdnUrl) {
                toast.error('Error', {
                    description: 'No video URL provided',
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
                    description: 'No mask URL provided',
                    duration: 3000,
                });
                return;
            }

            const args = {
                uploadCareCdnUrl,
                uploadCareCdnMaskUrl,
                cloudinaryOriginalUrl,
                setCloudinaryOriginalUrl,
                setStatus,
                settings,
                setSettings,
                startRestoringVideo,
            };

            /* upload the video to cloudinary and start the prediction */
            const predictionId = await handleProcessingVideo(args);

            if (predictionId) {
                setPredictionId(predictionId);
                handlePredictionResults(predictionId);
            } else {
                throw new Error('Failed to get prediction ID');
            }
        } catch (error) {
            console.error('Error in startProcessingVideo:', error);
            setStatus(STATUS_MAP.error);
        }
    };

    /* handle prediction success */
    const handlePredictionFinalResult = async (
        data: PredictionResponse,
        outputUrl?: string
    ) => {
        const isSuccess = data.status === STATUS_MAP.succeeded;
        await savePredictionData(data, outputUrl);
        setStatus(isSuccess ? STATUS_MAP.succeeded : STATUS_MAP.failed);
        setFinalResponse(data);
        setEnhancedVideoUrl(outputUrl ? outputUrl : null);

        if (isSuccess) {
            toast.success('Video Restored Successfully', {
                description: 'Video Restored Successfully',
                duration: 3000,
            });
        } else {
            toast.error('Failed to restore the video', {
                description: 'Please try again',
                duration: 3000,
            });
        }
    };

    /* handle prediction results */
    const handlePredictionResults = async (
        predictionId: string,
        ReplicateRetryCount: number = 0
    ) => {
        // console.log(
        //     `Calling handlePredictionResults with predictionId: ${predictionId}`
        // );
        try {
            const predictionData = await pollPredictionStatus(predictionId);
            // console.log('Prediction Data:', predictionData);
            if (!predictionData) {
                throw new Error('Failed to get prediction data');
            }

            const outputUrl = predictionData.output_url
                ? JSON.parse(predictionData.output_url)
                : null;
            switch (predictionData.status) {
                case STATUS_MAP.succeeded:
                    await handlePredictionFinalResult(
                        predictionData,
                        outputUrl
                    );
                    break;

                case STATUS_MAP.failed:
                    if (ReplicateRetryCount < RETRIES.REPLICATE_SERVICE) {
                        console.log(
                            `Replicate Service Retry attempt ${ReplicateRetryCount + 1} of ${RETRIES.REPLICATE_SERVICE}`
                        );
                        setStatus(STATUS_MAP.processing);
                        setTimeout(() => {
                            startProcessingVideo();
                            handlePredictionResults(
                                predictionId,
                                ReplicateRetryCount + 1
                            );
                        }, 8000);
                    } else {
                        console.log('Failed after 5 retry attempts');
                        await handlePredictionFinalResult(predictionData);
                    }
                    break;

                default:
                    setStatus(STATUS_MAP.processing);
                    setTimeout(
                        () =>
                            handlePredictionResults(
                                predictionId,
                                ReplicateRetryCount
                            ),
                        8000
                    );
            }
        } catch (error) {
            console.error('Error in handlePredictionResults:', error);
            handlePredictionResults(predictionId, ReplicateRetryCount);
        }
    };

    return (
        <div className="flex flex-col h-full rounded-sm p-2 lg:w-[80%] w-[90%] items-center">
            <div className="w-full h-full">
                <Tabs defaultValue="text" className="mb-1 h-[4%] w-full">
                    <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="text" className="flex gap-2">
                            <Atom className="w-4 h-4" />
                            Video Face Restoration
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex w-full lg:h-[93%] mt-4 gap-2 flex-col lg:flex-row ">
                    {/* Left Side */}
                    <div className="flex-1 p-1 border-r lg:w-[35%] h-full">
                        <Card className="h-full">
                            <CardContent className="p-1  h-full">
                                <VideoUploader
                                    uploadCareCdnUrl={uploadCareCdnUrl}
                                    onUploadSuccess={setUploadCareCdnUrl}
                                    onRemoveVideo={handleRemoveVideo}
                                    setVideoResolution={setVideoResolution}
                                />

                                <Separator className="my-2" />

                                <AdvancedSettings
                                    settings={settings}
                                    onUpdateSetting={updateSetting}
                                    onMaskUpload={onMaskUpload}
                                    uploadMaskKey={uploadMaskKey}
                                />

                                <Separator className="my-2" />

                                <ActionButtons
                                    status={status}
                                    onProcess={startProcessingVideo}
                                    onHistory={() => setHistoryModalOpen(true)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col lg:w-[65%] h-full lg:border-none lg:rounded-md mt-14 lg:mt-0 w-[95%]  mx-auto">
                        <RightSideProcess
                            status={status}
                            enhancedVideoUrl={enhancedVideoUrl}
                            onRetry={startProcessingVideo}
                        />

                        {(status === STATUS_MAP.succeeded ||
                            status === STATUS_MAP.failed) && (
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
