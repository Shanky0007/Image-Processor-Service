import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  TextField,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { imagesAPI } from '../services/api';

const ImageUploader = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tags, setTags] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      
      if (acceptedFiles.length === 1) {
        formData.append('image', acceptedFiles[0]);
      } else {
        acceptedFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      if (tags.trim()) {
        formData.append('tags', tags.trim());
      }

      // Simulate progress (since we don't have real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await imagesAPI[acceptedFiles.length === 1 ? 'upload' : 'uploadMultiple'](formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully uploaded ${acceptedFiles.length} image(s)!`,
        });
        setTags('');
        onUploadSuccess && onUploadSuccess();
      } else {
        setMessage({ type: 'error', text: result.message || 'Upload failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setMessage({ type: '', text: '' });
      }, 3000);
    }
  }, [tags, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.tiff'],
    },
    multiple: true,
    disabled: uploading,
  });

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        📤 Upload Images
      </Typography>

      <Box
        {...getRootProps()}
        sx={{
          border: 2,
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderStyle: 'dashed',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'primary.50' : 'grey.50',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
        
        {isDragActive ? (
          <Typography variant="h6" color="primary">
            Drop the images here...
          </Typography>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Drag & drop images here, or click to select
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports JPEG, PNG, WebP, GIF, TIFF formats
            </Typography>
          </>
        )}

        {acceptedFiles.length > 0 && !uploading && (
          <Box sx={{ mt: 2 }}>
            {acceptedFiles.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        )}
      </Box>

      <TextField
        fullWidth
        margin="normal"
        label="Tags (comma-separated)"
        placeholder="e.g., nature, landscape, photo"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        disabled={uploading}
      />

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {message.text && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}

      {acceptedFiles.length > 0 && !uploading && (
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => onDrop(acceptedFiles)}
        >
          Upload {acceptedFiles.length} Image(s)
        </Button>
      )}
    </Paper>
  );
};

export default ImageUploader;