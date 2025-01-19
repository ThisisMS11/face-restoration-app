import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';

interface VideoUploaderProps {
    uploadCareCdnUrl: string | null;
    onUploadSuccess: (url: string) => void;
    onRemoveVideo: () => void;
    setVideoResolution: ({
        width,
        height,
    }: {
        width: number;
        height: number;
    }) => void;
}

export default function VideoUploader({
    uploadCareCdnUrl,
    onUploadSuccess,
    onRemoveVideo,
    setVideoResolution,
}: VideoUploaderProps) {
    return (
        <div className="space-y-1 h-[44%]">
            <Card className="border-dashed h-full flex items-center justify-center">
                <CardContent className="flex items-center justify-center p-2">
                    {!uploadCareCdnUrl ? (
                        <FileUploaderRegular
                            sourceList="local, url, camera, dropbox, gdrive"
                            classNameUploader="uc-light uc-red"
                            pubkey={
                                process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ||
                                ''
                            }
                            onFileUploadSuccess={(info) => {
                                onUploadSuccess(info.cdnUrl);
                                setVideoResolution({
                                    width:
                                        Number(
                                            info.fileInfo?.videoInfo?.video
                                                .width
                                        ) || 0,
                                    height:
                                        Number(
                                            info.fileInfo?.videoInfo?.video
                                                .height
                                        ) || 0,
                                });
                            }}
                            multiple={false}
                            className="h-32 flex items-center justify-center"
                            accept="video/*"
                        />
                    ) : (
                        <div className="w-full space-y-2">
                            <div className="relative w-full aspect-video">
                                <video
                                    className="w-full h-full rounded-lg"
                                    controls
                                    src={uploadCareCdnUrl}
                                />
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onRemoveVideo}
                                className="flex items-center gap-2 w-full"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remove Video
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
