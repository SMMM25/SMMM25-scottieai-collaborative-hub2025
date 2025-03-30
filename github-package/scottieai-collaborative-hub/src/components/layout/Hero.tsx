
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Terminal, Zap, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-scottie-light/20 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="scottie-gradient-text">ScottieAI</span> Collaborative Hub
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Build, integrate, and deploy AI-powered applications with a unified platform 
            that simplifies your development workflow.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              className="bg-scottie hover:bg-scottie-secondary px-8"
              asChild
            >
              <Link to="/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload Code
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-scottie text-scottie hover:bg-scottie-light/20"
              asChild
            >
              <Link to="/docs">
                Explore Features <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-card rounded-lg p-6 border shadow-sm">
              <div className="p-2 bg-scottie-light/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-scottie" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Integration</h3>
              <p className="text-muted-foreground">
                Connect to OWL AI, LangChain, and other AI systems for powerful functionality.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border shadow-sm">
              <div className="p-2 bg-scottie-light/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Terminal className="h-6 w-6 text-scottie" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Code Processing</h3>
              <p className="text-muted-foreground">
                Upload code packages and transform them with our advanced tools and frameworks.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border shadow-sm">
              <div className="p-2 bg-scottie-light/30 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-scottie" />
              </div>
              <h3 className="font-semibold text-lg mb-2">One-Click Deploy</h3>
              <p className="text-muted-foreground">
                Seamlessly deploy to Vercel or package as Windows applications with automated workflows.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-scottie to-scottie-secondary opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
      </div>
    </div>
  );
};

export default Hero;
