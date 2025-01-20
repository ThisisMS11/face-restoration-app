import { VideoSettings } from '@/types';
import { FileUploaderMinimal } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Slider,
    Label,
    Input,
} from '@/imports/Shadcn_imports';
import { TASKS_MAP, VIDEO_SETTINGS_MAP } from '@/constants';

interface AdvancedSettingsProps {
    settings: VideoSettings;
    onUpdateSetting: (key: keyof VideoSettings, value: any) => void;
    onMaskUpload: (info: any) => void;
    uploadMaskKey: number;
}

export default function AdvancedSettings({
    settings,
    onUpdateSetting,
    onMaskUpload,
    uploadMaskKey,
}: AdvancedSettingsProps) {
    return (
        <div className="space-y-4 w-full h-[42%] p-5 overflow-y-auto">
            <h3 className="text-lg font-medium">Advanced Settings</h3>

            <div className="space-y-3">
                <div className="space-y-2">
                    <Label>Tasks</Label>
                    <Select
                        defaultValue={TASKS_MAP.faceRestoration}
                        onValueChange={(value: any) =>
                            onUpdateSetting(VIDEO_SETTINGS_MAP.tasks, value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TASKS_MAP.faceRestoration}>
                                Face Restoration
                            </SelectItem>
                            <SelectItem
                                value={TASKS_MAP.faceRestorationAndColorization}
                            >
                                Face Restoration and Colorization
                            </SelectItem>
                            <SelectItem
                                value={
                                    TASKS_MAP.faceRestorationAndColorizationAndInpainting
                                }
                            >
                                Face Restoration, Colorization and Inpainting
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Number of Inference Steps</Label>
                    <Slider
                        value={[settings.numInferenceSteps]}
                        onValueChange={(value: any) =>
                            onUpdateSetting(
                                VIDEO_SETTINGS_MAP.numInferenceSteps,
                                value[0]
                            )
                        }
                        min={1}
                        max={100}
                        step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                        Current: {settings.numInferenceSteps}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Decode Chunk Size</Label>
                    <Slider
                        value={[settings.decodeChunkSize]}
                        onValueChange={(value: any) =>
                            onUpdateSetting(
                                VIDEO_SETTINGS_MAP.decodeChunkSize,
                                value[0]
                            )
                        }
                        min={1}
                        max={32}
                        step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                        Current: {settings.decodeChunkSize}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Overlap Frames</Label>
                    <Slider
                        value={[settings.overlap]}
                        onValueChange={(value: any) =>
                            onUpdateSetting(
                                VIDEO_SETTINGS_MAP.overlap,
                                value[0]
                            )
                        }
                        min={0}
                        max={10}
                        step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                        Current: {settings.overlap}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Noise Augmentation Strength</Label>
                    <Slider
                        value={[settings.noiseAugStrength]}
                        onValueChange={(value: any) =>
                            onUpdateSetting(
                                VIDEO_SETTINGS_MAP.noiseAugStrength,
                                value[0]
                            )
                        }
                        min={0}
                        max={1}
                        step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                        Current: {settings.noiseAugStrength.toFixed(1)}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Appearance Guidance Scale</Label>
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Minimum</Label>
                                <Slider
                                    value={[
                                        settings.minAppearanceGuidanceScale,
                                    ]}
                                    onValueChange={(value: any) =>
                                        onUpdateSetting(
                                            VIDEO_SETTINGS_MAP.minAppearanceGuidanceScale,
                                            value[0]
                                        )
                                    }
                                    min={0}
                                    max={5}
                                    step={0.1}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Maximum</Label>
                                <Slider
                                    value={[
                                        settings.maxAppearanceGuidanceScale,
                                    ]}
                                    onValueChange={(value: any) =>
                                        onUpdateSetting(
                                            VIDEO_SETTINGS_MAP.maxAppearanceGuidanceScale,
                                            value[0]
                                        )
                                    }
                                    min={0}
                                    max={5}
                                    step={0.1}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Current:{' '}
                            {settings.minAppearanceGuidanceScale.toFixed(1)} -{' '}
                            {settings.maxAppearanceGuidanceScale.toFixed(1)}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>I2I Noise Strength</Label>
                    <Slider
                        value={[settings.i2iNoiseStrength]}
                        onValueChange={(value: any) =>
                            onUpdateSetting(
                                VIDEO_SETTINGS_MAP.i2iNoiseStrength,
                                value[0]
                            )
                        }
                        min={0}
                        max={2}
                        step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                        Current: {settings.i2iNoiseStrength.toFixed(1)}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Seed (Optional)</Label>
                    <Input
                        type="number"
                        value={settings.seed}
                        onChange={(e) =>
                            onUpdateSetting(
                                VIDEO_SETTINGS_MAP.seed,
                                e.target.value
                            )
                        }
                        placeholder="Random"
                    />
                    <p className="text-xs text-muted-foreground">
                        Leave empty for random seed
                    </p>
                </div>

                {settings.tasks ===
                    TASKS_MAP.faceRestorationAndColorizationAndInpainting && (
                    <div className="space-y-2">
                        <Label>Mask</Label>
                        <FileUploaderMinimal
                            classNameUploader="uc-light uc-red"
                            pubkey={
                                process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ||
                                ''
                            }
                            onFileUploadSuccess={onMaskUpload}
                            multiple={false}
                            accept="image/*"
                            key={uploadMaskKey}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
