'use client';
import { useState, useMemo } from 'react';
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
} from '@/imports/Shadcn_imports';
import { Atom } from 'lucide-react';
import { useVideoRestoringHandler } from '@/hooks/useVideoRestoringHandler';
import { usePredictionHandling } from '@/hooks/usePredictionHandling';

export default function VideoGenerator() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        null
    );
    const [uploadCareCdnMaskUrl, setUploadCareCdnMaskUrl] = useState<
        string | null
    >(null);

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
        StartRestoringVideo,
    } = useVideoProcessing();

    const predictionHandlingConfig = useMemo(
        () => ({
            setStatus,
            setEnhancedVideoUrl,
            setPredictionId,
            StartRestoringVideo,
            settings,
        }),
        [
            setStatus,
            setEnhancedVideoUrl,
            setPredictionId,
            StartRestoringVideo,
            settings,
        ]
    );

    const { pollPredictionStatus, finalResponse } = usePredictionHandling(
        predictionHandlingConfig
    );

    const videoRestoringConfig = useMemo(
        () => ({
            settings,
            setStatus,
            setSettings,
            setCloudinaryOriginalUrl,
            cloudinaryOriginalUrl,
            pollPredictionStatus,
            StartRestoringVideo,
        }),
        [
            settings,
            setStatus,
            setSettings,
            setCloudinaryOriginalUrl,
            cloudinaryOriginalUrl,
            pollPredictionStatus,
            StartRestoringVideo,
        ]
    );

    const { handleProcessingVideo } =
        useVideoRestoringHandler(videoRestoringConfig);

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
                                    onMaskUpload={setUploadCareCdnMaskUrl}
                                />

                                <Separator className="my-2" />

                                <ActionButtons
                                    status={status}
                                    onProcess={() =>
                                        handleProcessingVideo(
                                            uploadCareCdnUrl || '',
                                            uploadCareCdnMaskUrl || null
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
                                handleProcessingVideo(
                                    uploadCareCdnUrl || '',
                                    uploadCareCdnMaskUrl || null
                                )
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
