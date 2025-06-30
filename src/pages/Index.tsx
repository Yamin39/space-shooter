
import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // Redirect to the game HTML file
    window.location.href = '/index.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Loading Space Defender...</h1>
        <p className="text-xl text-muted-foreground">Please wait while the game loads</p>
      </div>
    </div>
  );
};

export default Index;
