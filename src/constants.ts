export const VIDEO_SETTINGS_MAP = {
    seed: 'seed',
    tasks: 'tasks',
    video: 'video',
    overlap: 'overlap',
    decodeChunkSize: 'decodeChunkSize',
    i2iNoiseStrength: 'i2iNoiseStrength',
    noiseAugStrength: 'noiseAugStrength',
    numInferenceSteps: 'numInferenceSteps',
    maxAppearanceGuidanceScale: 'maxAppearanceGuidanceScale',
    minAppearanceGuidanceScale: 'minAppearanceGuidanceScale',
    mask: 'mask',
} as const;

export const TASKS_MAP = {
    faceRestoration: 'face-restoration',
    faceRestorationAndColorization: 'face-restoration-and-colorization',
    faceRestorationAndColorizationAndInpainting:
        'face-restoration-and-colorization-and-inpainting',
} as const;

export const STATUS_MAP = {
    default: 'default',
    processing: 'processing',
    uploading: 'uploading',
    succeeded: 'succeeded',
    error: 'error',
    failed: 'failed',
} as const;

export const RETRIES = {
    MONGO_DB_SERVICE: 5,
    REPLICATE_SERVICE: 3,
    CLOUDINARY_SERVICE: 5,
} as const;

export const VIDEO_TYPE = {
    ORIGINAL: 'original',
    ENHANCED: 'enhanced',
} as const;

export const CLOUDINARY_FOLDER = {
    ORIGINAL: 'task_2_restore_original_videos',
    ENHANCED: 'task_2_restore_enhanced_videos',
} as const;
