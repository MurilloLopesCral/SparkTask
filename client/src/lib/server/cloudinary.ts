import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from '$env/dynamic/private';

function requireEnv(name: string) {
	const value = env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

let configured = false;
function ensureConfigured() {
	if (configured) return;
	cloudinary.config({
		cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
		api_key: requireEnv('CLOUDINARY_API_KEY'),
		api_secret: requireEnv('CLOUDINARY_API_SECRET'),
		secure: true
	});
	configured = true;
}

export function getAllowedExtensions() {
	return requireEnv('CLOUDINARY_ALLOWED_FORMATS')
		.split(',')
		.map((ext) => ext.trim().toLowerCase())
		.filter(Boolean);
}

export function getMaxFileSizeBytes() {
	return Number(env.CLOUDINARY_MAX_FILE_SIZE_MB ?? 15) * 1024 * 1024;
}

// Cloudinary buckets uploads into image/video/raw — everything that isn't an
// image or a/v media has to go up as "raw" or the upload is rejected outright.
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff']);
const VIDEO_EXTENSIONS = new Set([
	'mp4',
	'mov',
	'avi',
	'webm',
	'ogg',
	'opus',
	'mp3',
	'm4a',
	'wav',
	'aac',
	'amr'
]);

export function resourceTypeForExtension(extension: string): 'image' | 'video' | 'raw' {
	const ext = extension.toLowerCase();
	if (IMAGE_EXTENSIONS.has(ext)) return 'image';
	if (VIDEO_EXTENSIONS.has(ext)) return 'video';
	return 'raw';
}

export async function uploadToCloudinary(
	buffer: Buffer,
	filename: string,
	resourceType: 'image' | 'video' | 'raw'
) {
	ensureConfigured();

	return new Promise<UploadApiResponse>((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				folder: requireEnv('CLOUDINARY_FOLDER'),
				resource_type: resourceType,
				filename_override: filename,
				use_filename: true,
				unique_filename: true
			},
			(err, result) => {
				if (err || !result) reject(err ?? new Error('Cloudinary upload returned no result'));
				else resolve(result);
			}
		);
		stream.end(buffer);
	});
}

export async function deleteFromCloudinary(
	publicId: string,
	resourceType: 'image' | 'video' | 'raw'
) {
	ensureConfigured();
	await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
