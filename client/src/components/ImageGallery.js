import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { imagesAPI } from '../services/api';

const ImageGallery = ({ refreshTrigger, onImageSelect }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, image: null });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadImages();
  }, [refreshTrigger]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const result = await imagesAPI.getAll();
      if (result.success) {
        setImages(result.data.images);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load images' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const result = await imagesAPI.delete(imageId);
      if (result.success) {
        setImages(images.filter(img => img._id !== imageId));
        setMessage({ type: 'success', text: 'Image deleted successfully' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete image' });
    }
    setDeleteDialog({ open: false, image: null });
  };

  const handleImageClick = async (image) => {
    try {
      const metadata = await imagesAPI.getMetadata(image._id);
      setSelectedImage({ ...image, metadata: metadata.data });
    } catch (error) {
      setSelectedImage(image);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No images uploaded yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload some images to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {images.map((image) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={image._id}>
            <Card elevation={2}>
              <CardMedia
                component="img"
                height="200"
                image={`http://localhost:3000${image.url}`}
                alt={image.originalName}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleImageClick(image)}
              />
              <CardContent>
                <Typography variant="subtitle1" noWrap>
                  {image.originalName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {image.dimensions.width} × {image.dimensions.height}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(image.size)}
                </Typography>
                {image.tags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {image.tags.slice(0, 2).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {image.tags.length > 2 && (
                      <Chip
                        label={`+${image.tags.length - 2}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onImageSelect && onImageSelect(image)}
                >
                  Transform
                </Button>
                <Button
                  size="small"
                  startIcon={<InfoIcon />}
                  onClick={() => handleImageClick(image)}
                >
                  Info
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialog({ open: true, image })}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Image Details Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedImage && (
          <>
            <DialogTitle>{selectedImage.originalName}</DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
                <Box flex={1}>
                  <img
                    src={`http://localhost:3000${selectedImage.url}`}
                    alt={selectedImage.originalName}
                    style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                  />
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" gutterBottom>
                    Image Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Filename:</strong> {selectedImage.filename}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Original Name:</strong> {selectedImage.originalName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Size:</strong> {formatFileSize(selectedImage.size)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Dimensions:</strong> {selectedImage.dimensions.width} × {selectedImage.dimensions.height}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedImage.mimetype}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Uploaded:</strong> {new Date(selectedImage.uploadedAt).toLocaleString()}
                  </Typography>
                  
                  {selectedImage.metadata && (
                    <>
                      <Typography variant="h6" sx={{ mt: 2 }}>
                        Technical Details
                      </Typography>
                      <Typography variant="body2">
                        <strong>Format:</strong> {selectedImage.metadata.detailed.format}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Channels:</strong> {selectedImage.metadata.detailed.channels}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Has Alpha:</strong> {selectedImage.metadata.detailed.hasAlpha ? 'Yes' : 'No'}
                      </Typography>
                    </>
                  )}

                  {selectedImage.tags.length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ mt: 2 }}>
                        Tags
                      </Typography>
                      <Box>
                        {selectedImage.tags.map((tag, index) => (
                          <Chip key={index} label={tag} sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => window.open(`http://localhost:3000${selectedImage.url}`, '_blank')}
              >
                Download
              </Button>
              <Button onClick={() => setSelectedImage(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, image: null })}
      >
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.image?.originalName}"?
            This will also delete all transformations of this image.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, image: null })}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => handleDeleteImage(deleteDialog.image._id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageGallery;