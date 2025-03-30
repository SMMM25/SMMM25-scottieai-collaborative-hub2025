
import React from 'react';
import { ArrowLeft, BookOpen, Code, Package, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DocsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Documentation</h1>
          <p className="text-muted-foreground mb-8">
            Learn how to use ScottieAI to enhance your development workflow
          </p>
          
          <Tabs defaultValue="getting-started">
            <TabsList className="mb-8">
              <TabsTrigger value="getting-started" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Getting Started
              </TabsTrigger>
              <TabsTrigger value="ai-integrations" className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                AI Integrations
              </TabsTrigger>
              <TabsTrigger value="code-upload" className="flex items-center">
                <Code className="mr-2 h-4 w-4" />
                Code Upload
              </TabsTrigger>
              <TabsTrigger value="deployment" className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                Deployment
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="getting-started" className="space-y-8">
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-semibold mb-4">Welcome to ScottieAI</h2>
                <p className="mb-4">
                  ScottieAI is a collaborative hub that brings together powerful AI tools in a user-friendly interface, 
                  allowing you to easily integrate cutting-edge AI technologies into your projects and deploy them 
                  with minimal effort.
                </p>
                <h3 className="text-xl font-medium mt-6 mb-3">Quick Start Guide</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Upload your code package in ZIP, RAR, or 7z format.</li>
                  <li>Select AI integrations to enhance your project.</li>
                  <li>Process your code with the selected integrations.</li>
                  <li>Deploy your project or download it as a Windows package.</li>
                </ol>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">System Requirements</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Modern web browser (Chrome, Firefox, Edge, Safari)</li>
                  <li>Internet connection</li>
                  <li>For local development: Node.js 14+ and npm/yarn</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-integrations" className="space-y-8">
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-semibold mb-4">Available AI Integrations</h2>
                <p className="mb-6">
                  ScottieAI offers integration with several powerful AI technologies:
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium mb-2">LangChain</h3>
                    <p className="text-muted-foreground">
                      LangChain is a framework for developing applications powered by language models. It enables
                      applications that are context-aware, reason, and learn from their interactions.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-2">OWL AI</h3>
                    <p className="text-muted-foreground">
                      OWL AI provides advanced text and code understanding capabilities. It can analyze and generate
                      code across multiple languages and frameworks.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-2">Hugging Face Transformers</h3>
                    <p className="text-muted-foreground">
                      Access state-of-the-art NLP models for tasks like sentiment analysis, translation, summarization,
                      and more.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-2">ONNX Runtime</h3>
                    <p className="text-muted-foreground">
                      Run optimized machine learning models locally with high performance. Ideal for edge deployments
                      where network connectivity is limited.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="code-upload" className="space-y-8">
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-semibold mb-4">Code Upload Guidelines</h2>
                <p className="mb-6">
                  To ensure successful processing of your code, please follow these guidelines:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Supported File Formats</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>.zip - Standard ZIP compression</li>
                      <li>.rar - RAR compression format</li>
                      <li>.7z - 7-Zip high-compression format</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Project Structure</h3>
                    <p className="text-muted-foreground mb-2">
                      Your code package should include:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>A clear project root directory</li>
                      <li>Properly organized source code files</li>
                      <li>A package.json file (for Node.js projects)</li>
                      <li>Documentation or README explaining your project</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Size Limitations</h3>
                    <p className="text-muted-foreground">
                      The maximum file size for uploads is 50MB. If your project is larger, consider
                      excluding large assets or dependencies that can be installed later.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="deployment" className="space-y-8">
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-semibold mb-4">Deployment Options</h2>
                <p className="mb-6">
                  ScottieAI offers multiple ways to deploy your processed projects:
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium mb-2">Vercel Deployment</h3>
                    <p className="text-muted-foreground mb-2">
                      Deploy web applications directly to Vercel with one click. Ideal for:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Web applications and sites</li>
                      <li>APIs and serverless functions</li>
                      <li>Projects needing fast global CDN distribution</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      Requires linking your Vercel account for seamless deployment.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-2">Windows Package</h3>
                    <p className="text-muted-foreground mb-2">
                      Package your application as a Windows executable. Best for:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Desktop applications</li>
                      <li>Tools that need local system access</li>
                      <li>Offline-capable applications</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      Creates a standalone .exe file that users can download and run directly.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
