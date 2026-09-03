// src/pages/NotFound/NotFoundPage.tsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home,
  ArrowBack,
  ReportProblem
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const MotionPaper = motion(Paper);

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleGoHome = () => {
    navigate('/admin/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Container maxWidth="md">
        <MotionPaper
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{
            p: isMobile ? 4 : 6,
            textAlign: 'center',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #ff6b6b22, #4ecdc422)',
              zIndex: 0
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #45b7d122, #96ded122)',
              zIndex: 0
            }}
          />

          {/* Content */}
          <Box position="relative" zIndex={1}>
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <ReportProblem
                sx={{
                  fontSize: 120,
                  color: '#ff6b6b',
                  mb: 2,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}
              />
            </motion.div>

            {/* Error Code */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: isMobile ? '4rem' : '6rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  mb: 1
                }}
              >
                404
              </Typography>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: '#2c3e50'
                }}
              >
                Page Not Found
              </Typography>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  mb: 1,
                  maxWidth: '500px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                Oops! The page you're looking for doesn't exist.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  opacity: 0.8
                }}
              >
                You tried to access: <strong>{location.pathname}</strong>
              </Typography>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Home />}
                  onClick={handleGoHome}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Go to Dashboard
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBack />}
                  onClick={handleGoBack}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: '#667eea11',
                      borderColor: '#667eea',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Go Back
                </Button>
              </Box>
            </motion.div>

            {/* Additional Help */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: 4,
                  opacity: 0.7
                }}
              >
                If you believe this is an error, please contact the system administrator.
              </Typography>
            </motion.div>
          </Box>
        </MotionPaper>

        {/* Floating elements for visual interest */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            animation: 'float 6s ease-in-out infinite'
          }}
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)'
              }}
            />
          </motion.div>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: '30%',
            right: '15%',
            animation: 'float 8s ease-in-out infinite'
          }}
        >
          <motion.div
            animate={{
              y: [0, -30, 0],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)'
              }}
            />
          </motion.div>
        </Box>
      </Container>

      {/* Add floating animation */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>
    </Box>
  );
};

export default NotFoundPage;