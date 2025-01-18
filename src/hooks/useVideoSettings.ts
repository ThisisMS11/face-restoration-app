import { useState } from 'react';
import { VideoSettings } from '@/types';

export function useVideoSettings() {
    const [settings, setSettings] = useState<VideoSettings>({
        seed: undefined,
        tasks: 'face-restoration',
        video: undefined,
        overlap: 3,
        decodeChunkSize: 16,
        i2iNoiseStrength: 1,
        noiseAugStrength: 0,
        numInferenceSteps: 30,
        maxAppearanceGuidanceScale: 2,
        minAppearanceGuidanceScale: 2,
    });

    const updateSetting = (
        key: keyof VideoSettings,
        value: string | number
    ) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return {
        settings,
        setSettings,
        updateSetting,
    };
}
