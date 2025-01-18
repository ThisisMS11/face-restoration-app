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
    mask?: string | null;
}
export type PredictionResponse = {
    status: string;
    output_url: string;
    tasks: string;
    num_inference_steps: number;
    mask?: string | null;
    decode_chunk_size: number;
    overlap: number;
    noise_aug_strength: number;
    min_appearance_guidance: number;
    max_appearance_guidance: number;
    i2i_noise_strength: number;
    seed: string | number;
    video_url: string;
    created_at: string;
    completed_at: string;
    predict_time: string | number;
    urls: {
        cancel: string;
        get: string;
        stream: string;
    };
};

export type MongoSave = {
    status: string;
    output_url: string;
    tasks: string;
    num_inference_steps: number;
    mask?: string | null;
    decode_chunk_size: number;
    overlap: number;
    noise_aug_strength: number;
    min_appearance_guidance: number;
    max_appearance_guidance: number;
    i2i_noise_strength: number;
    seed: string | number;
    video_url: string;
    created_at: string;
    completed_at: string;
    predict_time: string;
};

export interface VideoProcess {
    _id: string;
    video_url: string;
    output_url: string;
    mask?: string;
    status: string;
    created_at: string;
    completed_at: string;
    tasks: string;
    num_inference_steps: number;
    predict_time: string | number;
    decode_chunk_size?: number;
    overlap?: number;
    noise_aug_strength?: number;
    min_appearance_guidance?: number;
    max_appearance_guidance?: number;
    i2i_noise_strength?: number;
    seed: string | number;
}

export interface VideoHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface VideoUploadOptions {
    resource_type: 'video';
    folder: string;
    eager?: Array<{
        raw_transformation: string;
        format: string;
    }>;
    eager_async?: boolean;
    video_codec?: string;
    bit_rate?: string;
    fps?: number | string;
    quality_analysis?: boolean;
    transformation?: Array<{
        width?: number | string;
        height?: number | string;
        crop?: string;
        audio_codec?: string;
        audio_frequency?: number;
        audio_bitrate?: string;
        quality?: string | number;
        flags?: string;
    }>;
}
