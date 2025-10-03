import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Transform as TransformIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { imagesAPI } from '../services/api';

const TransformPanel = ({ image, onTransformComplete }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [transformParams, setTransformParams] = useState({
    resize: { width: '', height: '', maintainAspectRatio: true },
    crop: { left: 0, top: 0, width: '', height: '' },
    rotate: { angle: 0 },
    format: { format: 'jpeg', quality: 90 },
    filter: { type: 'none', value: 0 },
    watermark: { text: '', position: 'bottom-right', size: 20, opacity: 0.5 },
    thumbnail: { width: 200, height: 200 }
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (image) {
      setTransformParams(prev => ({
        ...prev,
        resize: {
          ...prev.resize,
          width: image.dimensions.width,
          height: image.dimensions.height
        },
        crop: {
          ...prev.crop,
          width: image.dimensions.width,
          height: image.dimensions.height
        }
      }));
    }
  }, [image]);

  const transformTypes = [
    { label: 'Resize', value: 'resize' },
    { label: 'Crop', value: 'crop' },
    { label: 'Rotate', value: 'rotate' },
    { label: 'Format', value: 'format' },
    { label: 'Filter', value: 'filter' },
    { label: 'Watermark', value: 'watermark' },
    { label: 'Thumbnail', value: 'thumbnail' }
  ];

  const filterTypes = [
    'none', 'blur', 'sharpen', 'greyscale', 'sepia', 'negative', 'vintage'
  ];

  const formatTypes = ['jpeg', 'png', 'webp', 'tiff', 'gif'];

  const watermarkPositions = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const handleParamChange = (type, param, value) => {
    setTransformParams(prev => ({
      ...prev,
      [type]: { ...prev[type], [param]: value }
    }));
  };

  const handleTransform = async () => {
    if (!image) return;

    try {
      setLoading(true);
      const currentType = transformTypes[activeTab].value;
      const params = transformParams[currentType];

      const result = await imagesAPI.transform(image._id, currentType, params);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Image transformed successfully!' });
        // Extract URL from the correct nested structure
        const imageUrl = result.data.transformation?.resultUrl || 
                        result.data.resultUrl || 
                        result.data.transformedImage?.url || 
                        result.data.url;
        setPreviewUrl(imageUrl);
        onTransformComplete && onTransformComplete(result.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to transform image' });
    } finally {
      setLoading(false);
    }
  };

  const renderResizeTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Width"
            type="number"
            value={transformParams.resize.width}
            onChange={(e) => handleParamChange('resize', 'width', parseInt(e.target.value) || '')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Height"
            type="number"
            value={transformParams.resize.height}
            onChange={(e) => handleParamChange('resize', 'height', parseInt(e.target.value) || '')}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={transformParams.resize.maintainAspectRatio}
                onChange={(e) => handleParamChange('resize', 'maintainAspectRatio', e.target.checked)}
              />
            }
            label="Maintain Aspect Ratio"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderCropTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Left Position"
            type="number"
            value={transformParams.crop.left}
            onChange={(e) => handleParamChange('crop', 'left', parseInt(e.target.value) || 0)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Top Position"
            type="number"
            value={transformParams.crop.top}
            onChange={(e) => handleParamChange('crop', 'top', parseInt(e.target.value) || 0)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Width"
            type="number"
            value={transformParams.crop.width}
            onChange={(e) => handleParamChange('crop', 'width', parseInt(e.target.value) || '')}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Height"
            type="number"
            value={transformParams.crop.height}
            onChange={(e) => handleParamChange('crop', 'height', parseInt(e.target.value) || '')}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderRotateTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography gutterBottom>Rotation Angle: {transformParams.rotate.angle}°</Typography>
      <Slider
        value={transformParams.rotate.angle}
        onChange={(e, value) => handleParamChange('rotate', 'angle', value)}
        min={-180}
        max={180}
        step={15}
        marks
        valueLabelDisplay="auto"
      />
    </Box>
  );

  const renderFormatTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              value={transformParams.format.format}
              label="Format"
              onChange={(e) => handleParamChange('format', 'format', e.target.value)}
            >
              {formatTypes.map(format => (
                <MenuItem key={format} value={format}>
                  {format.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Quality: {transformParams.format.quality}%</Typography>
          <Slider
            value={transformParams.format.quality}
            onChange={(e, value) => handleParamChange('format', 'quality', value)}
            min={10}
            max={100}
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderFilterTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={transformParams.filter.type}
              label="Filter Type"
              onChange={(e) => handleParamChange('filter', 'type', e.target.value)}
            >
              {filterTypes.map(filter => (
                <MenuItem key={filter} value={filter}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {transformParams.filter.type === 'blur' && (
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Blur Amount: {transformParams.filter.value}</Typography>
            <Slider
              value={transformParams.filter.value}
              onChange={(e, value) => handleParamChange('filter', 'value', value)}
              min={0.3}
              max={10}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderWatermarkTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Watermark Text"
            value={transformParams.watermark.text}
            onChange={(e) => handleParamChange('watermark', 'text', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Position</InputLabel>
            <Select
              value={transformParams.watermark.position}
              label="Position"
              onChange={(e) => handleParamChange('watermark', 'position', e.target.value)}
            >
              {watermarkPositions.map(pos => (
                <MenuItem key={pos} value={pos}>
                  {pos.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Font Size: {transformParams.watermark.size}px</Typography>
          <Slider
            value={transformParams.watermark.size}
            onChange={(e, value) => handleParamChange('watermark', 'size', value)}
            min={12}
            max={72}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Opacity: {Math.round(transformParams.watermark.opacity * 100)}%</Typography>
          <Slider
            value={transformParams.watermark.opacity}
            onChange={(e, value) => handleParamChange('watermark', 'opacity', value)}
            min={0.1}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderThumbnailTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Width"
            type="number"
            value={transformParams.thumbnail.width}
            onChange={(e) => handleParamChange('thumbnail', 'width', parseInt(e.target.value) || 200)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Height"
            type="number"
            value={transformParams.thumbnail.height}
            onChange={(e) => handleParamChange('thumbnail', 'height', parseInt(e.target.value) || 200)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return renderResizeTab();
      case 1: return renderCropTab();
      case 2: return renderRotateTab();
      case 3: return renderFormatTab();
      case 4: return renderFilterTab();
      case 5: return renderWatermarkTab();
      case 6: return renderThumbnailTab();
      default: return null;
    }
  };

  if (!image) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Select an image to start transforming
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Original Image */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Original Image
              </Typography>
              <Box textAlign="center">
                <img
                  src={`http://localhost:3000${image.url}`}
                  alt={image.originalName}
                  style={{ 
                    maxWidth: '100%', 
                    height: '300px', 
                    objectFit: 'contain',
                    borderRadius: 8 
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {image.originalName} ({image.dimensions.width} × {image.dimensions.height})
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box textAlign="center" minHeight="300px" display="flex" alignItems="center" justifyContent="center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ 
                      maxWidth: '100%', 
                      height: '300px', 
                      objectFit: 'contain',
                      borderRadius: 8 
                    }}
                  />
                ) : (
                  <Typography color="text.secondary">
                    Preview will appear here after transformation
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Transform Controls */}
        <Grid item xs={12}>
          <Paper sx={{ mt: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {transformTypes.map((type, index) => (
                <Tab key={type.value} label={type.label} />
              ))}
            </Tabs>
            <Divider />
            {renderTabContent()}
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <TransformIcon />}
                onClick={handleTransform}
                disabled={loading}
                size="large"
              >
                {loading ? 'Processing...' : 'Apply Transformation'}
              </Button>
              {previewUrl && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => window.open(previewUrl, '_blank')}
                  sx={{ ml: 2 }}
                >
                  Download
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransformPanel;