import { Button } from '@/components/ui/button';
import { Wand2, RotateCw, History } from 'lucide-react';

interface ActionButtonsProps {
    status: string;
    onProcess: () => void;
    onHistory: () => void;
    isDisabled?: boolean;
}

export default function ActionButtons({
    status,
    onProcess,
    onHistory,
}: ActionButtonsProps) {
    return (
        <div className="flex gap-3 h-fit px-2 flex-wrap">
            <Button
                className="flex-1 rounded-lg"
                onClick={onProcess}
                disabled={['uploading', 'processing'].includes(status)}
            >
                {/* Icon based on status */}
                {['processing', 'uploading', 'default'].includes(status) && (
                    <Wand2 className="w-4 h-4 mr-2" />
                )}
                {status === 'failed' && <RotateCw className="w-4 h-4 mr-2" />}

                {/* Button text based on status */}
                {{
                    default: 'Restore',
                    uploading: 'Uploading Video...',
                    processing: 'Restoring Video...',
                    failed: 'Retry...',
                    succeeded: 'Restore Video',
                }[status] || 'Restore Video'}
            </Button>

            <Button className="flex-1 rounded-lg" onClick={onHistory}>
                <History className="w-4 h-4 mr-2" />
                View History
            </Button>
        </div>
    );
}
