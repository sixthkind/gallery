<template>
  <div class="photo-upload-wrapper">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold mb-4">Upload Photos</h2>
      
      <!-- Drag and Drop Zone -->
      <div
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        ]"
      >
        <Icon
          name="heroicons:cloud-arrow-up"
          :class="[
            'text-6xl mb-4',
            isDragging ? 'text-blue-500' : 'text-gray-400'
          ]"
        />
        <p class="text-lg mb-2" :class="isDragging ? 'text-blue-600' : 'text-gray-600'">
          {{ isDragging ? 'Drop photos here' : 'Drag and drop photos here' }}
        </p>
        <p class="text-sm text-gray-500 mb-4">or</p>
        <label class="inline-block">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            accept="image/*"
            multiple
            class="hidden"
          />
          <span class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer inline-block transition-colors duration-200">
            Choose Photos
          </span>
        </label>
      </div>

      <!-- Preview and Upload Section -->
      <div v-if="selectedFiles.length > 0" class="mt-6">
        <h3 class="text-xl font-semibold mb-4">Selected Photos ({{ selectedFiles.length }})</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="border rounded-lg p-4 bg-gray-50"
          >
            <div class="flex gap-4">
              <!-- Preview Thumbnail -->
              <div class="flex-shrink-0">
                <img
                  :src="file.preview"
                  :alt="file.file.name"
                  class="w-24 h-24 object-cover rounded"
                />
              </div>
              
              <!-- File Details Form -->
              <div class="flex-grow">
                <div class="mb-2">
                  <input
                    v-model="file.title"
                    type="text"
                    placeholder="Title (optional)"
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div class="mb-2">
                  <textarea
                    v-model="file.description"
                    placeholder="Description (optional)"
                    rows="2"
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>
                <p class="text-xs text-gray-500">{{ formatFileSize(file.file.size) }}</p>
                
                <!-- Metadata indicator -->
                <div v-if="file.metadata" class="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <Icon name="heroicons:check-circle-solid" class="text-sm" />
                  <span>Metadata extracted</span>
                </div>
                
                <!-- Metadata preview (collapsed by default) -->
                <details v-if="file.metadata" class="mt-2 text-xs text-gray-600">
                  <summary class="cursor-pointer hover:text-gray-800">View metadata</summary>
                  <div class="mt-2 space-y-1 pl-2">
                    <p v-if="file.metadata.cameraMake"><strong>Camera:</strong> {{ file.metadata.cameraMake }} {{ file.metadata.cameraModel }}</p>
                    <p v-if="file.metadata.lens"><strong>Lens:</strong> {{ file.metadata.lens }}</p>
                    <p v-if="file.metadata.iso"><strong>ISO:</strong> {{ file.metadata.iso }}</p>
                    <p v-if="file.metadata.aperture"><strong>Aperture:</strong> f/{{ file.metadata.aperture }}</p>
                    <p v-if="file.metadata.shutterSpeed"><strong>Shutter:</strong> {{ file.metadata.shutterSpeed }}s</p>
                    <p v-if="file.metadata.focalLength"><strong>Focal Length:</strong> {{ file.metadata.focalLength }}mm</p>
                    <p v-if="file.metadata.dateTaken"><strong>Date Taken:</strong> {{ new Date(file.metadata.dateTaken).toLocaleString() }}</p>
                    <p v-if="file.metadata.latitude && file.metadata.longitude"><strong>GPS:</strong> {{ file.metadata.latitude.toFixed(6) }}, {{ file.metadata.longitude.toFixed(6) }}</p>
                    <p v-if="file.metadata.width && file.metadata.height"><strong>Dimensions:</strong> {{ file.metadata.width }} x {{ file.metadata.height }}px</p>
                  </div>
                </details>
              </div>
              
              <!-- Remove Button -->
              <button
                @click="removeFile(index)"
                class="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors duration-200"
                title="Remove"
              >
                <Icon name="heroicons:x-circle" class="text-2xl" />
              </button>
            </div>
            
            <!-- Upload Progress -->
            <div v-if="file.uploading" class="mt-3">
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: file.progress + '%' }"
                ></div>
              </div>
              <p class="text-xs text-gray-600 mt-1">Uploading... {{ file.progress }}%</p>
            </div>
            
            <!-- Upload Success -->
            <div v-if="file.uploaded" class="mt-3 flex items-center text-green-600">
              <Icon name="heroicons:check-circle" class="text-xl mr-2" />
              <span class="text-sm">Uploaded successfully</span>
            </div>
            
            <!-- Upload Error -->
            <div v-if="file.error" class="mt-3 flex items-center text-red-600">
              <Icon name="heroicons:exclamation-circle" class="text-xl mr-2" />
              <span class="text-sm">{{ file.error }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            @click="uploadPhotos"
            :disabled="uploading || allUploaded"
            :class="[
              'px-6 py-3 rounded-lg font-semibold transition-colors duration-200',
              uploading || allUploaded
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            ]"
          >
            {{ uploading ? 'Uploading...' : allUploaded ? 'All Uploaded' : 'Upload All Photos' }}
          </button>
          
          <button
            @click="clearAll"
            :disabled="uploading"
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '#imports';
import { ref, computed } from 'vue';
import exifr from 'exifr';

const props = defineProps({
  albumId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['uploaded']);
const { showUpload } = useGalleryState();

const isDragging = ref(false);
const selectedFiles = ref([]);
const uploading = ref(false);
const fileInput = ref(null);

const allUploaded = computed(() => {
  return selectedFiles.value.length > 0 && selectedFiles.value.every(f => f.uploaded);
});

// Handle file drop
const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files).filter(file => 
    file.type.startsWith('image/')
  );
  addFiles(files);
};

