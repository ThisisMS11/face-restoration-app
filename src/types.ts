export interface VideoSettings {
    seed: number | undefined;
    tasks: string;
    video: string | undefined | null;
    overlap: number;
    decodeChunkSize: number;
    i2iNoiseStrength: number;
    noiseAugStrength: number;
    numInferenceSteps: number;
    maxAppearanceGuidanceScale: number;
    minAppearanceGuidanceScale: number;
}
