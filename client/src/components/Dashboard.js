import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Fab,
  Badge,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Photo as GalleryIcon,
  Transform as TransformIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ImageUploader from './ImageUploader';
import ImageGallery from './ImageGallery';
import TransformPanel from './TransformPanel';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalImages: 0,
    totalTransformations: 0,
    storageUsed: 0
  });

  useEffect(() => {
    // Load dashboard stats
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    // This would typically be an API call to get user statistics
    // For now, we'll simulate with placeholder data
    setStats({
      totalImages: 0,
      totalTransformations: 0,
      storageUsed: 0
    });
  };

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab(1); // Switch to gallery tab
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setActiveTab(2); // Switch to transform tab
  };

  const handleTransformComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const StatCard = ({ title, value, subtitle, icon }) => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" color="primary">
              {value}
            </Typography>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ fontSize: 48, color: 'action.active' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.username}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Transform your images with powerful editing tools
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Images"
            value={stats.totalImages}
            subtitle="Total uploaded"
            icon={<GalleryIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Transformations"
            value={stats.totalTransformations}
            subtitle="Total processed"
            icon={<TransformIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Storage"
            value={formatFileSize(stats.storageUsed)}
            subtitle="Space used"
            icon={<UploadIcon />}
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label="Upload" 
              icon={<UploadIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Gallery" 
              icon={
                <Badge badgeContent={stats.totalImages} color="primary">
                  <GalleryIcon />
                </Badge>
              } 
              iconPosition="start"
            />
            <Tab 
              label="Transform" 
              icon={<TransformIcon />} 
              iconPosition="start"
              disabled={!selectedImage}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Upload Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Upload Images
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload your images to start editing. Supported formats: JPEG, PNG, WebP, TIFF, GIF
              </Typography>
              <ImageUploader onUploadComplete={handleUploadComplete} />
            </Box>
          )}

          {/* Gallery Tab */}
          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6">
                    Image Gallery
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View and manage your uploaded images
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setActiveTab(0)}
                >
                  Upload More
                </Button>
              </Box>
              <ImageGallery 
                refreshTrigger={refreshTrigger}
                onImageSelect={handleImageSelect}
              />
            </Box>
          )}

          {/* Transform Tab */}
          {activeTab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6">
                    Transform Image
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Apply powerful transformations to your images
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedImage(null);
                    setActiveTab(1);
                  }}
                >
                  Select Different Image
                </Button>
              </Box>
              <TransformPanel 
                image={selectedImage}
                onTransformComplete={handleTransformComplete}
              />
            </Box>
          )}
        </Box>
      </Card>

      {/* Floating Action Button */}
      {activeTab !== 0 && (
        <Fab
          color="primary"
          aria-label="upload"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setActiveTab(0)}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Dashboard;