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

export type PredictionResponse = {
    status: string;
    output: string;
    tasks: string;
    num_inference_steps: number;
    decode_chunk_size: number;
    overlap: number;
    noise_aug_strength: number;
    min_appearance_guidance: number;
    max_appearance_guidance: number;
    i2i_noise_strength: number;
    seed: string;
    video_url: string;
    created_at: string;
    completed_at: string;
    predict_time: string;
    urls: string;
};

export type MongoSave = {
    status: string;
    output_url: string;
    tasks: string;
    num_inference_steps: number;
    decode_chunk_size: number;
    overlap: number;
    noise_aug_strength: number;
    min_appearance_guidance: number;
    max_appearance_guidance: number;
    i2i_noise_strength: number;
    seed: string;
    video_url: string;
    created_at: string;
    completed_at: string;
    predict_time: string;
};