// Handle file select from input
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  addFiles(files);
  // Reset input so same file can be selected again
  e.target.value = '';
};

// Extract EXIF metadata from image file
const extractMetadata = async (file) => {
  try {
    const exifData = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      ifd0: true,
      ifd1: true,
      interop: true
    });

    if (!exifData) {
      return null;
    }

    // Extract common metadata fields
    const metadata = {
      exif: exifData, // Store full EXIF as JSON
      cameraMake: exifData.Make || null,
      cameraModel: exifData.Model || null,
      lens: exifData.LensModel || exifData.LensInfo || null,
      iso: exifData.ISO || null,
      shutterSpeed: exifData.ExposureTime ? `1/${Math.round(1 / exifData.ExposureTime)}` : null,
      aperture: exifData.FNumber || null,
      focalLength: exifData.FocalLength || null,
      dateTaken: exifData.DateTimeOriginal || exifData.DateTime || null,
      latitude: exifData.latitude || null,
      longitude: exifData.longitude || null,
      width: exifData.ImageWidth || exifData.ExifImageWidth || null,
      height: exifData.ImageHeight || exifData.ExifImageHeight || null,
      orientation: exifData.Orientation || null,
      fileSize: file.size
    };

    return metadata;
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return null;
  }
};

// Add files to selection
const addFiles = async (files) => {
  for (const file of files) {
    const reader = new FileReader();
    
    // Extract metadata first
    const metadata = await extractMetadata(file);
    
    reader.onload = (e) => {
      selectedFiles.value.push({
        file,
        preview: e.target.result,
        title: '',
        description: '',
        uploading: false,
        uploaded: false,
        progress: 0,
        error: null,
        metadata: metadata
      });
    };
    reader.readAsDataURL(file);
  }
};

// Remove file from selection
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Upload all photos
const uploadPhotos = async () => {
  uploading.value = true;
  let albumCoverId = null;
  let shouldSetCover = false;

  if (props.albumId) {
    try {
      const album = await pb.collection('albums').getOne(props.albumId);
      if (!album.coverPhoto) {
        shouldSetCover = true;
      } else {
        albumCoverId = album.coverPhoto;
      }
    } catch (error) {
      console.error('Error fetching album for cover update:', error);
    }
  }
  
  for (const fileObj of selectedFiles.value) {
    if (fileObj.uploaded) continue; // Skip already uploaded
    
    fileObj.uploading = true;
    fileObj.error = null;
    
    try {
      const formData = new FormData();
      formData.append('photo', fileObj.file);
      formData.append('user', pb.authStore.record?.id); // Set current user as owner
      if (fileObj.title) formData.append('title', fileObj.title);
      if (fileObj.description) formData.append('description', fileObj.description);
      if (props.albumId) formData.append('album', props.albumId);
      
      // Add metadata if available
      if (fileObj.metadata) {
        const metadata = fileObj.metadata;
        
        // Add metadata fields to form data
        if (metadata.exif) formData.append('exif', JSON.stringify(metadata.exif));
        if (metadata.cameraMake) formData.append('cameraMake', metadata.cameraMake);
        if (metadata.cameraModel) formData.append('cameraModel', metadata.cameraModel);
        if (metadata.lens) formData.append('lens', metadata.lens);
        if (metadata.iso) formData.append('iso', metadata.iso.toString());
        if (metadata.shutterSpeed) formData.append('shutterSpeed', metadata.shutterSpeed);
        if (metadata.aperture) formData.append('aperture', metadata.aperture.toString());
        if (metadata.focalLength) formData.append('focalLength', metadata.focalLength.toString());
        if (metadata.dateTaken) {
          // Convert date to ISO string if it's a Date object
          const dateStr = metadata.dateTaken instanceof Date 
            ? metadata.dateTaken.toISOString() 
            : metadata.dateTaken;
          formData.append('dateTaken', dateStr);
        }
        if (metadata.latitude) formData.append('latitude', metadata.latitude.toString());
        if (metadata.longitude) formData.append('longitude', metadata.longitude.toString());
        if (metadata.width) formData.append('width', metadata.width.toString());
        if (metadata.height) formData.append('height', metadata.height.toString());
        if (metadata.orientation) formData.append('orientation', metadata.orientation.toString());
        if (metadata.fileSize) formData.append('fileSize', metadata.fileSize.toString());
      }
      
      // Simulate progress for better UX (PocketBase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        if (fileObj.progress < 90) {
          fileObj.progress += 10;
        }
      }, 100);
      
      const createdPhoto = await pb.collection('photos').create(formData);
      if (props.albumId && shouldSetCover && !albumCoverId) {
        try {
          await pb.collection('albums').update(props.albumId, { coverPhoto: createdPhoto.id });
          albumCoverId = createdPhoto.id;
          shouldSetCover = false;
        } catch (error) {
          console.error('Error setting album cover photo:', error);
        }
      }
      
      clearInterval(progressInterval);
      fileObj.progress = 100;
      fileObj.uploaded = true;
      fileObj.uploading = false;
    } catch (error) {
      console.error('Error uploading photo:', error);
      fileObj.error = 'Upload failed. Please try again.';
      fileObj.uploading = false;
      fileObj.progress = 0;
    }
  }
  
  uploading.value = false;
  
  // Emit event to refresh gallery if all uploads succeeded
  if (selectedFiles.value.every(f => f.uploaded)) {
    emit('uploaded');
    showUpload.value = false;
  }
};

// Clear all files
const clearAll = () => {
  selectedFiles.value = [];
};
</script>

<style scoped>
/* Additional styles if needed */
</style>
