import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    CheckCircle,
    Timer,
    Download,
    Link2,
    Settings,
} from 'lucide-react';
import { PredictionResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const Statistics = ({ data }: { data: PredictionResponse | null }) => {
    if (!data) {
        return (
            <div className="px-2 h-[40%] space-y-3 mt-4 lg:mt-0">
                <div className="h-full">
                    <div className="flex items-center justify-between h-[15%] mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Statistics
                            </h3>
                        </div>
                        <Badge
                            variant="secondary"
                            className="px-3 py-1 text-sm font-medium"
                        >
                            No data
                        </Badge>
                    </div>

                    <Card className="w-full h-[75%] flex items-center justify-center">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center h-32 text-muted-foreground">
                                No statistics available
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 h-[40%] space-y-3">
            <div className="h-full ">
                <div className="flex items-center justify-between h-[15%] my-2 ">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Statistics
                        </h3>
                    </div>
                    <Badge
                        variant={
                            data.status === 'succeeded'
                                ? 'default'
                                : 'destructive'
                        }
                        className="px-3 py-1 text-sm font-medium"
                    >
                        {data.status.charAt(0).toUpperCase() +
                            data.status.slice(1)}
                    </Badge>
                </div>

                <Card className="w-full h-[80%]">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Created At
                                    </p>
                                    <p className="font-medium">
                                        {format(
                                            new Date(data.created_at),
                                            'PPp'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Completed At
                                    </p>
                                    <p className="font-medium">
                                        {format(
                                            new Date(data.completed_at),
                                            'PPp'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Timer className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Processing Time
                                    </p>
                                    <p className="font-medium">
                                        {Number(data.predict_time).toFixed(2)}{' '}
                                        seconds
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-purple-100 rounded-full">
                                    <Settings className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Task Type
                                    </p>
                                    <p className="font-medium">
                                        {data.tasks
                                            .split('-')
                                            .map(
                                                (word) =>
                                                    word
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    word.slice(1)
                                            )
                                            .join(' ')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {data.status === 'succeeded' && (
                            <div className="mt-3 flex gap-4">
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        // Create an anchor element
                                        const link =
                                            document.createElement('a');
                                        link.href = data.output_url;
                                        // Set download attribute to force download
                                        link.download = 'enhanced-video.mp4';
                                        // Append to document
                                        document.body.appendChild(link);
                                        // Trigger click
                                        link.click();
                                        // Clean up
                                        document.body.removeChild(link);
                                    }}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Enhanced Video
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() =>
                                        window.open(data.video_url, '_blank')
                                    }
                                >
                                    <Link2 className="w-4 h-4 mr-2" />
                                    View Original Video
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Statistics;
