import { useState, useEffect, useRef } from 'react';

interface MockVideoProps {
  isVisible: boolean;
  onVideoEnd?: () => void;
}

const MockVideo = ({ isVisible, onVideoEnd }: MockVideoProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && videoRef.current && isLoaded) {
      videoRef.current.play().catch(error => {
        console.error('Error playing the video:', error);
      });
      
      // For development: Allow quick testing by enabling this code
      // Uncomment to automatically trigger video end after 2 seconds
      /*
      setTimeout(() => {
        handleVideoEnded();
      }, 2000);
      */
    }
  }, [isVisible, isLoaded]);

  const handleVideoLoaded = () => {
    setIsLoaded(true);
  };
  
  const handleVideoEnded = () => {
    console.log("Video ended, notifying parent component");
    
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: isVisible ? 'flex' : 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        backgroundColor: '#111319'
      }}
    >
      <video
        ref={videoRef}
        src="/media/roast repo.mp4"
        onLoadedData={handleVideoLoaded}
        onEnded={handleVideoEnded}
        style={{
          maxWidth: '60%',
          maxHeight: '60%'
        }}
        controls={false}
        playsInline
      />
    </div>
  );
};

export default MockVideo;
