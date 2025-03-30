import React from 'react';
import { Button } from '../components/ui/button';
import { ArrowRight, Code, FilePlus2, Github, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Integrations</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect your projects with these powerful AI technologies and frameworks
            </p>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              className="border-scottie text-scottie hover:bg-scottie-light/20"
              asChild
            >
              <Link to="/integrations">
                View All Integrations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ScottieAI simplifies the process of enhancing your projects with AI capabilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-scottie-light rounded-full flex items-center justify-center mx-auto mb-4">
                <FilePlus2 className="h-8 w-8 text-scottie" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
              <p className="text-muted-foreground">
                Upload your code package in ZIP, RAR, or 7z format to get started.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-scottie-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-scottie" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Integrate</h3>
              <p className="text-muted-foreground">
                Select AI technologies and tools to enhance your project.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-scottie-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-scottie" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Deploy</h3>
              <p className="text-muted-foreground">
                Deploy your enhanced project or download it as a package.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              className="bg-scottie hover:bg-scottie-secondary"
              asChild
            >
              <Link to="/upload">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-scottie text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to build with ScottieAI?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join our community and start enhancing your projects with powerful AI capabilities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-white text-scottie hover:bg-gray-100"
                size="lg"
                asChild
              >
                <Link to="/upload">
                  Start Building
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                size="lg"
                asChild
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="font-bold text-xl">ScottieAI</span>
              <p className="text-sm text-muted-foreground mt-1">
                Build better with AI
              </p>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">
                Projects
              </Link>
              <Link to="/integrations" className="text-sm text-muted-foreground hover:text-foreground">
                Integrations
              </Link>
              <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                Documentation
              </Link>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                GitHub
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ScottieAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
