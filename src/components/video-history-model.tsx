'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { formatDuration } from '@/utils/utilFunctions';
import { VideoProcess, VideoHistoryModalProps } from '@/types';
import { TASKS_MAP } from '@/constants';
import { databaseService } from '@/services/api';

export function VideoHistoryModal({
    open,
    onOpenChange,
}: VideoHistoryModalProps) {
    const [history, setHistory] = useState<VideoProcess[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSettings, setSelectedSettings] =
        useState<VideoProcess | null>(null);

    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open]);

    const fetchHistory = async () => {
        try {
            const result = await databaseService.fetchHistory();
            setHistory(result);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusStyles = {
            succeeded: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            processing: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
        };

        return (
            <Badge
                variant="outline"
                className={statusStyles[status as keyof typeof statusStyles]}
            >
                {status}
            </Badge>
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Video Enhancement History</DialogTitle>
                    </DialogHeader>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Processing Time</TableHead>
                                    <TableHead>Key Settings</TableHead>
                                    <TableHead>Videos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history &&
                                    history.map((process) => (
                                        <TableRow key={process._id}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(
                                                    new Date(
                                                        process.created_at
                                                    ),
                                                    'PPp'
                                                )}
                                                {process.completed_at && (
                                                    <div className="text-xs text-gray-500">
                                                        Completed:{' '}
                                                        {format(
                                                            new Date(
                                                                process.completed_at
                                                            ),
                                                            'PPp'
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>{process.tasks}</div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(process.status)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDuration(
                                                    process.predict_time.toString()
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <button
                                                        onClick={() =>
                                                            setSelectedSettings(
                                                                process
                                                            )
                                                        }
                                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200"
                                                    >
                                                        <svg
                                                            className="w-3 h-3 mr-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        View Details
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    <a
                                                        href={process.video_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        Original
                                                    </a>
                                                    <a
                                                        href={
                                                            process.output_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        Enhanced
                                                    </a>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedSettings}
                onOpenChange={() => setSelectedSettings(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Settings</DialogTitle>
                    </DialogHeader>
                    {selectedSettings && (
                        <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Processing Parameters */}
                                <div className="col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                        Processing Parameters
                                    </h3>
                                    <div className="bg-white p-4 rounded-md shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Inference Steps
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                {
                                                    selectedSettings.num_inference_steps
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Decode Chunk Size
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                {selectedSettings.decode_chunk_size ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Overlap
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                {selectedSettings.overlap ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Seed
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                {selectedSettings.seed || 'N/A'}
                                            </span>
                                        </div>

                                        {selectedSettings.tasks ===
                                            TASKS_MAP.faceRestorationAndColorizationAndInpainting && (
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-600">
                                                    Mask Image
                                                </span>
                                                <a
                                                    href={selectedSettings.mask}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    Mask Image
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Strength Settings */}
                                <div className="col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                        Strength Settings
                                    </h3>
                                    <div className="bg-white p-4 rounded-md shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Noise Aug Strength
                                            </span>
                                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                                {selectedSettings.noise_aug_strength ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                I2I Noise Strength
                                            </span>
                                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                                {selectedSettings.i2i_noise_strength ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Guidance Settings */}
                                <div className="col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                        Guidance Settings
                                    </h3>
                                    <div className="bg-white p-4 rounded-md shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Min Appearance
                                            </span>
                                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                {selectedSettings.min_appearance_guidance ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Max Appearance
                                            </span>
                                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                {selectedSettings.max_appearance_guidance ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
